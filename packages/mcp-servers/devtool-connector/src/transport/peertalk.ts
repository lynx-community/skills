// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { TransformStream } from "node:stream/web";
import type { CustomizedResponse, Response } from "../types.ts";

export class PeertalkToMessageTransformStream<Output extends Response | CustomizedResponse = Response>
  extends TransformStream<Uint8Array, Output>
{
  constructor() {
    let buffer: Uint8Array = new Uint8Array(0);
    const decoder = new TextDecoder();

    super({
      transform(chunk, controller) {
        if (buffer.length === 0) {
          buffer = chunk;
        } else {
          const next = new Uint8Array(buffer.length + chunk.length);
          next.set(buffer);
          next.set(chunk, buffer.length);
          buffer = next;
        }

        let offset = 0;
        while (buffer.length - offset >= 20) {
          const view = new DataView(buffer.buffer, buffer.byteOffset + offset, 20);
          const len = view.getUint32(16);

          if (buffer.length - offset < 20 + len) break;

          try {
            controller.enqueue(JSON.parse(decoder.decode(buffer.subarray(offset + 20, offset + 20 + len))));
          } catch (error) {
            controller.error(error);
            return;
          }

          offset += 20 + len;
        }

        if (offset === buffer.length) {
          buffer = new Uint8Array(0);
        } else if (offset > 0) {
          buffer = buffer.slice(offset);
        }
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
