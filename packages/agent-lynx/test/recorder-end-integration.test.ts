// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import { after, before, describe, test } from 'node:test';
import type { Connector } from '@lynx-js/devtool-connector';
import { runRecordingEnd } from '../src/commands/recorder-end.ts';

function createMockConnector(opts: {
  recordingComplete: Record<string, unknown>;
  streamData: Map<number, { data: string; base64Encoded?: boolean }[]>;
}): Connector {
  return {
    sendCDPStream() {
      const events = [
        {
          method: 'Recording.recordingComplete',
          params: opts.recordingComplete,
        },
      ];
      const stream = new ReadableStream({
        start(controller) {
          for (const event of events) controller.enqueue(event);
          controller.close();
        },
      });
      Object.assign(stream, { [Symbol.asyncDispose]: async () => {} });
      return Promise.resolve(stream);
    },
    sendCDPMessage(
      _clientId: string,
      _sessionId: number,
      method: string,
      params: unknown,
    ) {
      if (method === 'IO.read') {
        const p = params as { handle: number };
        const chunks = opts.streamData.get(p.handle) ?? [];
        const chunk = chunks.shift();
        if (!chunk || chunks.length === 0) {
          return Promise.resolve({
            data: chunk?.data ?? '',
            base64Encoded: false,
            eof: true,
          });
        }
        return Promise.resolve({
          data: chunk.data,
          base64Encoded: chunk.base64Encoded ?? false,
          eof: false,
        });
      }
      return Promise.resolve({});
    },
  } as unknown as Connector;
}

describe('runRecordingEnd', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'recorder-end-test-'));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('saves single-session recording', async (t) => {
    const recording = JSON.stringify([{ 'Function Name': 'loadTemplate' }]);
    const outputPath = path.join(tmpDir, 'single.json');
    const connector = createMockConnector({
      recordingComplete: { stream: [1], sessionIDs: [100] },
      streamData: new Map([[1, [{ data: recording }]]]),
    });

    const result = await runRecordingEnd(connector, 'test-client', outputPath);
    t.assert.equal(result.savedFiles.length, 1);
    const content = await fs.readFile(result.savedFiles[0]!, 'utf-8');
    t.assert.equal(content, recording);
    t.assert.equal(result.diagnostics[0]!.healthy, true);
    t.assert.equal(result.diagnostics[0]!.hasTemplate, true);
  });

  test('saves multi-session recording with separate files', async (t) => {
    const rec1 = JSON.stringify([{ 'Function Name': 'loadTemplate' }]);
    const rec2 = JSON.stringify([{ 'Function Name': 'SendTouchEvent' }]);
    const outputPath = path.join(tmpDir, 'multi.json');
    const connector = createMockConnector({
      recordingComplete: { stream: [10, 20], sessionIDs: [1, 2] },
      streamData: new Map([
        [10, [{ data: rec1 }]],
        [20, [{ data: rec2 }]],
      ]),
    });

    const result = await runRecordingEnd(connector, 'test-client', outputPath);
    t.assert.equal(result.savedFiles.length, 2);
    assert.ok(result.savedFiles[0] !== result.savedFiles[1]);
  });

  test('skips sessions with sessionID -1', async (t) => {
    const recording = JSON.stringify([{ 'Function Name': 'loadTemplate' }]);
    const outputPath = path.join(tmpDir, 'skip.json');
    const connector = createMockConnector({
      recordingComplete: { stream: [1, 2], sessionIDs: [-1, 5] },
      streamData: new Map([[2, [{ data: recording }]]]),
    });

    const result = await runRecordingEnd(connector, 'test-client', outputPath);
    t.assert.equal(result.savedFiles.length, 1);
  });

  test('throws when no streams in recordingComplete', async () => {
    const outputPath = path.join(tmpDir, 'nostream.json');
    const connector = createMockConnector({
      recordingComplete: { stream: [], sessionIDs: [] },
      streamData: new Map(),
    });

    try {
      await runRecordingEnd(connector, 'test-client', outputPath);
      assert.fail('expected error');
    } catch (err) {
      assert.ok((err as Error).message.includes('did not include any streams'));
    }
  });

  test('throws when all sessionIDs are -1', async (t) => {
    const outputPath = path.join(tmpDir, 'all-neg.json');
    const connector = createMockConnector({
      recordingComplete: {
        stream: [1],
        sessionIDs: [-1],
        filenames: ['/tmp/native-recording.json'],
      },
      streamData: new Map(),
    });

    try {
      await runRecordingEnd(connector, 'test-client', outputPath);
      t.assert.fail('expected error');
    } catch (err) {
      const message = (err as Error).message;
      t.assert.match(message, /no page recording was produced/);
      t.assert.match(message, /sessionIDs=\[-1\]/);
      t.assert.match(message, /streams=1/);
      t.assert.match(message, /list-sessions --client test-client/);
      t.assert.match(message, /open or reload the target page/);
      t.assert.match(message, /Page\.reload/);
      t.assert.match(message, /\/tmp\/native-recording\.json/);
    }
  });
});
