// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { TransformStream } from "node:stream/web";
import type { CustomizedResponse, Response } from "../types.ts";

export class PeertalkToMessageTransformStream<Output extends Response | CustomizedResponse = Response>
  extends TransformStream<Uint8Array, Output>
{
  constructor() {
    let buffer = new Uint8Array(0);
    let start = 0;
    let end = 0;
    const decoder = new TextDecoder();

    super({
      transform: (chunk, c) => {
        const buffered = end - start;
        if (buffer.length - end < chunk.length) {
          if (buffered + chunk.length <= buffer.length) {
            buffer.copyWithin(0, start, end);
            start = 0;
            end = buffered;
          } else {
            const next = new Uint8Array(Math.max(buffered + chunk.length, Math.max(20, buffer.length * 2)));
            next.set(buffer.subarray(start, end));
            buffer = next;
            start = 0;
            end = buffered;
          }
        }
        buffer.set(chunk, end);
        end += chunk.length;

        while (end - start >= 20) {
          const v = new DataView(buffer.buffer, buffer.byteOffset + start, 20);
          const len = v.getUint32(16);

          if (end - start < 20 + len) break;

          try {
            c.enqueue(JSON.parse(decoder.decode(buffer.subarray(start + 20, start + 20 + len))));
          } catch (e) {
            c.error(e);
          }

          start += 20 + len;
          if (start === end) {
            start = 0;
            end = 0;
          }
        }
      },
    });
  }
}

export class MessageToPeertalkTransformStream<TMessage = unknown> extends TransformStream<
  TMessage,
  Uint8Array
> {
  constructor() {
    super({
      transform(chunk, controller) {
        controller.enqueue(encodePeertalkMessage(chunk));
      },
    });
  }
}

const encoder = new TextEncoder();

export function encodePeertalkMessage(message: unknown): Uint8Array {
  const body = encoder.encode(JSON.stringify(message));
  const len = body.length;

  const data = new Uint8Array(20 + len);
  const view = new DataView(data.buffer);

  view.setUint32(0, 1);
  view.setUint32(4, 101);
  view.setUint32(8, 0);
  view.setUint32(12, len + 4);
  view.setUint32(16, len);

  data.set(body, 20);
  return data;
}
