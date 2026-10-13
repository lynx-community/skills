// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "../index.ts";
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
import { ActionCore } from "./core.ts";
import type { CommandResult } from "./result.ts";
import { getDefaultCommandTimeoutMs } from "./timeout.ts";

/** Invoke the same ActionCore without crossing the daemon HTTP boundary. */
export class InProcessCommandClient implements CommandClient {
  readonly #connector: Connector;
  readonly #core: ActionCore;

  constructor(connector: Connector, core: ActionCore = new ActionCore()) {
    this.#connector = connector;
    this.#core = core;
  }

  execute<Action extends CommandAction>(
    action: Action,
    params: CommandParams<Action>,
    options: { timeoutMs?: number } = {},
  ): Promise<CommandResult<CommandData<Action>>> {
    const commandParams = params as CommandObject;
    const signal = AbortSignal.timeout(options.timeoutMs ?? getDefaultCommandTimeoutMs(action, commandParams));
    return this.#core.execute(
      action,
      commandParams,
      { connector: this.#connector },
      signal,
    ) as Promise<CommandResult<CommandData<Action>>>;
  }

  stream<Action extends StreamCommandAction>(
    action: Action,
    params: StreamCommandParams<Action>,
    options: { signal?: AbortSignal; method?: "GET" | "POST" } = {},
  ): AsyncGenerator<CommandResult<StreamCommandEvent<Action>>> {
    const signal = options.signal ?? new AbortController().signal;
    return this.#core.stream(
      action,
      params as CommandObject,
      { connector: this.#connector },
      signal,
    ) as AsyncGenerator<CommandResult<StreamCommandEvent<Action>>>;
  }
}
