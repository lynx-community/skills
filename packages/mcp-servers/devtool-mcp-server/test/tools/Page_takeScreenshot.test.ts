// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import { test } from 'node:test';
import { TakeScreenshot } from '../../src/tools/Page/TakeScreenshot.ts';
import { createToolContext } from '../utils/testTool.ts';

test('Page.takeScreenshot acknowledges an empty frame before accepting the next frame', async (t) => {
  const requests: Array<{ id?: number; method: string; params?: unknown; }> =
    [];
  const acknowledgementResponses: number[] = [];
  const stops: Array<{ clientId: string; sessionId: number; }> = [];
  const frameData = Buffer.from('second frame').toString('base64');

  const connector = {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<{ id?: number; method: string; params?: unknown; }>,
    ) {
      let outputController!: ReadableStreamDefaultController<unknown>;
      const output = new ReadableStream({
        start(controller) {
          outputController = controller;
        },
      });
      const inputPump = (async () => {
        for await (const request of input) {
          requests.push(request);
          if (request.method === 'Page.startScreencast') {
            outputController.enqueue({
              method: 'Page.screencastFrame',
              params: { data: '' },
            });
          } else if (request.method === 'Page.screencastFrameAck') {
            const id = request.id;
            assert.ok(
              typeof id === 'number' && Number.isInteger(id),
              'screencast acknowledgements need a CDP request ID',
            );
            const ackCount = requests.filter(({ method }) =>
              method === 'Page.screencastFrameAck'
            ).length;
            if (ackCount === 1) {
              outputController.enqueue({
                method: 'Page.screencastFrame',
                params: { data: frameData },
              });
            } else {
              const emptyFrameAckId = requests.find(({ method }) =>
                method === 'Page.screencastFrameAck'
              )?.id;
              assert.ok(
                typeof emptyFrameAckId === 'number'
                  && Number.isInteger(emptyFrameAckId),
              );
              acknowledgementResponses.push(emptyFrameAckId, id);
              outputController.enqueue({ id: emptyFrameAckId, result: {} });
              outputController.enqueue({ id, result: {} });
              outputController.close();
            }
          }
        }
      })();

      return Object.assign(output, {
        inputClosed: inputPump,
        async [Symbol.asyncDispose]() {
          await inputPump;
          await output.cancel().catch(() => {});
        },
      });
    },
    async sendCDPMessage(clientId: string, sessionId: number, method: string) {
      assert.equal(method, 'Page.stopScreencast');
      stops.push({ clientId, sessionId });
      return {};
    },
  };

  const { call } = createToolContext(
    TakeScreenshot,
    connector as never,
    'device:8901',
    7,
  );
  const text = await call<string>();
  const outputPath = text.replace('Screenshot saved to ', '');
  t.after(() =>
    fs.rm(path.dirname(outputPath), { force: true, recursive: true })
  );

  assert.deepEqual(requests.map(({ method }) => method), [
    'Page.startScreencast',
    'Page.screencastFrameAck',
    'Page.screencastFrameAck',
  ]);
  const acknowledgementIds = requests
    .filter(({ method }) => method === 'Page.screencastFrameAck')
    .map(({ id }) => id);
  assert.deepEqual(acknowledgementResponses, [
    acknowledgementIds[0],
    acknowledgementIds[1],
  ]);
  assert.deepEqual(stops, [{ clientId: 'device:8901', sessionId: 7 }]);
  assert.equal(await fs.readFile(outputPath, 'utf8'), 'second frame');
});
