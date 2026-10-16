// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { captureScreenshot } from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import fs from 'node:fs/promises';
import { logMonitor, MonitorCode } from '../telemetry.ts';
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
      logMonitor(MonitorCode.COMMAND_TAKE_SCREENSHOT, {
        d1: fullscreen ? 'fullscreen' : 'lynxview',
      });

      const numericSessionId = Number(sessionId);
      const data = await captureScreenshot(
        connector,
        clientId,
        numericSessionId,
        { fullscreen },
      );
      const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
      await fs.writeFile(fileName, Buffer.from(data, 'base64'));

      logMonitor(MonitorCode.COMMAND_TAKE_SCREENSHOT_SUCCESS, { d1: fileName });

      console.log(`Screenshot saved to ${fileName}`);
    });
}
