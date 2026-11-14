// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command, InvalidArgumentError } from 'commander';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { describe, test } from 'node:test';
import { promisify } from 'node:util';
import { registerAppCommand } from '../src/commands/app.ts';
import { registerCdpCommand } from '../src/commands/cdp.ts';
import { registerTapCommand } from '../src/commands/tap.ts';
import { registerTraceCommand } from '../src/commands/trace.ts';
import {
  parseDurationMs,
  parseDurationSeconds,
} from '../src/commands/utils.ts';
import { registerWaitForClientCommand } from '../src/commands/wait-for-client.ts';
import { registerWaitCommand } from '../src/commands/wait.ts';
import { handleCliError } from '../src/program.ts';

const execFileAsync = promisify(execFile);

describe('duration parsing', () => {
  test('parses ms-default options with bare numbers and explicit suffixes', () => {
    assert.equal(parseDurationMs('0', '--timeout'), 0);
    assert.equal(parseDurationMs('500', '--timeout'), 500);
    assert.equal(parseDurationMs('500ms', '--timeout'), 500);
    assert.equal(parseDurationMs('30s', '--timeout'), 30_000);
    assert.equal(parseDurationMs('1.5s', '--timeout'), 1_500);
    assert.equal(parseDurationMs('2m', '--timeout'), 120_000);
  });

  test('parses seconds-default options with bare numbers and explicit suffixes', () => {
    assert.equal(parseDurationSeconds('0', '--timeout'), 0);
    assert.equal(parseDurationSeconds('30', '--timeout'), 30);
    assert.equal(parseDurationSeconds('30s', '--timeout'), 30);
    assert.equal(parseDurationSeconds('5000ms', '--timeout'), 5);
    assert.equal(parseDurationSeconds('500ms', '--interval'), 0.5);
    assert.equal(parseDurationSeconds('1.5m', '--timeout'), 90);
  });

  test('rejects malformed or out-of-range durations with InvalidArgumentError', () => {
    for (const invalid of ['', '  ', 'abc', '30x', '10sec', '-5', '-10s']) {
      assert.throws(
        () => parseDurationMs(invalid, '--timeout'),
        InvalidArgumentError,
      );
      assert.throws(
        () => parseDurationSeconds(invalid, '--timeout'),
        InvalidArgumentError,
      );
    }
    assert.throws(
      () => parseDurationMs('0', '--interval', { allowZero: false }),
      InvalidArgumentError,
    );
    assert.throws(
      () => parseDurationSeconds('0s', '--timeout', { allowZero: false }),
      InvalidArgumentError,
    );
  });

  test('wires duration suffixes into wait, long-press, wait-for-client, and trace', async (t) => {
    t.mock.method(console, 'log', () => {});
    t.mock.method(process.stderr, 'write', () => true);

    const streamCalls: Array<{ action: string; params: unknown; }> = [];
    const executeCalls: Array<{ action: string; params: unknown; }> = [];
    const commandClient = {
      async execute(action: string, params: unknown) {
        executeCalls.push({ action, params });
        return {
          ok: true,
          action,
          data: {
            clientId: 'c1',
            sessionId: 1,
            ref: '@e1',
            point: { x: 1, y: 2 },
            longPress: true,
          },
        } as never;
      },
      async *stream(action: string, params: unknown) {
        streamCalls.push({ action, params });
        if (action === 'wait') {
          yield {
            ok: true,
            action: 'wait',
            data: {
              clientId: 'c1',
              sessionId: 1,
              matched: true,
              by: 'text',
              query: 'Ready',
              elapsedMs: 1,
            },
          } as never;
        } else {
          yield {
            ok: true,
            action: 'wait-for-client',
            data: {
              matched: true,
              clients: [],
              availableClients: [],
              attempts: 1,
              elapsedMs: 1,
            },
          } as never;
        }
      },
    } as CommandClient;

    const program = new Command().option('--no-daemon').exitOverride();
    const context = { transports: [], commandClient };
    registerWaitCommand(program, context);
    registerTapCommand(program, context);
    registerWaitForClientCommand(program, context);
    registerTraceCommand(program, context);

    await program.parseAsync([
      'node',
      'test',
      'wait',
      '--text',
      'Ready',
      '--timeout',
      '30s',
      '--interval',
      '250ms',
    ]);
    assert.deepEqual(streamCalls[0], {
      action: 'wait',
      params: { text: 'Ready', timeout: 30_000, interval: 250 },
    });

    await program.parseAsync([
      'node',
      'test',
      'long-press',
      '@e1',
      '--duration',
      '1.5s',
    ]);
    assert.deepEqual(executeCalls[0], {
      action: 'long-press',
      params: { ref: '@e1', duration: 1_500, snapshotAfter: false },
    });

    await program.parseAsync([
      'node',
      'test',
      'wait-for-client',
      '--timeout',
      '5s',
      '--interval',
      '500ms',
    ]);
    assert.deepEqual(streamCalls[1], {
      action: 'wait-for-client',
      params: { timeoutMs: 5_000, intervalMs: 500 },
    });

    await assert.rejects(
      program.parseAsync([
        'node',
        'test',
        'wait',
        '--text',
        'Ready',
        '--timeout',
        '30x',
      ]),
      /Invalid --timeout value: 30x/u,
    );
    await assert.rejects(
      program.parseAsync(['node', 'test', 'trace', 'end', '--timeout', 'abc']),
      /Invalid --timeout value: abc/u,
    );
  });
});

