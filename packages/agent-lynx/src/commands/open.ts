// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command, InvalidArgumentError } from 'commander';
import { logMonitor, MonitorCode } from '../telemetry.ts';
import { CLIENT_OPTION, type Context, getCommandClient } from './utils.ts';

type OpenCommandOptions = {
  logMonitor?: typeof logMonitor;
  print?: (line: string) => void;
};

export async function runOpenCommand(
  commandClient: CommandClient,
  url: string,
  clientId?: string,
  {
    logMonitor: writeMonitor = logMonitor,
    print = console.log,
  }: OpenCommandOptions = {},
): Promise<void> {
  writeMonitor(MonitorCode.COMMAND_OPEN, {});
  const result = await commandClient.execute('open', {
    url,
    ...(clientId === undefined ? {} : { clientId }),
  });
  if (!result.ok) throw new Error(result.error.message);

  writeMonitor(MonitorCode.COMMAND_OPEN_SUCCESS, { d1: url });
  print(JSON.stringify(result.data.response, null, 2));
}

export function registerOpenCommand(program: Command, context: Context): void {
  const dimension = (value: string): string => {
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new InvalidArgumentError('Expected a positive integer.');
    }
    return value;
  };
  const devicePixelRatio = (value: string): string => {
    const factor = Number(value);
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new InvalidArgumentError('Expected a positive finite number.');
    }
    return value;
  };
  program
    .command('open')
    .description('Open page')
    .option(...CLIENT_OPTION)
    .option(
      '--page-env <path-or-url>',
      'Lynx Simulator page environment: JSON or local .mjs/.js',
    )
    .option(
      '--simulator-window-width <pixels>',
      'Lynx Simulator window width',
      dimension,
    )
    .option(
      '--simulator-window-height <pixels>',
      'Lynx Simulator window height',
      dimension,
    )
    .option('--simulator-windowless', 'Use Lynx Simulator windowless rendering')
    .option(
      '--no-simulator-windowless',
      'Use a visible Lynx Simulator window (macOS)',
    )
    .option(
      '--simulator-dpr <factor>',
      'Lynx Simulator device pixel ratio (windowless only)',
      devicePixelRatio,
    )
    .option(
      '--simulator-window-background-color <color>',
      'Lynx Simulator window background color (ignored in windowless mode)',
    )
    .argument('<url>', 'The url of the page')
    .action(async (url: string, options: {
      client?: string;
      pageEnv?: string;
      simulatorWindowWidth?: string;
      simulatorWindowHeight?: string;
      simulatorWindowless?: boolean;
      simulatorDpr?: string;
      simulatorWindowBackgroundColor?: string;
    }) => {
      if (
        options.simulatorWindowless === false && process.platform === 'linux'
      ) {
        throw new Error('Linux requires windowless rendering.');
      }
      const query = url.startsWith('lynx-simulator:')
        ? new URL(url).searchParams
        : new URLSearchParams({ url });
      if (options.pageEnv !== undefined) {
        query.set('page-env', options.pageEnv);
        query.set('cwd', process.cwd());
      }
      if (options.simulatorWindowWidth !== undefined) {
        query.set('width', options.simulatorWindowWidth);
      }
      if (options.simulatorWindowHeight !== undefined) {
        query.set('height', options.simulatorWindowHeight);
      }
      if (options.simulatorWindowless !== undefined) {
        query.set('windowless', String(options.simulatorWindowless));
      }
      if (options.simulatorDpr !== undefined) {
        query.set('dpr', options.simulatorDpr);
      }
      if (options.simulatorWindowBackgroundColor !== undefined) {
        query.set('background-color', options.simulatorWindowBackgroundColor);
      }
      if (query.size > 1) url = `lynx-simulator://open?${query}`;
      await runOpenCommand(getCommandClient(context), url, options.client);
    });
}
