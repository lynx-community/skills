// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import {
  registerEvaluateCommand,
  wrapExpression,
} from '../src/commands/evaluate.ts';
import type { Context } from '../src/commands/utils.ts';
import { evaluateExpression } from '../src/evaluate-expression.ts';

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
        params: unknown,
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

    assert.deepEqual(sentMessages, [{
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
    }]);
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
        params: unknown,
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

    assert.deepEqual(sentMessages, [
      {
        clientId: 'test-client',
        sessionId: 7,
        method: 'Debugger.enable',
        params: {},
        isMainThread: false,
      },
      {
        clientId: 'test-client',
        sessionId: 7,
        method: 'Runtime.evaluate',
        params: {
          expression: wrapExpression('({ answer: 42 })'),
          returnByValue: false,
        },
        isMainThread: false,
      },
    ]);
  });

  test('enables each requested background session before evaluating its selected app', async () => {
    type App = { lynx: Record<string, unknown>; };
    type Session = {
      currentAppId: string;
      currentDebugAppId: string;
      multiApps: Record<string, App>;
    };
    type EvaluateResult = { result: { type: string; value: unknown; }; };

    const createApp = (id: string): App => ({
      lynx: {
        getNativeLynx: () => ({ id: `native-${id}` }),
        fetch: { id: `fetch-${id}` },
        getApp: () => ({ NativeModules: { id: `modules-${id}` } }),
        id,
      },
    });
    const sessions = new Map<number, Session>([
      [7, {
        currentAppId: '7',
        currentDebugAppId: '6',
        multiApps: { '6': createApp('old-6'), '7': createApp('page-7') },
      }],
      [8, {
        currentAppId: '8',
        currentDebugAppId: '7',
        multiApps: { '7': createApp('old-7'), '8': createApp('page-8') },
      }],
    ]);
    const sentMessages: SentCDPMessage[] = [];
    let releaseFirstEnable!: () => void;
    const firstEnable = new Promise<EvaluateResult>((resolve) => {
      releaseFirstEnable = () => {
        const session = sessions.get(7)!;
        session.currentDebugAppId = session.currentAppId;
        resolve({ result: { type: 'object', value: { debuggerId: '-1' } } });
      };
    });
    const connector = {
      async sendCDPMessage(
        clientId: string,
        sessionId: number,
        method: string,
        params: Record<string, unknown> = {},
        isMainThread = false,
      ): Promise<EvaluateResult> {
        const session = sessions.get(sessionId);
        assert.ok(session);
        sentMessages.push({
          clientId,
          sessionId,
          method,
          params,
          isMainThread,
        });

        if (method === 'Debugger.enable') {
          if (sessionId === 7) return firstEnable;
          session.currentDebugAppId = session.currentAppId;
          return { result: { type: 'object', value: { debuggerId: '-1' } } };
        }

        assert.equal(method, 'Runtime.evaluate');
        const value = runInNewContext(params['expression'] as string, session);
        return { result: { type: typeof value, value } };
      },
    };

    const firstPromise = evaluateExpression<EvaluateResult>(
      connector as unknown as Connector,
      'test-client',
      7,
      'lynx.id',
    );
    await Promise.resolve();
    assert.deepEqual(
      sentMessages.map(({ method, sessionId }) => ({ method, sessionId })),
      [{ method: 'Debugger.enable', sessionId: 7 }],
    );
    releaseFirstEnable();
    const first = await firstPromise;
    const second = await evaluateExpression<EvaluateResult>(
      connector as unknown as Connector,
      'test-client',
      8,
      'lynx.id',
    );

    assert.equal(first.result.value, 'page-7');
    assert.equal(second.result.value, 'page-8');
    assert.deepEqual(
      sentMessages.map(({ method, sessionId, params, isMainThread }) => ({
        method,
        sessionId,
        params,
        isMainThread,
      })),
      [
        {
          method: 'Debugger.enable',
          sessionId: 7,
          params: {},
          isMainThread: false,
        },
        {
          method: 'Runtime.evaluate',
          sessionId: 7,
          params: {
            expression: wrapExpression('lynx.id'),
            returnByValue: true,
          },
          isMainThread: false,
        },
        {
          method: 'Debugger.enable',
          sessionId: 8,
          params: {},
          isMainThread: false,
        },
        {
          method: 'Runtime.evaluate',
          sessionId: 8,
          params: {
            expression: wrapExpression('lynx.id'),
            returnByValue: true,
          },
          isMainThread: false,
        },
      ],
    );
  });

  test('does not evaluate when selecting the background debugger fails', async () => {
    const methods: string[] = [];
    const connector = {
      async sendCDPMessage(
        _clientId: string,
        _sessionId: number,
        method: string,
      ): Promise<never> {
        methods.push(method);
        throw new Error('Debugger.enable failed');
      },
    };

    await assert.rejects(
      evaluateExpression(
        connector as unknown as Connector,
        'test-client',
        7,
        '2 + 2',
      ),
      /Debugger\.enable failed/,
    );
    assert.deepEqual(methods, ['Debugger.enable']);
  });

  for (
    const [name, currentDebugAppId, expectedAppId] of [
      ['prefers the current debug app', 'debug', 'debug'],
      ['falls back to the current app', '', 'current'],
    ] as const
  ) {
    test(`${name} and exposes bindings from the selected app`, () => {
      const createLynx = (id: string) => ({
        id,
        fetch: { id: `fetch-${id}` },
        NativeModules: { id: `modules-${id}` },
        getNativeLynx() {
          return { id: `native-${this.id}` };
        },
        getApp() {
          return { NativeModules: this.NativeModules };
        },
      });
      const debugLynx = createLynx('debug');
      const currentLynx = createLynx('current');

      const result = runInNewContext(
        wrapExpression(
          '`${lynx.id}:${nativeLynx.id}:${fetch === lynx.fetch}:${NativeModules === lynx.getApp().NativeModules}`',
        ),
        {
          currentDebugAppId,
          currentAppId: 'current',
          multiApps: {
            debug: { lynx: debugLynx },
            current: { lynx: currentLynx },
          },
        },
      );

      assert.equal(
        result,
        `${expectedAppId}:native-${expectedAppId}:true:true`,
      );
    });
  }

  for (
    const [name, runtimeGlobal] of [
      ['multiApps is unavailable', {}],
      ['the selected app is unavailable', {
        multiApps: {},
        currentAppId: 'missing',
      }],
      ['the current app has no lynx object', {
        multiApps: { app: {} },
        currentAppId: 'app',
      }],
    ] as const
  ) {
    test(`preserves missing app and lynx bindings when ${name}`, () => {
      assert.equal(
        runInNewContext(
          wrapExpression(
            '`${typeof lynx}:${typeof nativeLynx}:${typeof fetch}:${typeof NativeModules}:${2 + 2}`',
          ),
          runtimeGlobal,
        ),
        'undefined:undefined:undefined:undefined:4',
      );
    });
  }

  test('naturally throws when the selected lynx object has no getApp', () => {
    assert.throws(
      () =>
        runInNewContext(wrapExpression('2 + 2'), {
          currentAppId: 'app',
          multiApps: { app: { lynx: { getNativeLynx() {} } } },
        }),
      /getApp/,
    );
  });

  test('preserves errors thrown by getApp', () => {
    assert.throws(
      () =>
        runInNewContext(wrapExpression('2 + 2'), {
          currentAppId: 'app',
          multiApps: {
            app: {
              lynx: {
                getNativeLynx() {},
                getApp() {
                  throw new Error('getApp boom');
                },
              },
            },
          },
        }),
      /getApp boom/,
    );
  });

  test('leaves NativeModules undefined when getApp returns no NativeModules', () => {
    assert.equal(
      runInNewContext(wrapExpression('typeof NativeModules'), {
        currentAppId: 'app',
        multiApps: {
          app: { lynx: { getNativeLynx() {}, getApp: () => ({}) } },
        },
      }),
      'undefined',
    );
  });

  test('returns expression objects and preserves thrown errors', () => {
    const result = runInNewContext(wrapExpression('({ answer: 42 })'), {});

    assert.equal(result.answer, 42);
    assert.throws(
      () =>
        runInNewContext(
          wrapExpression("(()=>{throw new Error('evaluate boom')})()"),
          {},
        ),
      /evaluate boom/,
    );
  });
});
