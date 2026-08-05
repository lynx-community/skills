// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import test from 'node:test';
import {
  buildReactLynxOutboundFrame as buildOutboundFrame,
  type PreactEnvelope,
  runReactLynxSession,
} from '../src/command/reactlynx/session.ts';
import type { Connector } from '../src/index.ts';

test('does not send a snapshot follow-up after the hard deadline', async () => {
  const outboundTypes: string[] = [];
  let afterSnapshotCalls = 0;
  let outputController: ReadableStreamDefaultController<unknown> | undefined;
  const connector = {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
    ) {
      const inputClosed = (async () => {
        for await (const frame of input) {
          const envelope = JSON.parse(
            (frame as { params: { data: string } }).params.data,
          ) as PreactEnvelope;
          outboundTypes.push(envelope.type);
        }
      })();
      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
        },
      });
      return Object.assign(output, {
        inputClosed,
        async [Symbol.asyncDispose]() {
          try {
            outputController?.close();
          } catch {
            // The consumer may already have cancelled the output stream.
          }
          await inputClosed;
        },
      });
    },
  } as unknown as Connector;

  await runReactLynxSession({
    connector,
    clientId: 'device:8901',
    sessionId: 1,
    outbound: [buildOutboundFrame('refresh')],
    afterSnapshot: () => {
      afterSnapshotCalls += 1;
      return ['inspect', 84];
    },
    snapshotIdleMs: 100,
    maxMs: 20,
  });

  assert.equal(afterSnapshotCalls, 0);
  assert.deepEqual(outboundTypes, ['init', 'refresh']);
});

test('preserves the input cancellation reason instead of enqueueing a follow-up', async () => {
  const cancellation = new Error('device stream stopped accepting input');
  const outboundTypes: string[] = [];
  let afterSnapshotCalls = 0;
  let outputController: ReadableStreamDefaultController<unknown> | undefined;
  const connector = {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
    ) {
      const reader = input.getReader();
      for (let index = 0; index < 2; index += 1) {
        const { value } = await reader.read();
        const envelope = JSON.parse(
          (value as { params: { data: string } }).params.data,
        ) as PreactEnvelope;
        outboundTypes.push(envelope.type);
      }
      await reader.cancel(cancellation);
      reader.releaseLock();
      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
        },
      });
      return Object.assign(output, {
        inputClosed: Promise.resolve(),
        async [Symbol.asyncDispose]() {
          try {
            outputController?.close();
          } catch {
            // The consumer may already have cancelled the output stream.
          }
        },
      });
    },
  } as unknown as Connector;

  let caught: unknown;
  try {
    await runReactLynxSession({
      connector,
      clientId: 'device:8901',
      sessionId: 1,
      outbound: [buildOutboundFrame('refresh')],
      afterSnapshot: () => {
        afterSnapshotCalls += 1;
        return ['inspect', 84];
      },
      snapshotIdleMs: 1,
    });
  } catch (error) {
    caught = error;
  }

  assert.equal(caught, cancellation);
  assert.equal(afterSnapshotCalls, 0);
  assert.deepEqual(outboundTypes, ['init', 'refresh']);
});

test('keeps the pending read after follow-up idle while awaiting an explicit envelope', async () => {
  const outboundTypes: string[] = [];
  let outputController: ReadableStreamDefaultController<unknown> | undefined;
  let outputCancelled = false;
  let replyTimer: NodeJS.Timeout | undefined;
  const connector = {
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<unknown>,
    ) {
      const inputClosed = (async () => {
        for await (const frame of input) {
          const envelope = JSON.parse(
            (frame as { params: { data: string } }).params.data,
          ) as PreactEnvelope;
          outboundTypes.push(envelope.type);
          if (envelope.type === 'inspect') {
            replyTimer = setTimeout(() => {
              if (outputCancelled) return;
              outputController?.enqueue({
                method: 'Lynx.onVMEvent',
                params: {
                  event: 'PreactDevtools',
                  data: JSON.stringify({
                    source: 'preact-page-hook',
                    type: 'inspect-result',
                    data: { id: 84 },
                  }),
                },
              });
            }, 25);
          }
        }
      })();
      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
        },
        cancel() {
          outputCancelled = true;
        },
      });
      return Object.assign(output, {
        inputClosed,
        async [Symbol.asyncDispose]() {
          if (replyTimer) clearTimeout(replyTimer);
          try {
            outputController?.close();
          } catch {
            // The consumer may already have cancelled the output stream.
          }
          await inputClosed;
        },
      });
    },
  } as unknown as Connector;

  let receivedReply = false;
  await runReactLynxSession({
    connector,
    clientId: 'device:8901',
    sessionId: 1,
    outbound: [buildOutboundFrame('refresh')],
    afterSnapshot: () => ['inspect', 84],
    snapshotIdleMs: 5,
    idleMs: 5,
    maxMs: 250,
    awaitEnvelope: true,
    onEnvelope: (envelope) => {
      if (envelope.type !== 'inspect-result') return 'continue';
      receivedReply = true;
      return 'stop';
    },
  });

  assert.equal(receivedReply, true);
  assert.deepEqual(outboundTypes, ['init', 'refresh', 'inspect']);
});
