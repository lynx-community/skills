// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ReadableStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import { clientId, screenshotMode, sessionId } from "../../schema/index.ts";
import { defineTool } from "../defineTool.ts";

export const TakeScreenshot = /*#__PURE__*/ defineTool({
  name: "Page_takeScreenshot",
  description: "Take a screenshot of the current page.",
  schema: {
    clientId,
    sessionId,
    screenshotMode: screenshotMode.optional(),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params, extra }, response, context) {
    const connector = context.connector();

    const timeoutSignal = AbortSignal.timeout(10_000);
    const signal = extra.signal
      ? AbortSignal.any([extra.signal, timeoutSignal])
      : timeoutSignal;

    const { promise, resolve } = Promise.withResolvers<void>();

    await using stream = await connector.sendCDPStream(
      params.clientId,
      params.sessionId,
      new ReadableStream({
        async start(controller) {
          controller.enqueue({
            method: "Page.startScreencast",
            params: {
              "format": "jpeg",
              "quality": 80,
              "mode": params.screenshotMode ?? "lynxview",
            },
          });
          await Promise.race([
            promise,
            setTimeout(10_000, undefined, { signal }).catch(() => {}),
          ]);
          controller.enqueue({
            method: "Page.stopScreencast",
          });
          controller.close();
        },
      }),
      { signal },
    );

    for await (const { method, params: eventParams } of stream) {
      if (method === "Page.screencastFrame") {
        const { data } = eventParams as { data: string };
        if (data) {
          resolve();
          response.attachImage({
            data,
            mimeType: "image/jpeg",
          });

          const tmp = await fs.mkdtemp(path.join(tmpdir(), "lynx-devtool-mcp-"));
          const fileName = `screenshot-Lynx_getScreenshot.jpeg`;
          await fs.writeFile(
            path.join(tmp, fileName),
            Buffer.from(data, "base64"),
          );
          response.appendLines(`Screenshot saved to ${tmp}/${fileName}`);
          return;
        }
      }
    }

    throw new Error("Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.");
  },
});
