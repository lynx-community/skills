// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { nextRequestId } from "../request-id.ts";
import type { CDPRequestMessage, CDPResponseMessage } from "../types.ts";
import {
  CustomizedRequestTransformStream,
  CustomizedResponseTransformStream,
  ResponseParserTransformStream,
} from "./customized.ts";

export class CDPRequestTransformStream extends CustomizedRequestTransformStream<
  CDPRequestMessage
> {
  constructor(sessionId: number, fixedId?: number) {
    super({
      type: "CDP",
      sessionId,
      messageBuilder: (chunk) => {
        const id = fixedId ?? nextRequestId();
        return { id, ...chunk };
      },
    });
  }
}

export class CDPResponseTransformStream<Output = CDPResponseMessage>
  extends CustomizedResponseTransformStream<"CDP", Output>
{
  constructor(id?: number, sessionId?: number) {
    super("CDP", id, sessionId);
  }
}

const COMPRESSED_CDP_PAYLOAD_FIELDS: Readonly<Record<string, string>> = {
  "DOM.getDocument": "root",
  "DOM.getDocumentWithBoxModel": "root",
  "DOM.describeNode": "node",
  "UITree.getLynxUITree": "root",
};

function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
  if (typeof Buffer === "function") {
    const decoded = Buffer.from(base64, "base64");
    const bytes = new Uint8Array(decoded.byteLength);
    bytes.set(decoded);
    return bytes;
  }
  return Uint8Array.from(atob(base64), ch => ch.charCodeAt(0));
}

/**
 * Inflate compressed CDP payloads (`DOM.getDocument`, `DOM.getDocumentWithBoxModel`,
 * `DOM.describeNode`, `UITree.getLynxUITree`) when `compress === true`.
 */
export async function decompressCDPResult<Output>(method: string, result: Output): Promise<Output> {
  const field = COMPRESSED_CDP_PAYLOAD_FIELDS[method];
  if (!field || typeof result !== "object" || result === null) {
    return result;
  }

  const record = result as Record<string, unknown>;
  const payload = record[field];
  if (record["compress"] !== true || typeof payload !== "string" || payload.length === 0) {
    return result;
  }

  try {
    const bytes = decodeBase64(payload);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const parsed: unknown = JSON.parse(await new Response(stream).text());
    return {
      ...record,
      [field]: parsed,
      compress: false,
    } as Output;
  } catch (err) {
    throw new Error(`Failed to decompress ${method} response`, { cause: err });
  }
}

export class CDPOutputTransformStream<Output> extends ResponseParserTransformStream<CDPResponseMessage, Output> {
  constructor() {
    super({
      checkError: (message) => {
        if ("error" in message) {
          return new Error(
            `CDP request error: ${message.error.message}`,
            { cause: message },
          );
        }
        return null;
      },
      parseResult: (message) => {
        if ("result" in message) {
          return message.result as Output;
        }
        throw new Error("No result in CDP response message", { cause: message });
      },
    });
  }
}
