// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type {
  CommandClient,
  CommandResult,
  StreamCommandEvent,
} from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { registerFillCommand } from '../src/commands/fill.ts';
import { registerGetCommand } from '../src/commands/get.ts';
import { registerScreenshotCommand } from '../src/commands/screenshot.ts';
import { registerScrollCommand } from '../src/commands/scroll.ts';
import {
  registerSnapshotCommand,
  renderSnapshotTree,
} from '../src/commands/snapshot.ts';
import { registerTapCommand } from '../src/commands/tap.ts';
import type { Context } from '../src/commands/utils.ts';
import { registerWaitCommand } from '../src/commands/wait.ts';
import { createProgram } from '../src/devtool.ts';

interface ClientState {
  executeCalls: number;
  streamCalls: number;
}

function commandClient(state: ClientState): CommandClient {
  return {
    async execute() {
      state.executeCalls += 1;
      throw new Error('command client must not be called');
    },
    async *stream() {
      state.streamCalls += 1;
      yield await Promise.reject<never>(
        new Error('command client must not be called'),
      );
    },
  } as CommandClient;
}

function registerSnapshotFamily(program: Command, context: Context): void {
  registerSnapshotCommand(program, context);
  registerScreenshotCommand(program, context);
  registerTapCommand(program, context);
  registerFillCommand(program, context);
  registerScrollCommand(program, context);
  registerWaitCommand(program, context);
  registerGetCommand(program, context);
}

test('registers snapshot, trace, and skill discovery without other deferred agent commands', () => {
  const commandNames = createProgram({ env: {} }).commands.map((command) =>
    command.name(),
  );
  for (const name of [
    'snapshot',
    'screenshot',
    'tap',
    'long-press',
    'fill',
    'clear',
    'scroll',
    'wait',
    'get',
    'trace',
    'skills',
  ]) {
    assert.ok(commandNames.includes(name), `${name} must be registered`);
  }
  for (const deferred of ['doctor', 'devices', 'logs']) {
    assert.ok(
      !commandNames.includes(deferred),
      `${deferred} must remain outside phase one`,
    );
  }
});

test('snapshot text renderer preserves compact hierarchy and ref order', () => {
  const base = {
    tag: 'view',
    text: '',
    nodeId: 1,
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
    attributes: {},
  };
  const refs = [
    { ...base, ref: '@e1', text: 'Root' },
    { ...base, ref: '@e2', parentRef: '@e1', text: 'First' },
    { ...base, ref: '@e3', parentRef: '@e2', tag: 'text', text: 'Nested' },
    { ...base, ref: '@e4', parentRef: '@e1', text: 'Last' },
    { ...base, ref: '@e5', nodeId: 5, text: 'Second root' },
  ];

  assert.equal(
    renderSnapshotTree(refs),
    [
      '@e1 [view] "Root" @(50,25)',
      '├─ @e2 [view] "First" @(50,25)',
      '│  └─ @e3 [text] "Nested" @(50,25)',
      '└─ @e4 [view] "Last" @(50,25)',
      '@e5 [view] "Second root" @(50,25)',
    ].join('\n'),
  );
});

test('--no-daemon returns a JSON failure for every snapshot/ref leaf before making an HTTP request', async (t) => {
  const cases = [
    ['snapshot'],
    ['screenshot', '--annotate'],
    ['tap', '@e1'],
    ['long-press', '@e1'],
    ['fill', '@e1', 'hello'],
    ['clear', '@e1'],
    ['scroll', '@e1'],
    ['wait', '--text', 'Ready'],
    ['get', 'text', '@e1'],
    ['get', 'style', '@e1'],
  ];

  const output: string[] = [];
  t.mock.method(console, 'log', (value: unknown) => output.push(String(value)));
  for (const args of cases) {
    const state = { executeCalls: 0, streamCalls: 0 };
    const program = new Command().option('--no-daemon').exitOverride();
    registerSnapshotFamily(program, {
      transports: [],
      commandClient: commandClient(state),
    });
    await program.parseAsync([
      'node',
      'agent-lynx',
      '--no-daemon',
      ...args,
      '--json',
    ]);
    const result = JSON.parse(output.at(-1) ?? 'null') as CommandResult;
    assert.equal(result.ok, false);
    assert.equal(result.error?.reason, 'unsupported-option');
    assert.match(result.error?.message ?? '', /--no-daemon cannot be used/);
    assert.deepEqual(state, { executeCalls: 0, streamCalls: 0 });
    process.exitCode = undefined;
  }
});

test('wait consumes SSE progress and renders only the final ActionCore result', async (t) => {
  const state = { executeCalls: 0, streamCalls: 0 };
  const client = {
    async execute() {
      state.executeCalls += 1;
      throw new Error('wait must use SSE');
    },
    async *stream() {
      state.streamCalls += 1;
      yield {
        ok: true,
        action: 'wait.progress',
        data: {
          clientId: 'device:8901',
          sessionId: 3,
          matched: false,
          by: 'text',
          query: 'Ready',
          elapsedMs: 0,
          refCount: 1,
        },
      } satisfies CommandResult<StreamCommandEvent<'wait'>>;
      yield {
        ok: true,
        action: 'wait',
        data: {
          clientId: 'device:8901',
          sessionId: 3,
          matched: true,
          by: 'text',
          query: 'Ready',
          elapsedMs: 2,
        },
      } satisfies CommandResult<StreamCommandEvent<'wait'>>;
    },
  } as CommandClient;
  const output: string[] = [];
  t.mock.method(console, 'log', (value: unknown) => output.push(String(value)));

  const program = new Command().option('--no-daemon').exitOverride();
  registerWaitCommand(program, { transports: [], commandClient: client });
  await program.parseAsync(['node', 'agent-lynx', 'wait', '--text', 'Ready']);

  assert.deepEqual(state, { executeCalls: 0, streamCalls: 1 });
  assert.deepEqual(output, [
    'Matched text "Ready" after 2ms. A fresh snapshot was cached.',
  ]);
});
