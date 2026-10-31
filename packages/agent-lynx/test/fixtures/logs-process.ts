// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';

import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import {
  InterruptedLogOutputError,
  registerLogsCommand,
} from '../../src/commands/logs.ts';

Connector.prototype.sendCDPStream = async (
  _client,
  _session,
  _input,
  options,
) => {
  let timer: NodeJS.Timeout;
  let blockedTicks = 0;
  const stream = new ReadableStream({
    start(controller) {
      timer = setInterval(() => {
        if (process.argv[2] !== 'silent') {
          controller.enqueue({
            method: 'HSR.messageReceived',
            params: { message: 'x'.repeat(65536) },
          });
          if (process.argv[2] === 'blocked') {
            blockedTicks = process.stdout.writableLength > 0
              ? blockedTicks + 1
              : 0;
            if (blockedTicks === 10) process.stderr.write('Output blocked.\n');
          }
        }
      }, 10);
      options?.signal?.addEventListener('abort', () => {
        clearInterval(timer);
        controller.error(options.signal?.reason);
      }, { once: true });
    },
    cancel() {
      clearInterval(timer);
    },
  });
  return Object.assign(stream, {
    inputClosed: Promise.resolve(),
    async [Symbol.asyncDispose]() {
      clearInterval(timer);
      process.stderr.write('Subscription disposed.\n');
    },
  });
};

const program = new Command();
registerLogsCommand(program, { transports: [] });
try {
  await program.parseAsync([
    'node',
    'test',
    'logs',
    '--client',
    'test:8901',
    '--follow',
    '--json',
  ]);
} catch (error) {
  if (error instanceof InterruptedLogOutputError) process.exit(0);
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
}
