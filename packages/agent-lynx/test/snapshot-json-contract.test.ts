// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CommandClient,
  CommandResult,
} from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerFillCommand } from '../src/commands/fill.ts';
import { renderJson } from '../src/commands/result.ts';
import { registerScrollCommand } from '../src/commands/scroll.ts';
import { registerSnapshotCommand } from '../src/commands/snapshot.ts';
import { registerTapCommand } from '../src/commands/tap.ts';
import type { Context } from '../src/commands/utils.ts';

const refs = Array.from({ length: 20 }, (_, index) => ({
  ref: `@e${index + 1}`,
  ...(index ? { parentRef: `@e${index}` } : {}),
  tag: 'view',
  text: '中文 "quoted"\nnext',
  nodeId: index,
  center: { x: 50, y: 25 },
  box: { x: 0, y: 0, width: 100, height: 50 },
  flags: {
    interactive: true,
    visible: true,
    offscreen: false,
    scrollable: false,
    disabled: false,
    editable: false,
  },
  attributes: { class: 'button', title: '中文' },
}));

test('snapshot JSON is one line while preserving every field and the final newline', async (t) => {
  let stdout = '';
  t.mock.method(process.stdout, 'write', (chunk: string | Uint8Array) => {
    stdout += String(chunk);
    return true;
  });
  const result = {
    ok: true,
    action: 'snapshot',
    data: { refs },
  } as CommandResult;
  const calls: unknown[] = [];
  const client = {
    async execute(action: string, params: unknown) {
      calls.push({ action, params });
      return result as never;
    },
  } as CommandClient;
  const program = new Command().exitOverride();
  registerSnapshotCommand(program, { transports: [], commandClient: client });
  await program.parseAsync([
    'node',
    'test',
    'snapshot',
    '--json',
    '--client',
    'device:8901',
    '--session',
    '7',
  ]);
  assert.deepEqual(JSON.parse(stdout), result);
  assert.equal(stdout, JSON.stringify(result) + '\n');
  assert.deepEqual(calls, [{
    action: 'snapshot',
    params: { clientId: 'device:8901', sessionId: 7, visibleOnly: false },
  }]);
  assert.ok(
    Buffer.byteLength(stdout) <= Buffer.byteLength(renderJson(result)) * 0.55,
  );
});

for (
  const args of [
    ['tap', '@e1'],
    ['long-press', '@e1'],
    ['fill', '@e1', '中文'],
    ['clear', '@e1'],
    ['scroll', '@e1'],
  ]
) {
  for (const snapshot of [false, true]) {
    for (const failure of [false, true]) {
      test(`${args[0]} JSON snapshot=${snapshot} failure=${failure} retains its envelope`, async (t) => {
        const action = args[0]!;
        const result: CommandResult = failure
          ? {
            ok: false,
            action,
            error: {
              message: '中文 "failure"\nretry',
              recoverable: true,
              nextActions: ['Retry.'],
            },
          }
          : {
            ok: true,
            action,
            data: {
              ref: '@e1',
              refs,
              snapshotError: {
                message: 'Refresh failed',
                recoverable: true,
                nextActions: ['Retry.'],
              },
            },
          };
        const calls: Array<
          { action: string; params: Record<string, unknown>; }
        > = [];
        const client = {
          async execute(action: string, params: Record<string, unknown>) {
            calls.push({ action, params });
            return result as never;
          },
        } as CommandClient;
        const output: string[] = [];
        t.mock.method(console, 'log', (line: string) => output.push(line));
        t.after(() => {
          process.exitCode = undefined;
        });
        const program = new Command().exitOverride();
        const context: Context = { transports: [], commandClient: client };
        registerTapCommand(program, context);
        registerFillCommand(program, context);
        registerScrollCommand(program, context);
        await program.parseAsync([
          'node',
          'test',
          ...args,
          '--json',
          ...(snapshot ? ['--snapshot'] : []),
        ]);
        assert.deepEqual(JSON.parse(output[0]!), result);
        assert.equal(
          output[0],
          JSON.stringify(result, null, snapshot ? undefined : 2),
        );
        assert.equal(calls.length, 1);
        assert.equal(calls[0]?.action, action);
        assert.equal(calls[0]?.params['snapshotAfter'], snapshot);
        assert.equal(process.exitCode, failure ? 1 : undefined);
      });
    }
  }
}

test('empty snapshot and daemon rejection use compact JSON without invoking the client', async (t) => {
  const output: string[] = [];
  t.mock.method(console, 'log', (line: string) => output.push(line));
  t.after(() => {
    process.exitCode = undefined;
  });
  let calls = 0;
  const client = {
    async execute() {
      calls++;
      return { ok: true, action: 'snapshot', data: { refs: [] } } as never;
    },
  } as CommandClient;
  for (const direct of [false, true]) {
    const program = new Command().option('--no-daemon').exitOverride();
    registerSnapshotCommand(program, { transports: [], commandClient: client });
    await program.parseAsync([
      'node',
      'test',
      ...(direct ? ['--no-daemon'] : []),
      'snapshot',
      '--json',
    ]);
    const value = JSON.parse(output.at(-1)!) as CommandResult;
    assert.equal(output.at(-1), JSON.stringify(value));
    assert.equal(value.ok, !direct);
    if (!value.ok) assert.equal(value.error.reason, 'unsupported-option');
  }
  assert.equal(calls, 1);
});
