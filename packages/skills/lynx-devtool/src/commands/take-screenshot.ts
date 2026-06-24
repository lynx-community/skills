// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/* eslint-disable */
import { Command } from "commander";
import fs from "node:fs/promises";
import { ReadableStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "./utils.ts";

export function registerTakeScreenshotCommand(program: Command, context: Context) {
  program
    .command("take-screenshot")
    .description("Take a screenshot of the current page")
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option("--fullscreen", "Capture the fullscreen screenshot instead of the lynxview")
    .option("-o, --output <path>", "Output file path (default: screenshot-<timestamp>.jpeg)")
    .action(async (options) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(context, options);
      const { output, fullscreen } = options;

      const numericSessionId = Number(sessionId);
      const signal = AbortSignal.timeout(10_000);
      const { promise: framePromise, resolve: resolveFrame } = Promise.withResolvers<void>();
      const { promise: ackPromise, resolve: resolveAck } = Promise.withResolvers<void>();

      await using stream = await connector.sendCDPStream(
        clientId,
        numericSessionId,
        new ReadableStream({
          async start(controller) {
            controller.enqueue({
              method: "Page.startScreencast",
              params: {
                "format": "jpeg",
                "quality": 80,
                "mode": fullscreen ? "fullscreen" : "lynxview",
              },
            });
            const hasFrame = await Promise.race([
              framePromise.then(() => true),
              setTimeout(10_000, false, { ref: false }),
            ]);
            if (hasFrame) {
              controller.enqueue({
                method: "Page.screencastFrameAck",
              });
            }
            controller.close();
            resolveAck();
          },
        }),
        { signal },
      );

      for await (const { method, params: eventParams } of stream) {
        if (method === "Page.screencastFrame") {
          const { data } = eventParams as { data: string };
          if (data) {
            resolveFrame();
            await ackPromise;

            const fileName = output ?? `screenshot-${Date.now()}.jpeg`;
            await fs.writeFile(fileName, Buffer.from(data, "base64"));

            console.log(`Screenshot saved to ${fileName}`);
            return;
          }
        }
      }

      throw new Error("Failed to capture screenshot, no Page.screencastFrame event received within 10 seconds.");
    });
}
