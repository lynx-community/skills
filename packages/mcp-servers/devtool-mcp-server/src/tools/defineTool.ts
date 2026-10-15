// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '@lynx-js/devtool-connector';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type {
  ServerNotification,
  ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import type * as z from 'zod';

export interface Request<Schema extends z.ZodRawShape> {
  params: z.infer<z.ZodObject<Schema>>;
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>;
}

export interface Response {
  appendLines(...lines: string[]): void;

  attachImage(value: ImageContentData): void;
}

export interface Context {
  connector(): Connector;
}

export interface ImageContentData {
  data: string;
  mimeType: string;
}

export interface ToolDefinition<
  Schema extends z.ZodRawShape = z.ZodRawShape,
  ToolContext extends Context = Context,
> {
  name: string;
  description: string;
  annotations: {
    title?: string;
    /**
     * If true, the tool does not modify its environment.
     */
    readOnlyHint: boolean;
  };
  schema: Schema;
  handler: (
    request: Request<Schema>,
    response: Response,
    context: ToolContext,
  ) => Promise<void>;
}

export function defineTool<
  Schema extends z.ZodRawShape,
  ToolContext extends Context = Context,
>(
  definition: ToolDefinition<Schema, ToolContext>,
): ToolDefinition<Schema, ToolContext> {
  return definition;
}
