// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ImageContent, TextContent } from "@modelcontextprotocol/sdk/types.js";
import type { McpContext } from "./McpContext.ts";
import type { ImageContentData, Response } from "./tools/defineTool.ts";

export class McpResponse implements Response {
  #additionalLines: string[] = [];
  appendLines(...lines: string[]): void {
    this.#additionalLines.push(...lines);
  }

  #images: ImageContentData[] = [];
  attachImage(value: ImageContentData): void {
    this.#images.push(value);
  }

  async handle(
    _toolName: string,
    _context: McpContext,
  ): Promise<Array<TextContent | ImageContent>> {
    return [
      {
        type: "text",
        text: this.#additionalLines.join("\n"),
      },
      ...this.#images.map(img => ({
        type: "image" as const,
        ...img,
      })),
    ];
  }
}