describe('cdp and app params alias and JSON error guidance', () => {
  test('accepts positional [params] or -p/--params and rejects conflicting values', async (t) => {
    const cdpCalls: Array<{ method: string; params: unknown; }> = [];
    const appCalls: Array<{ method: string; params: unknown; }> = [];
    t.mock.method(console, 'log', () => {});
    t.mock.method(
      Connector.prototype,
      'sendCDPMessage',
      async (
        _client: string,
        _session: number,
        method: string,
        params: unknown,
      ) => {
        cdpCalls.push({ method, params });
        return {};
      },
    );
    t.mock.method(
      Connector.prototype,
      'sendAppMessage',
      async (_client: string, method: string, params: unknown) => {
        appCalls.push({ method, params });
        return {};
      },
    );

    const makeProgram = () => {
      const program = new Command().exitOverride();
      registerCdpCommand(program, { transports: [] });
      registerAppCommand(program, { transports: [] });
      return program;
    };

    await makeProgram().parseAsync([
      'node',
      'test',
      'cdp',
      '-c',
      'c1',
      '-s',
      '1',
      '-m',
      'Page.reload',
      '-p',
      '{"ignoreCache":true}',
    ]);
    await makeProgram().parseAsync([
      'node',
      'test',
      'app',
      '-c',
      'c1',
      '-m',
      'App.openPage',
      '--params',
      '{"url":"https://example.test"}',
    ]);
    assert.deepEqual(cdpCalls, [{
      method: 'Page.reload',
      params: { ignoreCache: true },
    }]);
    assert.deepEqual(appCalls, [{
      method: 'App.openPage',
      params: { url: 'https://example.test' },
    }]);

    await assert.rejects(
      makeProgram().parseAsync([
        'node',
        'test',
        'cdp',
        '-c',
        'c1',
        '-s',
        '1',
        '-m',
        'Page.reload',
        '{"ignoreCache":false}',
        '-p',
        '{"ignoreCache":true}',
      ]),
      /Conflicting parameters/u,
    );

    await assert.rejects(
      makeProgram().parseAsync([
        'node',
        'test',
        'cdp',
        '-m',
        'Page.reload',
        '{ignoreCache:true}',
      ]),
      /Invalid JSON for params:.*Wrap JSON in single quotes/u,
    );
  });
});

describe('top-level CLI error formatting', () => {
  test('formats operational errors cleanly unless DEBUG is set', async () => {
    let cleanStderr = '';
    const prevCode = process.exitCode;
    try {
      process.exitCode = undefined;
      handleCliError(
        new Error('No available clients found.'),
        {},
        { write: chunk => void (cleanStderr += chunk) },
      );
      assert.equal(cleanStderr, 'Error: No available clients found.\n');
      assert.equal(process.exitCode, 1);

      let debugStderr = '';
      handleCliError(
        new Error('with stack'),
        { DEBUG: 'devtool-mcp-server:*' },
        { write: chunk => void (debugStderr += chunk) },
      );
      assert.match(debugStderr, /Error: with stack\n\s+at /u);
    } finally {
      process.exitCode = prevCode;
    }

    await assert.rejects(
      execFileAsync(
        process.execPath,
        [
          'src/index.ts',
          'cdp',
          '-m',
          'Page.reload',
          '{invalid-json}',
        ],
        {
          cwd: path.resolve(import.meta.dirname, '..'),
          env: {
            ...process.env,
            AGENT_LYNX_DISABLE_UPDATE_NOTICE: '1',
            DEBUG: '',
          },
        },
      ),
      (err: unknown) => {
        const failure = err as { code?: number; stderr?: string; };
        assert.equal(failure.code, 1);
        assert.match(failure.stderr ?? '', /^Error: Invalid JSON for params:/u);
        assert.doesNotMatch(
          failure.stderr ?? '',
          /node:internal\/modules\/run_main/u,
        );
        return true;
      },
    );
  });
});
