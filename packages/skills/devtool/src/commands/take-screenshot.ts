// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from "@lynx-js/devtool-connector";
import { Command } from "commander";
import fs from "node:fs/promises";
import { ReadableStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import { getFirstClient, getFirstSession } from "./utils.ts";

export function registerTakeScreenshotCommand(program: Command, connector: Connector) {
  program
    .command("take-screenshot")
    .description("Take a screenshot of the current page")
    .option("-c, --client <clientId>", "Client ID (optional, will auto-discover if not provided)")
    .option("-s, --session <sessionId>", "Session ID (optional, will auto-discover if not provided)")
    .option("--fullscreen", "Capture the fullscreen screenshot instead of the lynxview")
    .option("-o, --output <path>", "Output file path (default: screenshot-<timestamp>.jpeg)")
    .action(async (options) => {
      let { client: clientId, session: sessionId } = options;
      const { output, fullscreen } = options

      if (!clientId) {
        clientId = await getFirstClient(connector);
      }

      if (!sessionId) {
        sessionId = await getFirstSession(connector, clientId);
      }

      const numericSessionId = Number(sessionId);
      const signal = AbortSignal.timeout(10_000);
      const { promise, resolve } = Promise.withResolvers<void>();

      await using stream = await connector.sendCDPStream(
        clientId,
        new ReadableStream({
          async start(controller) {
            controller.enqueue({
              method: "Page.startScreencast",
              params: {
                "format": "jpeg",
                "quality": 80,
                "mode": fullscreen ? "fullscreen" : "lynxview",
              },
              sessionId: numericSessionId,
            });
            await Promise.race([
              promise,
              setTimeout(10_000, void 0, { ref: false }),
            ]);
            controller.enqueue({
              method: "Page.stopScreencast",
              sessionId: numericSessionId,
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
