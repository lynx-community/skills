// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TransformStream } from 'node:stream/web';
import { takeoverDebugRouterLock } from '../takeover.ts';
import {
  MessageToPeertalkTransformStream,
  PeertalkToMessageTransformStream,
} from './peertalk.ts';
import type { Connection, TransportConnectOptions } from './transport.ts';

export interface MessageCodecFactory {
  createEncodeTransformStream<TInput = unknown>(): TransformStream<
    TInput,
    Uint8Array
  >;
  createDecodeTransformStream<TOutput = unknown>(): TransformStream<
    Uint8Array,
    TOutput
  >;
}

export const peertalkCodecFactory: MessageCodecFactory = {
  createEncodeTransformStream<TInput = unknown>(): TransformStream<
    TInput,
    Uint8Array
  > {
    return new MessageToPeertalkTransformStream<TInput>();
  },

  createDecodeTransformStream<TOutput = unknown>(): TransformStream<
    Uint8Array,
    TOutput
  > {
    return new PeertalkToMessageTransformStream() as TransformStream<
      Uint8Array,
      TOutput
    >;
  },
};

export async function createMessageConnection<
  TInput = unknown,
  TOutput = unknown,
>(
  connectRaw: (options: TransportConnectOptions) => Promise<Connection>,
  codecFactory: MessageCodecFactory,
  options: TransportConnectOptions,
): Promise<Connection<TOutput, TInput>> {
  const conn = await connectRaw(options);
  const encoder = codecFactory.createEncodeTransformStream<TInput>();

  const pipeAbortController = new AbortController();

  void encoder.readable
    .pipeTo(conn.writable, {
      preventClose: true,
      signal: pipeAbortController.signal,
    })
    .catch((err) => {
      if (err?.name !== 'AbortError') {
        void conn[Symbol.asyncDispose]();
      }
    });

  const readable = conn.readable.pipeThrough(
    codecFactory.createDecodeTransformStream<TOutput>(),
  );

  return {
    readable,
    writable: encoder.writable,
    async [Symbol.asyncDispose]() {
      pipeAbortController.abort();
      await conn[Symbol.asyncDispose]();
    },
  };
}

export async function connectWithPeertalk<TInput = unknown, TOutput = unknown>(
  connectRaw: (options: TransportConnectOptions) => Promise<Connection>,
  options: TransportConnectOptions,
): Promise<Connection<TOutput, TInput>> {
  await takeoverDebugRouterLock();
  return createMessageConnection<TInput, TOutput>(
    connectRaw,
    peertalkCodecFactory,
    options,
  );
}
