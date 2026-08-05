// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import type {
  CommandClient,
  ScreenshotAnnotation,
  SnapshotData,
} from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import {
  registerScreenshotCommand,
  type ScreenshotCommandResult,
} from '../src/commands/screenshot.ts';

interface ClientState {
  calls: Array<{ action: string; params: unknown }>;
  response: unknown;
}

function commandClient(state: ClientState): CommandClient {
  return {
    async execute(action, params) {
      state.calls.push({ action, params });
      return state.response as never;
    },
    async *stream() {
      yield await Promise.reject<never>(
        new Error('screenshot must not use SSE'),
      );
    },
  } as CommandClient;
}

test('screenshot --annotate writes one raster image and keeps its fresh snapshot in JSON', async (t) => {
  const annotation: ScreenshotAnnotation = {
    ref: '@e1',
    number: 1,
    tag: 'button',
    text: 'Submit',
    box: { x: 10, y: 20, width: 100, height: 40 },
  };
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const snapshot: SnapshotData = {
    clientId: 'device:8901',
    sessionId: 7,
    viewport: { x: 0, y: 0, width: 200, height: 400 },
    refs: [
      {
        ref: '@e1',
        tag: 'button',
        text: 'Submit',
        nodeId: 11,
        center: { x: 60, y: 40 },
        box: { x: 10, y: 20, width: 100, height: 40 },
        flags: {
          interactive: true,
          visible: true,
          offscreen: false,
          scrollable: false,
          disabled: false,
          editable: false,
        },
        attributes: {},
      },
    ],
  };
  const state: ClientState = {
    calls: [],
    response: {
      ok: true,
      action: 'screenshot',
      data: {
        clientId: 'device:8901',
        sessionId: 7,
        jpegBase64: jpeg.toString('base64'),
        width: 200,
        height: 400,
        snapshot,
        annotations: [annotation],
      },
    },
  };
  const output: string[] = [];
  t.mock.method(console, 'log', (value: unknown) => output.push(String(value)));
  const program = new Command().option('--no-daemon').exitOverride();
  registerScreenshotCommand(program, {
    transports: [],
    commandClient: commandClient(state),
  });

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'agent-lynx-annotate-'));
  t.after(() => rm(tempDir, { recursive: true, force: true }));
  const filePath = path.join(tempDir, 'map.jpeg');
  await program.parseAsync([
    'node',
    'agent-lynx',
    'screenshot',
    '--annotate',
    '--client',
    'device:8901',
    '--session',
    '7',
    '--output',
    filePath,
    '--json',
  ]);

  assert.deepEqual(state.calls, [
    {
      action: 'screenshot',
      params: {
        clientId: 'device:8901',
        sessionId: 7,
        fullscreen: false,
        annotate: true,
      },
    },
  ]);
  assert.deepEqual(await readFile(filePath), jpeg);
  assert.deepEqual(await readdir(tempDir), ['map.jpeg']);

  const result = JSON.parse(output.at(-1) ?? 'null') as {
    ok: true;
    data: ScreenshotCommandResult;
  };
  assert.equal(result.ok, true);
  assert.equal(result.data.path, filePath);
  assert.equal(result.data.width, 200);
  assert.equal(result.data.height, 400);
  assert.deepEqual(result.data.snapshot, snapshot);
  assert.deepEqual(result.data.annotations, [annotation]);
  assert.equal(JSON.stringify(result).includes('jpegBase64'), false);
});

test('screenshot rejects an incomplete annotation response before writing a file', async (t) => {
  const state: ClientState = {
    calls: [],
    response: {
      ok: true,
      action: 'screenshot',
      data: {
        clientId: 'device:8901',
        sessionId: 7,
        jpegBase64: Buffer.from('jpeg').toString('base64'),
        width: 200,
        height: 400,
        annotations: [],
      },
    },
  };
  const output: string[] = [];
  t.mock.method(console, 'log', (value: unknown) => output.push(String(value)));
  const program = new Command().option('--no-daemon').exitOverride();
  registerScreenshotCommand(program, {
    transports: [],
    commandClient: commandClient(state),
  });

  const tempDir = await mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-annotate-invalid-'),
  );
  t.after(() => rm(tempDir, { recursive: true, force: true }));
  const filePath = path.join(tempDir, 'map.jpeg');
  await program.parseAsync([
    'node',
    'agent-lynx',
    'screenshot',
    '--annotate',
    '--output',
    filePath,
    '--json',
  ]);

  const result = JSON.parse(output.at(-1) ?? 'null') as {
    ok: false;
    error: { reason?: string };
  };
  assert.equal(result.ok, false);
  assert.equal(result.error.reason, 'invalid-response');
  assert.deepEqual(await readdir(tempDir), []);
  process.exitCode = undefined;
});
