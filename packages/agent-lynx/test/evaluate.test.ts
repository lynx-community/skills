// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import {
  registerEvaluateCommand,
  wrapExpression,
} from '../src/commands/evaluate.ts';
import type { Context } from '../src/commands/utils.ts';

interface SentCDPMessage {
  clientId: string;
  sessionId: number;
  method: string;
  params: Record<string, unknown>;
  isMainThread: boolean;
}

describe('evaluate', () => {
  test('forwards the original expression on the main VM and returns by value by default', async (t) => {
    const sentMessages: SentCDPMessage[] = [];
    t.mock.method(
      Connector.prototype,
      'sendCDPMessage',
      async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
        isMainThread = false,
      ) => {
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params: params as Record<string, unknown>,
          isMainThread,
        });
        return { result: { type: 'object', value: { answer: 42 } } };
      },
    );

    const lines: string[] = [];
    t.mock.method(console, 'log', (line: string) => lines.push(line));

    const context: Context = { transports: [] };
    const program = new Command();
    program.exitOverride();
    registerEvaluateCommand(program, context);

    await program.parseAsync([
      'node',
      'test',
      'evaluate',
      '2 + 2',
      '--client',
      'test-client',
      '--session',
      '7',
      '--thread',
      'main',
      '--silent',
      '--context-id',
      '3',
      '--throw-on-side-effect',
      '--generate-preview',
      '--object-group',
      'cli',
      '--await-promise',
      '--include-command-line-api',
    ]);

    assert.deepEqual(sentMessages, [
      {
        clientId: 'test-client',
        sessionId: 7,
        method: 'Runtime.evaluate',
        params: {
          expression: '2 + 2',
          silent: true,
          contextId: 3,
          throwOnSideEffect: true,
          generatePreview: true,
          objectGroup: 'cli',
          returnByValue: true,
          awaitPromise: true,
          includeCommandLineAPI: true,
        },
        isMainThread: true,
      },
    ]);
    assert.deepEqual(JSON.parse(lines[0]!), {
      result: { type: 'object', value: { answer: 42 } },
    });
  });

  test('supports returning a remote object reference', async (t) => {
    const sentMessages: SentCDPMessage[] = [];
    t.mock.method(
      Connector.prototype,
      'sendCDPMessage',
      async (
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown>,
        isMainThread = false,
      ) => {
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params: params as Record<string, unknown>,
          isMainThread,
        });
        return { result: { type: 'object', objectId: 'remote-object-id' } };
      },
    );
    t.mock.method(console, 'log', () => {});

    const context: Context = { transports: [] };
    const program = new Command();
    program.exitOverride();
    registerEvaluateCommand(program, context);

    await program.parseAsync([
      'node',
      'test',
      'evaluate',
      '({ answer: 42 })',
      '--client',
      'test-client',
      '--session',
      '7',
      '--no-return-by-value',
    ]);

    assert.equal(sentMessages[0]?.params['returnByValue'], false);
    assert.equal(
      sentMessages[0]?.params['expression'],
      '(function(){var __a=globalThis.multiApps&&globalThis.multiApps[globalThis.currentDebugAppId||globalThis.currentAppId];var lynx=__a&&__a.lynx,nativeLynx=lynx&&lynx.getNativeLynx();return(({ answer: 42 }));})()',
    );
    assert.equal(sentMessages[0]?.isMainThread, false);
  });

  for (const [name, runtimeGlobal] of [
    ['multiApps is unavailable', {}],
    [
      'the current app has no lynx object',
      { multiApps: { app: {} }, currentAppId: 'app' },
    ],
  ] as const) {
    test(`evaluates unrelated expressions when ${name}`, () => {
      assert.equal(
        runInNewContext(wrapExpression('2 + 2'), { globalThis: runtimeGlobal }),
        4,
      );
    });
  }
});
