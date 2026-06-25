// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { TransformStream } from 'node:stream/web';
import type { Response } from '../types.ts';

export class PeertalkToMessageTransformStream extends TransformStream<
  Uint8Array,
  Response
> {
  constructor() {
    let buffer = new Uint8Array(0);
    const decoder = new TextDecoder();

    super({
      transform: (chunk, c) => {
        const n = new Uint8Array(buffer.length + chunk.length);
        n.set(buffer);
        n.set(chunk, buffer.length);
        buffer = n;

        while (buffer.length >= 20) {
          const v = new DataView(buffer.buffer, buffer.byteOffset);
          const len = v.getUint32(16);

          if (buffer.length < 20 + len) break;

          try {
            c.enqueue(
              JSON.parse(decoder.decode(buffer.subarray(20, 20 + len))),
            );
          } catch (e) {
            c.error(e);
          }

          buffer = buffer.subarray(20 + len);
        }
      },
    });
  }
}

export class MessageToPeertalkTransformStream<
  TMessage = unknown,
> extends TransformStream<TMessage, Uint8Array> {
  constructor() {
    const encoder = new TextEncoder();

    super({
      transform(chunk, controller) {
        const body = encoder.encode(JSON.stringify(chunk));
        const len = body.length;

        const data = new Uint8Array(20 + len);
        const view = new DataView(data.buffer);

        view.setUint32(0, 1);
        view.setUint32(4, 101);
        view.setUint32(8, 0);
        view.setUint32(12, len + 4);
        view.setUint32(16, len);

        data.set(body, 20);

        controller.enqueue(data);
      },
    });
  }
}
