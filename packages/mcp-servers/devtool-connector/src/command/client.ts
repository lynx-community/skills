// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { DaemonManager, DEFAULT_DAEMON_PORT } from "../daemon/manager.ts";
import type {
  CommandAction,
  CommandClient,
  CommandData,
  CommandObject,
  CommandParams,
  StreamCommandAction,
  StreamCommandEvent,
  StreamCommandParams,
} from "./contract.ts";
import { appendCommandQueryParam } from "./query.ts";
import { type CommandResult, fail } from "./result.ts";
import { DEFAULT_COMMAND_TIMEOUT_MS, getDefaultCommandTimeoutMs } from "./timeout.ts";

const MAX_SSE_BUFFER_LENGTH = 1024 * 1024;

export interface CommandCallOptions {
  port?: number;
  timeoutMs?: number;
  ensureDaemon?: boolean;
}

export interface CommandStreamOptions {
  port?: number;
  signal?: AbortSignal;
  ensureDaemon?: boolean;
  method?: "GET" | "POST";
}

async function responseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function httpFailure(action: string, response: Response, body: string): CommandResult<never> {
  const suffix = body.trim() ? `: ${body.trim()}` : "";
  return fail(
    action,
    `Daemon command ${action} failed with HTTP ${response.status} ${response.statusText}${suffix}`,
    {
      reason: "http-error",
      recoverable: true,
      nextActions: [
        "Ensure the connector daemon is running and up to date.",
        "Retry after restarting the connector daemon.",
      ],
    },
  );
}

function isCommandResult(value: unknown): value is CommandResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate["action"] !== "string" || typeof candidate["ok"] !== "boolean") return false;
  if (candidate["ok"] === true) return Object.hasOwn(candidate, "data");

  const error = candidate["error"];
  if (typeof error !== "object" || error === null) return false;
  const commandError = error as Record<string, unknown>;
  return typeof commandError["message"] === "string"
    && typeof commandError["recoverable"] === "boolean"
    && Array.isArray(commandError["nextActions"])
    && commandError["nextActions"].every(item => typeof item === "string")
    && (commandError["reason"] === undefined || typeof commandError["reason"] === "string");
}

function invalidResponse(action: string, message: string, cause?: unknown): CommandResult<never> {
  return fail(action, message, {
    reason: "invalid-response",
    recoverable: true,
    ...(cause === undefined ? {} : { cause }),
    nextActions: ["Restart the connector daemon, then retry the command."],
  });
}

function requestFailure(action: string, error: unknown, signal?: AbortSignal): CommandResult<never> {
  const aborted = signal?.aborted === true
    || (error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError"));
  return fail(
    action,
    aborted
      ? `Daemon command ${action} was aborted or timed out.`
      : `Unable to reach the connector daemon for command ${action}.`,
    {
      cause: error,
      reason: aborted ? "aborted" : "daemon-unavailable",
      recoverable: true,
      nextActions: [
        "Ensure the connector daemon is running and up to date.",
        "Retry after restarting the connector daemon.",
      ],
    },
  );
}

export function callRawCommand<T = unknown>(
  action: string,
  params: CommandObject,
  options: CommandCallOptions = {},
): Promise<CommandResult<T>> {
  return new HttpCommandClient(options).executeRaw<T>(action, params, options);
}

export function callCommand<Action extends CommandAction>(
  action: Action,
  params: CommandParams<Action>,
  options: CommandCallOptions = {},
): Promise<CommandResult<CommandData<Action>>> {
  return callRawCommand<CommandData<Action>>(action, params as CommandObject, {
    ...options,
    timeoutMs: options.timeoutMs ?? getDefaultCommandTimeoutMs(action, params as CommandObject),
  });
}

function getStreamUrl(port: number, action: string, params: CommandObject): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) appendCommandQueryParam(query, key, value);
  const suffix = query.size > 0 ? `?${query}` : "";
  return `http://127.0.0.1:${port}/command/${encodeURIComponent(action)}${suffix}`;
}

export function streamRawCommand<T = unknown>(
  action: string,
  params: CommandObject,
  options: CommandStreamOptions = {},
): AsyncGenerator<CommandResult<T>> {
  return new HttpCommandClient(options).streamRaw<T>(action, params, options);
}

export function streamCommand<Action extends StreamCommandAction>(
  action: Action,
  params: StreamCommandParams<Action>,
  options: CommandStreamOptions = {},
): AsyncGenerator<CommandResult<StreamCommandEvent<Action>>> {
  return streamRawCommand<StreamCommandEvent<Action>>(action, params as CommandObject, options);
}

export class HttpCommandClient implements CommandClient {
  readonly #port: number;
  readonly #ensureDaemon: boolean;

  constructor(options: { port?: number; ensureDaemon?: boolean } = {}) {
    this.#port = options.port ?? DEFAULT_DAEMON_PORT;
    this.#ensureDaemon = options.ensureDaemon ?? true;
  }

  execute<Action extends CommandAction>(
    action: Action,
    params: CommandParams<Action>,
    options: Omit<CommandCallOptions, "port" | "ensureDaemon"> = {},
  ): Promise<CommandResult<CommandData<Action>>> {
    return this.executeRaw<CommandData<Action>>(action, params as CommandObject, {
      ...options,
      timeoutMs: options.timeoutMs ?? getDefaultCommandTimeoutMs(action, params as CommandObject),
    });
  }

