// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { writeFile } from 'node:fs/promises';
import {
  fail,
  type ScreenshotAnnotation,
  type SnapshotData,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
} from './utils.ts';

export interface ScreenshotCommandResult {
  clientId: string;
  sessionId: number;
  path: string;
  width?: number;
  height?: number;
  snapshot?: SnapshotData;
  annotations?: ScreenshotAnnotation[];
}

export function registerScreenshotCommand(
  program: Command,
  context: Context,
): void {
  const command = program
    .command('screenshot')
    .description(
      'Capture a screenshot, optionally annotated with fresh snapshot refs.',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--fullscreen',
      'Capture in fullscreen mode instead of LynxView mode.',
    )
    .option(
      '--annotate',
      'Refresh snapshot refs and draw numbered labels into the screenshot.',
    )
    .option(
      '-o, --output <path>',
      'JPEG output path (default: screenshot-<timestamp>.jpeg).',
    )
    .option(...JSON_OPTION);

  command.action(
    async (options: {
      client?: string;
      session?: string;
      fullscreen?: boolean;
      annotate?: boolean;
      output?: string;
      json?: boolean;
    }) => {
      await runSnapshotCommand<ScreenshotCommandResult>(
        'screenshot',
        command,
        options,
        async () => {
          const result = await getCommandClient(context).execute('screenshot', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            fullscreen: options.fullscreen ?? false,
            annotate: options.annotate ?? false,
          });
          if (!result.ok) return result;

          const filePath = options.output ?? `screenshot-${Date.now()}.jpeg`;
          const jpeg = Buffer.from(result.data.jpegBase64, 'base64');
          const data: ScreenshotCommandResult = {
            clientId: result.data.clientId,
            sessionId: result.data.sessionId,
            path: filePath,
          };

          if (options.annotate) {
            if (
              !result.data.annotations ||
              !result.data.snapshot ||
              result.data.width === undefined ||
              result.data.height === undefined
            ) {
              return fail(
                'screenshot',
                'The connector returned no fresh snapshot or annotation metadata for --annotate.',
                {
                  reason: 'invalid-response',
                  recoverable: true,
                  nextActions: ['Restart the connector daemon and retry.'],
                },
              );
            }
            data.width = result.data.width;
            data.height = result.data.height;
            data.snapshot = result.data.snapshot;
            data.annotations = result.data.annotations;
          }
          await writeFile(filePath, jpeg);

          return {
            ok: true,
            action: 'screenshot',
            data,
          };
        },
        (data) => {
          if (data.annotations) {
            return `Annotated screenshot (${data.annotations.length} refs) saved to ${data.path}`;
          }
          return `Screenshot saved to ${data.path}`;
        },
      );
    },
  );
}
