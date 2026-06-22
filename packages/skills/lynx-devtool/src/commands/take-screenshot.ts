// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { DevtoolClient } from '../sdk.ts';

export function registerTakeScreenshotCommand(
  program: Command,
  client: DevtoolClient,
) {
  program
    .command('take-screenshot')
    .description('Take a screenshot of the current page')
    .option(
      '-c, --client <clientId>',
      'Client ID (optional, will auto-discover if not provided)',
    )
    .option(
      '-s, --session <sessionId>',
      'Session ID (optional, will auto-discover if not provided)',
    )
    .option(
      '--fullscreen',
      'Capture the fullscreen screenshot instead of the lynxview',
    )
    .option(
      '-o, --output <path>',
      'Output file path (default: screenshot-<timestamp>.jpeg)',
    )
    .action(async (options) => {
      const result = await client.takeScreenshot({
        clientId: options.client,
        sessionId: options.session,
        output: options.output,
        fullscreen: options.fullscreen,
      });
      console.log(`Screenshot saved to ${result.output}`);
    });
}
