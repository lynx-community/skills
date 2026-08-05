// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import { captureScreenshot } from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import {
  CLIENT_OPTION,
  type Context,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

export function registerTakeScreenshotCommand(
  program: Command,
  context: Context,
) {
  program
    .command('take-screenshot')
    .description('Take a screenshot of the current page')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--fullscreen',
      'Capture the fullscreen screenshot instead of the lynxview',
    )
    .option(
      '-o, --output <path>',
      'Output file path (default: screenshot-<timestamp>.jpeg)',
    )
    .action(async (options) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );
      const { output, fullscreen } = options;

      const numericSessionId = Number(sessionId);
      const data = await captureScreenshot(
        connector,
        clientId,
        numericSessionId,
        { fullscreen },
      );
      const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
      await fs.writeFile(fileName, Buffer.from(data, 'base64'));

      console.log(`Screenshot saved to ${fileName}`);
    });
}
