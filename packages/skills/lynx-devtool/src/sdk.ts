// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import { ReadableStream } from 'node:stream/web';
import { setTimeout } from 'node:timers/promises';
import { Connector } from '@lynx-js/devtool-connector';
import {
  AndroidTransport,
  type Client as ConnectorClient,
  DesktopTransport,
  iOSTransport,
  type Transport,
} from '@lynx-js/devtool-connector/transport';

export interface DevtoolClientInfo extends ConnectorClient {
  port?: number;
}

export interface DevtoolSessionInfo {
  session_id: number;
  type?: string;
  url?: string;
}

export interface CdpCommandOptions {
  clientId?: string;
  sessionId?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface AppCommandOptions {
  clientId?: string;
  method: string;
  params?: Record<string, unknown>;
}

export interface ListSessionsOptions {
  clientId?: string;
}

export interface OpenPageOptions {
  clientId?: string;
  url: string;
}

export interface GetConsoleOptions {
  clientId?: string;
  sessionId?: number | string;
  offset?: number;
  limit?: number;
  includeStackTraces?: boolean;
  level?: string[];
}

export interface ConsoleCallFrame {
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export interface ConsoleStackTrace {
  callFrames: ConsoleCallFrame[];
}

export interface ConsoleArg {
  type: string;
  value?: unknown;
  className?: string;
  description?: string;
  objectId?: string;
  subtype?: string;
}

export interface ConsoleMessage {
  type: string;
  args: ConsoleArg[];
  stackTrace?: ConsoleStackTrace;
  url?: string;
}

export interface GetSourcesOptions {
  clientId?: string;
  sessionId?: number | string;
}

export interface ScriptSource {
  scriptId: string;
  url: string;
}

export interface TakeScreenshotOptions {
  clientId?: string;
  sessionId?: number | string;
  fullscreen?: boolean;
  output?: string;
}

export interface ScreenshotResult {
  output: string;
}

export interface DevtoolClient {
  listClients(): Promise<DevtoolClientInfo[]>;
  listSessions(options?: ListSessionsOptions): Promise<DevtoolSessionInfo[]>;
  cdp(options: CdpCommandOptions): Promise<unknown>;
  app(options: AppCommandOptions): Promise<unknown>;
  open(options: OpenPageOptions): Promise<unknown>;
  getConsole(options?: GetConsoleOptions): Promise<ConsoleMessage[]>;
  getSources(options?: GetSourcesOptions): Promise<ScriptSource[]>;
  takeScreenshot(options?: TakeScreenshotOptions): Promise<ScreenshotResult>;
  close(): Promise<void>;
}

export interface DevtoolClientOptions {
  connector?: Connector;
  operationTimeoutMs?: number;
  transports?: Transport[];
}

interface ScriptParsedEvent {
  scriptId: string;
  url: string;
  [key: string]: unknown;
}

function getAndroidTransportSpec(): { host: string; port: number } {
  const { ADB_SERVER_HOST, ADB_SERVER_PORT } = process.env;
  const port = Number.parseInt(ADB_SERVER_PORT ?? '5037', 10);

  return {
    host: ADB_SERVER_HOST ?? '127.0.0.1',
    port: Number.isInteger(port) && port > 0 ? port : 5037,
  };
}

export function createDefaultTransports(): Transport[] {
  return [
    new AndroidTransport(getAndroidTransportSpec()),
    new DesktopTransport(),
    new iOSTransport(),
  ];
}

export function createDevtoolClient(
  options: DevtoolClientOptions = {},
): DevtoolClient {
  const transports =
    options.transports ?? (options.connector ? [] : createDefaultTransports());
  const connector = options.connector ?? new Connector(transports);

  return new ConnectorDevtoolClient(
    connector,
    transports,
    options.operationTimeoutMs,
  );
}

class ConnectorDevtoolClient implements DevtoolClient {
  constructor(
    private readonly connector: Connector,
    private readonly transports: Transport[],
    private readonly operationTimeoutMs: number | undefined,
  ) {}

  async listClients(): Promise<DevtoolClientInfo[]> {
    return this.withOperationTimeout(
      this.connector.listClients() as Promise<DevtoolClientInfo[]>,
      'list clients',
    );
  }

  async listSessions(
    options: ListSessionsOptions = {},
  ): Promise<DevtoolSessionInfo[]> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    return this.withOperationTimeout(
      this.connector.sendListSessionMessage(clientId) as Promise<
        DevtoolSessionInfo[]
      >,
      `list sessions for client ${clientId}`,
    );
  }

  async cdp(options: CdpCommandOptions): Promise<unknown> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    const sessionId =
      options.sessionId ?? (await this.getLatestSessionId(clientId));

    return this.withOperationTimeout(
      this.connector.sendCDPMessage(
        clientId,
        Number(sessionId),
        options.method,
        options.params ?? {},
      ),
      `send CDP method ${options.method}`,
    );
  }

