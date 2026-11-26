// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import 'core-js/modules/es.promise.with-resolvers.js';
import type { Transport } from '@lynx-js/devtool-connector/transport';
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  HDTTransport,
  iOSTransport,
} from '@lynx-js/devtool-connector/transport';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTool } from './registerTool.ts';
import { coreTools } from './tools/index.ts';

export {
  registerTool,
  registerToolWithContext,
  type ToolContextFactory,
  type ToolRegistrar,
} from './registerTool.ts';
export { coreTools };

export function setupCoreServer(
  mcpServer: McpServer,
  transports?: Transport[],
): void {
  transports ??= createDefaultTransports();
  for (const tool of coreTools) {
    registerTool(mcpServer, tool, transports);
  }
}

export interface SetupServerOptions {
  transports?: Transport[];
}

/** Register the public Lynx tools with the shared daemon by default. */
export function setupServer(
  mcpServer: McpServer,
  transportsOrOptions?: Transport[] | SetupServerOptions,
): void {
  const transports = Array.isArray(transportsOrOptions)
    ? transportsOrOptions
    : transportsOrOptions?.transports ?? [new DaemonTransport()];
  setupCoreServer(mcpServer, transports);
}

function createDefaultTransports(): Transport[] {
  return [
    ...HDTTransport.createTransports(),
    new DaemonTransport(),
    new iOSTransport(),
    new AndroidTransport({ host: '127.0.0.1', port: 5037 }),
    new DesktopTransport(),
  ];
}

export type { Transport };
export { McpContext } from './McpContext.ts';
export * as Schema from './schema/index.ts';
export {
  type Context,
  defineTool,
  type ImageContentData,
  type Request,
  type Response,
  type ToolDefinition,
} from './tools/defineTool.ts';