  stream<Action extends StreamCommandAction>(
    action: Action,
    params: StreamCommandParams<Action>,
    options: Omit<CommandStreamOptions, "port" | "ensureDaemon"> = {},
  ): AsyncGenerator<CommandResult<StreamCommandEvent<Action>>> {
    return this.streamRaw<StreamCommandEvent<Action>>(action, params as CommandObject, options);
  }

  protected async ensureDaemonRunning(port: number): Promise<void> {
    await DaemonManager.ensureRunning(port, { commandProtocol: true });
  }

  async executeRaw<T = unknown>(
    action: string,
    params: CommandObject,
    options: Omit<CommandCallOptions, "port" | "ensureDaemon"> = {},
  ): Promise<CommandResult<T>> {
    const port = this.#port;
    const signal = AbortSignal.timeout(options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS);
    let response: Response;
    try {
      if (this.#ensureDaemon) await this.ensureDaemonRunning(port);
      response = await fetch(`http://127.0.0.1:${port}/command/${encodeURIComponent(action)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(params),
        signal,
      });
    } catch (error) {
      return requestFailure(action, error, signal);
    }
    if (!response.ok) return httpFailure(action, response, await responseText(response));

    try {
      const parsed: unknown = await response.json();
      if (isCommandResult(parsed)) return parsed as CommandResult<T>;
      return invalidResponse(action, `Daemon command ${action} returned an invalid result envelope.`);
    } catch (error) {
      return invalidResponse(action, `Daemon command ${action} returned invalid JSON.`, error);
    }
  }

  async *streamRaw<T = unknown>(
    action: string,
    params: CommandObject,
    options: Omit<CommandStreamOptions, "port" | "ensureDaemon"> = {},
  ): AsyncGenerator<CommandResult<T>> {
    const port = this.#port;
    const method = options.method ?? "POST";
    let response: Response;
    try {
      options.signal?.throwIfAborted();
      if (this.#ensureDaemon) await this.ensureDaemonRunning(port);
      response = await fetch(
        method === "GET"
          ? getStreamUrl(port, action, params)
          : `http://127.0.0.1:${port}/command/${encodeURIComponent(action)}`,
        {
          method,
          headers: {
            accept: "text/event-stream",
            ...(method === "POST" ? { "content-type": "application/json" } : {}),
          },
          ...(method === "POST" ? { body: JSON.stringify(params) } : {}),
          ...(options.signal ? { signal: options.signal } : {}),
        },
      );
    } catch (error) {
      yield requestFailure(action, error, options.signal);
      return;
    }

    if (!response.ok) {
      yield httpFailure(action, response, await responseText(response));
      return;
    }
    if (!response.body) {
      yield fail(action, `Daemon stream ${action} returned no response body.`, {
        reason: "invalid-response",
        recoverable: true,
      });
      return;
    }
    if (!response.headers.get("content-type")?.toLowerCase().startsWith("text/event-stream")) {
      yield fail(action, `Daemon stream ${action} returned a non-SSE response.`, {
        reason: "invalid-response",
        recoverable: true,
      });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    const drainDataEvents = function*(): Generator<string> {
      for (let match = /\r?\n\r?\n/.exec(buffer); match !== null; match = /\r?\n\r?\n/.exec(buffer)) {
        const rawEvent = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const data = rawEvent
          .split(/\r?\n/)
          .filter(line => line.startsWith("data:"))
          .map(line => line.slice(5).trimStart())
          .join("\n");
        if (data !== "") yield data;
      }
    };

    const parseEvent = (data: string): CommandResult<T> => {
      try {
        const parsed: unknown = JSON.parse(data);
        if (!isCommandResult(parsed)) throw new Error("SSE data is not a command result envelope.");
        return parsed as CommandResult<T>;
      } catch (error) {
        return invalidResponse(action, `Daemon stream ${action} returned invalid SSE data.`, error);
      }
    };

    const reader = response.body.getReader();
    let completed = false;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          completed = true;
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        if (buffer.length > MAX_SSE_BUFFER_LENGTH) {
          yield invalidResponse(action, `Daemon stream ${action} exceeded the 1 MiB SSE event limit.`);
          return;
        }
        for (const data of drainDataEvents()) {
          const event = parseEvent(data);
          yield event;
          if (!event.ok && event.error.reason === "invalid-response") return;
        }
      }

      buffer += decoder.decode();
      if (buffer.length > MAX_SSE_BUFFER_LENGTH) {
        yield invalidResponse(action, `Daemon stream ${action} exceeded the 1 MiB SSE event limit.`);
        return;
      }
      if (buffer.trim() !== "") buffer += "\n\n";
      for (const data of drainDataEvents()) {
        const event = parseEvent(data);
        yield event;
        if (!event.ok && event.error.reason === "invalid-response") return;
      }
    } finally {
      if (!completed) {
        await reader.cancel(new Error("Command stream consumer stopped.")).catch(() => {});
      }
      reader.releaseLock();
    }
  }
}