  async app(options: AppCommandOptions): Promise<unknown> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    return this.withOperationTimeout(
      this.connector.sendAppMessage(
        clientId,
        options.method,
        options.params ?? {},
      ),
      `send App method ${options.method}`,
    );
  }

  async open(options: OpenPageOptions): Promise<unknown> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    const openCardMessage = {
      event: 'Customized',
      data: {
        type: 'OpenCard',
        data: {
          type: 'url',
          url: options.url,
        },
        sender: -1,
      },
      from: -1,
    } as const;

    try {
      return await this.withOperationTimeout(
        this.connector.sendMessage(clientId, openCardMessage),
        `open URL ${options.url}`,
      );
    } catch {
      return this.withOperationTimeout(
        this.connector.sendAppMessage(clientId, 'App.openPage', {
          url: options.url,
        }),
        `open URL ${options.url} with App.openPage`,
      );
    }
  }

  async getConsole(options: GetConsoleOptions = {}): Promise<ConsoleMessage[]> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    const sessionId =
      options.sessionId ?? (await this.getLatestSessionId(clientId));
    const limit = options.limit
      ? Math.max(1, Math.min(100, options.limit))
      : undefined;
    const offset = options.offset ?? 0;
    const allowedLevels = options.level ?? ['info', 'log', 'warning', 'error'];
    const numericSessionId = Number(sessionId);

    await using stream = await this.withOperationTimeout(
      this.connector.sendCDPStream(
        clientId,
        ReadableStream.from([
          {
            sessionId: numericSessionId,
            method: 'Page.enable',
          },
          {
            sessionId: numericSessionId,
            method: 'Runtime.enable',
          },
        ]),
      ),
      'start console stream',
    );

    const messages: ConsoleMessage[] = [];
    let skipped = 0;

    const reader = stream.getReader();
    const idleTimeout = 500;
    const maxTotalTime = 5000;
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < maxTotalTime) {
        const result = await Promise.race([
          reader.read(),
          setTimeout(idleTimeout, 'timeout' as const),
        ]);
        if (result === 'timeout') {
          await reader.cancel();
          break;
        }

        const { done, value } = result;
        if (done) break;

        if (value.method === 'Runtime.consoleAPICalled') {
          const params = value.params as ConsoleMessage;
          if (allowedLevels.includes(params.type)) {
            if (skipped < offset) {
              skipped++;
              continue;
            }

            if (!options.includeStackTraces && params.type !== 'error') {
              delete params.stackTrace;
            }

            messages.push(params);

            if (limit && messages.length >= limit) {
              await reader.cancel();
              break;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return messages;
  }

  async getSources(options: GetSourcesOptions = {}): Promise<ScriptSource[]> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    const sessionId =
      options.sessionId ?? (await this.getLatestSessionId(clientId));
    const numericSessionId = Number(sessionId);

    const messages: { sessionId: number; method: string }[] = [
      {
        sessionId: numericSessionId,
        method: 'Debugger.disable',
      },
      {
        sessionId: numericSessionId,
        method: 'Debugger.enable',
      },
    ];

    await using stream = await this.withOperationTimeout(
      this.connector.sendCDPStream(clientId, ReadableStream.from(messages)),
      'start source stream',
    );

    const scripts: ScriptParsedEvent[] = [];
    const reader = stream.getReader();
    const idleTimeout = 2000;
    const maxTotalTime = 5000;
    const startTime = Date.now();

    try {
      while (Date.now() - startTime < maxTotalTime) {
        const result = await Promise.race([
          reader.read(),
          setTimeout(idleTimeout, 'timeout' as const),
        ]);
        if (result === 'timeout') {
          await reader.cancel();
          break;
        }

        const { done, value } = result;
        if (done) break;

        if (value.method === 'Debugger.scriptParsed') {
          scripts.push(value.params as ScriptParsedEvent);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return scripts.map(({ scriptId, url }) => ({ scriptId, url }));
  }

  async takeScreenshot(
    options: TakeScreenshotOptions = {},
  ): Promise<ScreenshotResult> {
    const clientId = options.clientId ?? (await this.getFirstClientId());
    const sessionId =
      options.sessionId ?? (await this.getLatestSessionId(clientId));
    const numericSessionId = Number(sessionId);
    const signal = AbortSignal.timeout(10_000);
    const { promise, resolve } = Promise.withResolvers<void>();

    await using stream = await this.connector.sendCDPStream(
      clientId,
      new ReadableStream({
        async start(controller) {
          controller.enqueue({
            method: 'Page.startScreencast',
            params: {
              format: 'jpeg',
              quality: 80,
              mode: options.fullscreen ? 'fullscreen' : 'lynxview',
            },
            sessionId: numericSessionId,
          });
          await Promise.race([
            promise,
            setTimeout(10_000, void 0, { ref: false }),
          ]);
          controller.enqueue({
            method: 'Page.stopScreencast',
            sessionId: numericSessionId,
          });
          controller.close();
        },
      }),
      { signal },
    );

    for await (const { method, params: eventParams } of stream) {
      if (method === 'Page.screencastFrame') {
        const { data } = eventParams as { data: string };
        if (data) {
          resolve();

          const output = options.output ?? `screenshot-${Date.now()}.jpeg`;
          await fs.writeFile(output, Buffer.from(data, 'base64'));
          return { output };
        }
      }
    }

    throw new Error(
      'Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.',
    );
  }

  async close(): Promise<void> {
    await Promise.allSettled(
      this.transports.map((transport) => transport.close()),
    );
  }

  private async getFirstClientId(): Promise<string> {
    const clients = await this.listClients();
    const firstClient = clients[0];
    if (!firstClient) {
      throw new Error('No available clients found.');
    }
    return firstClient.id;
  }

  private async getLatestSessionId(clientId: string): Promise<string> {
    const sessions = await this.listSessions({ clientId });
    if (sessions.length === 0) {
      throw new Error(`No available sessions found for client: ${clientId}`);
    }
    const latestSession = sessions.reduce((max, session) =>
      session.session_id > max.session_id ? session : max,
    );
    return String(latestSession.session_id);
  }

  private async withOperationTimeout<T>(
    promise: Promise<T>,
    operation: string,
  ): Promise<T> {
    if (!this.operationTimeoutMs) {
      return promise;
    }

    return Promise.race([
      promise,
      setTimeout(this.operationTimeoutMs, undefined, { ref: false }).then(
        () => {
          throw new Error(
            `Timed out while trying to ${operation} after ${this.operationTimeoutMs}ms.`,
          );
        },
      ),
    ]);
  }
}
