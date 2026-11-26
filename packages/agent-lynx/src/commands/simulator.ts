// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  callRawCommand,
  type CommandObject,
} from '@lynx-js/devtool-connector/_internal/command';
import { type Command, InvalidArgumentError } from 'commander';
import { setTimeout as delay } from 'node:timers/promises';

function duration(value: string): number {
  const match = /^(\d+)(ms|[smh])?$/.exec(value);
  const units: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
  };
  const ms = Number(match?.[1]) * (units[match?.[2] ?? 'ms'] ?? 1);
  if (!match || !Number.isSafeInteger(ms) || ms < 1 || ms > 2_147_483_647) {
    throw new InvalidArgumentError(
      'Use a positive duration up to 2147483647ms, e.g. 500ms, 30s, or 20m.',
    );
  }
  return ms;
}

export interface RegisterSimulatorCommandOptions {
  callRawCommand?: typeof callRawCommand;
  runHelp?: string;
}

export function registerSimulatorCommand(
  program: Command,
  options: RegisterSimulatorCommandOptions = {},
): void {
  const simulator: Command = program.command('simulator').description(
    'Manage daemon-owned Lynx Simulator processes',
  )
    .hook('preAction', () => {
      if (program.opts()['daemon'] === false) {
        simulator.error('Lynx Simulator commands require daemon mode.');
      }
    });
  const request = async <T = unknown>(
    operation: string,
    params: CommandObject = {},
    timeoutMs = 10_000,
  ): Promise<T> => {
    const result = await (options.callRawCommand ?? callRawCommand)<T>(
      `simulator-${operation}`,
      params,
      { timeoutMs },
    );
    if (!result.ok) simulator.error(result.error.message);
    return result.data;
  };
  const print = (data: unknown): void =>
    console.log(JSON.stringify(data, null, 2));
  simulator.command('run').description(
    'Prepare dependencies on first use and start an empty Lynx Simulator',
  )
    .option(
      '--ttl <duration>',
      'Stop this Lynx Simulator after the given duration',
      duration,
    )
    .option(
      '--jsb <package>',
      'Add a JSB npm package (repeatable; later handlers override)',
      collect,
      [],
    )
    .option(
      '--native-extension <package>',
      'Add a native extension npm package (repeatable)',
      collect,
      [],
    )
    .option(
      '--lynxtron-version <version>',
      'Lynxtron version matching the native extensions',
    )
    .addHelpText(
      'after',
      `
Example (replace these package placeholders):
  agent-lynx simulator run --jsb <jsb-package@version> \\
    --native-extension <native-package@version>

Repeat either flag for multiple packages; later JSB handlers override earlier
names. Pass per-page context/nativeData with open --page-env; mocks take priority.
Usage, package development, and examples: agent-lynx skills get lynx-simulator
${options.runHelp ?? ''}
`,
    )
    .action(async ({ ttl, jsb, nativeExtension, lynxtronVersion }: {
      ttl?: number;
      jsb: string[];
      nativeExtension: string[];
      lynxtronVersion?: string;
    }) => {
      print(
        await request('run', {
          ...(ttl === undefined ? {} : { ttlMs: ttl }),
          jsb,
          nativeExtensions: nativeExtension,
          ...(lynxtronVersion === undefined ? {} : { lynxtronVersion }),
        }, 600_000),
      );
    });
  simulator.command('list').description(
    "List this daemon's Lynx Simulator runs, including exited runs",
  )
    .action(async () => print(await request('list')));
  const descriptions = {
    get: 'Show process metadata, current sessions, and exit details',
    stop: 'Stop only the selected Lynx Simulator',
  };
  for (const operation of ['get', 'stop'] as const) {
    simulator.command(operation).description(descriptions[operation])
      .requiredOption(
        '-c, --client <clientId>',
        'Lynx Simulator client ID returned by run',
      )
      .action(async ({ client }: { client: string; }) =>
        print(
          await request(
            operation,
            { clientId: client },
            operation === 'get' ? 30_000 : 10_000,
          ),
        )
      );
  }
  simulator.command('wait').description(
    'Wait for exit; a timeout leaves the process running',
  )
    .requiredOption(
      '-c, --client <clientId>',
      'Lynx Simulator client ID returned by run',
    )
    .option('--timeout <duration>', 'Maximum wait (ms/s/m/h)', duration, 60_000)
    .action(
      async ({ client, timeout }: { client: string; timeout: number; }) => {
        const deadline = Date.now() + timeout;
        while (true) {
          // Keep each HTTP request short even when waiting for many minutes.
          const slice = Math.min(30_000, Math.max(1, deadline - Date.now()));
          const info = await request<{ endedAt?: string; }>(
            'wait',
            { clientId: client, timeoutMs: slice },
            slice + 10_000,
          );
          if (info.endedAt) return print(info);
          if (Date.now() >= deadline) {
            simulator.error(
              `Timed out waiting for Lynx Simulator ${client}; the process was not stopped.`,
            );
          }
        }
      },
    );
  simulator.command('logs').description(
    'Print process output; follow ends when the process exits',
  )
    .requiredOption(
      '-c, --client <clientId>',
      'Lynx Simulator client ID returned by run',
    )
    .option('-f, --follow', 'Follow new output')
    .action(
      async ({ client, follow }: { client: string; follow?: boolean; }) => {
        let offset = 0;
        let end: number | undefined;
        while (true) {
          const chunk = await request<
            {
              content: string;
              offset: number;
              size: number;
              eof: boolean;
              finished: boolean;
            }
          >(
            'logs',
            {
              clientId: client,
              offset,
            },
          );
          process.stdout.write(Buffer.from(chunk.content, 'base64'));
          offset = chunk.offset;
          end ??= chunk.size;
          if (!follow && offset >= end) break;
          if (chunk.eof) {
            if (!follow || chunk.finished) break;
            await delay(250);
          }
        }
      },
    );
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}
