// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import 'core-js/modules/es.promise.with-resolvers.js';
import {
  AndroidTransport,
  DaemonTransport,
  DesktopTransport,
  HDTTransport,
  iOSTransport,
} from '@lynx-js/devtool-connector/transport';
import type { Transport } from '@lynx-js/devtool-connector/transport';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GetGlobalSwitch } from './tools/App/GetGlobalSwitch.ts';
import { ListGlobalSwitch } from './tools/App/ListGlobalSwitch.ts';
import { SetGlobalSwitch } from './tools/App/SetGlobalSwitch.ts';
import { GetBackgroundColors } from './tools/CSS/GetBackgroundColors.ts';
import { GetComputedStyleForNode } from './tools/CSS/GetComputedStyleForNode.ts';
import { GetInlineStylesForNode } from './tools/CSS/GetInlineStylesForNode.ts';
import { GetMatchedStylesForNode } from './tools/CSS/GetMatchedStylesForNode.ts';
import { GetStyleSheetText } from './tools/CSS/GetStyleSheetText.ts';
import { GetScriptSource } from './tools/Debugger/GetScriptSource.ts';
import { ListScripts } from './tools/Debugger/ListScripts.ts';
import type { ToolDefinition } from './tools/defineTool.ts';
import { ClosePage } from './tools/Device/ClosePage.ts';
import { ListClients } from './tools/Device/ListClients.ts';
import { ListDevices } from './tools/Device/ListDevices.ts';
import { ListSessions } from './tools/Device/ListSessions.ts';
import { OpenPage } from './tools/Device/OpenPage.ts';
import { DescribeNode } from './tools/DOM/DescribeNode.ts';
import { GetAttributes } from './tools/DOM/GetAttributes.ts';
import { GetBoxModel } from './tools/DOM/GetBoxModel.ts';
import { GetDocument } from './tools/DOM/GetDocument.ts';
import { GetDocumentWithBoxModel } from './tools/DOM/GetDocumentWithBoxModel.ts';
import { GetNodeForLocation } from './tools/DOM/GetNodeForLocation.ts';
import { GetOriginalNodeIndex } from './tools/DOM/GetOriginalNodeIndex.ts';
import { GetOriginalNodeSourceInfo } from './tools/DOM/GetOriginalNodeSourceInfo.ts';
import { GetSearchResults } from './tools/DOM/GetSearchResults.ts';
import { InnerText } from './tools/DOM/InnerText.ts';
import { PerformSearch } from './tools/DOM/PerformSearch.ts';
import { PushNodesByBackendIdsToFrontend } from './tools/DOM/PushNodesByBackendIdsToFrontend.ts';
import { QuerySelector } from './tools/DOM/QuerySelector.ts';
import { QuerySelectorAll } from './tools/DOM/QuerySelectorAll.ts';
import { RequestChildNodes } from './tools/DOM/RequestChildNodes.ts';
import { ScrollIntoViewIfNeeded } from './tools/DOM/ScrollIntoViewIfNeeded.ts';
import { SetAttributesAsText } from './tools/DOM/SetAttributesAsText.ts';
import { TakeHeapSnapshot } from './tools/HeapProfiler/TakeHeapSnapshot.ts';
import { EmulateTouchFromMouseEvent } from './tools/Input/EmulateTouchFromMouseEvent.ts';
import { GetVersion } from './tools/Lynx/GetVersion.ts';
import { GetAllMemoryUsage } from './tools/Memory/GetAllMemoryUsage.ts';
import { GetResourceContent } from './tools/Page/GetResourceContent.ts';
import { GetResourceTree } from './tools/Page/GetResourceTree.ts';
import { Reload } from './tools/Page/Reload.ts';
import { TakeScreenshot } from './tools/Page/TakeScreenshot.ts';
import { GetAllPerformanceEntries } from './tools/Performance/GetAllPerformanceEntries.ts';
import { GetAllTimingInfo } from './tools/Performance/GetAllTimingInfo.ts';
import { Evaluate } from './tools/Runtime/Evaluate.ts';
import { GetHeapUsage } from './tools/Runtime/GetHeapUsage.ts';
import { GetProperties } from './tools/Runtime/GetProperties.ts';
import { ListConsole } from './tools/Runtime/ListConsole.ts';
import { GetLynxUITree } from './tools/UITree/GetLynxUITree.ts';

export const coreTools: readonly ToolDefinition[] = [
  // App
  ListGlobalSwitch,
  GetGlobalSwitch,
  SetGlobalSwitch,

  // CSS
  GetBackgroundColors,
  GetComputedStyleForNode,
  GetInlineStylesForNode,
  GetMatchedStylesForNode,
  GetStyleSheetText,

  // Debugger
  GetScriptSource,
  ListScripts,

  // Device
  ClosePage,
  ListClients,
  ListDevices,
  ListSessions,
  OpenPage,

  // DOM
  DescribeNode,
  GetAttributes,
  GetBoxModel,
  GetDocument,
  GetDocumentWithBoxModel,
  GetNodeForLocation,
  GetOriginalNodeIndex,
  GetOriginalNodeSourceInfo,
  GetSearchResults,
  InnerText,
  PerformSearch,
  PushNodesByBackendIdsToFrontend,
  QuerySelector,
  QuerySelectorAll,
  RequestChildNodes,
  ScrollIntoViewIfNeeded,
  SetAttributesAsText,

  // Page
  GetResourceTree,
  GetResourceContent,
  Reload,
  TakeScreenshot,

  // Lynx
  GetVersion,

  // Input
  EmulateTouchFromMouseEvent,

  // Memory
  GetAllMemoryUsage,

  // Runtime
  Evaluate,
  GetProperties,
  ListConsole,
  GetHeapUsage,

  // Performance
  GetAllTimingInfo,
  GetAllPerformanceEntries,

  // HeapProfiler
  TakeHeapSnapshot,

  // UITree
  GetLynxUITree,
] as unknown as ToolDefinition[];

export { registerTool, registerToolWithContext } from './registerTool.ts';
import { registerTool } from './registerTool.ts';

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

export type { Transport } from './connector.ts';
export { McpContext } from './McpContext.ts';
export { McpResponse } from './McpResponse.ts';
export type { ToolContextFactory } from './registerTool.ts';
export * as Schema from './schema/index.ts';
export { GetGlobalSwitch } from './tools/App/GetGlobalSwitch.ts';
export {
  GLOBAL_SWITCH_KEYS,
  globalSwitchKeySchema,
} from './tools/App/globalSwitch.ts';
export { ListGlobalSwitch } from './tools/App/ListGlobalSwitch.ts';
export { SetGlobalSwitch } from './tools/App/SetGlobalSwitch.ts';
export { GetBackgroundColors } from './tools/CSS/GetBackgroundColors.ts';
export { GetComputedStyleForNode } from './tools/CSS/GetComputedStyleForNode.ts';
export { GetInlineStylesForNode } from './tools/CSS/GetInlineStylesForNode.ts';
export { GetMatchedStylesForNode } from './tools/CSS/GetMatchedStylesForNode.ts';
export { GetStyleSheetText } from './tools/CSS/GetStyleSheetText.ts';
export { GetScriptSource } from './tools/Debugger/GetScriptSource.ts';
export { ListScripts } from './tools/Debugger/ListScripts.ts';
export {
  type Context,
  defineTool,
  type ImageContentData,
  type Request,
  type Response,
  type ToolDefinition,
} from './tools/defineTool.ts';
export { ClosePage } from './tools/Device/ClosePage.ts';
export { ListClients } from './tools/Device/ListClients.ts';
export { ListDevices } from './tools/Device/ListDevices.ts';
export { ListSessions } from './tools/Device/ListSessions.ts';
export { OpenPage } from './tools/Device/OpenPage.ts';
export { DescribeNode } from './tools/DOM/DescribeNode.ts';
export { GetAttributes } from './tools/DOM/GetAttributes.ts';
export { GetBoxModel } from './tools/DOM/GetBoxModel.ts';
export { GetDocument } from './tools/DOM/GetDocument.ts';
export { GetDocumentWithBoxModel } from './tools/DOM/GetDocumentWithBoxModel.ts';
export { GetNodeForLocation } from './tools/DOM/GetNodeForLocation.ts';
export { GetOriginalNodeIndex } from './tools/DOM/GetOriginalNodeIndex.ts';
export { GetOriginalNodeSourceInfo } from './tools/DOM/GetOriginalNodeSourceInfo.ts';
export { GetSearchResults } from './tools/DOM/GetSearchResults.ts';
export { InnerText } from './tools/DOM/InnerText.ts';
export { PerformSearch } from './tools/DOM/PerformSearch.ts';
export { PushNodesByBackendIdsToFrontend } from './tools/DOM/PushNodesByBackendIdsToFrontend.ts';
export { QuerySelector } from './tools/DOM/QuerySelector.ts';
export { QuerySelectorAll } from './tools/DOM/QuerySelectorAll.ts';
export { RequestChildNodes } from './tools/DOM/RequestChildNodes.ts';
export { ScrollIntoViewIfNeeded } from './tools/DOM/ScrollIntoViewIfNeeded.ts';
export { SetAttributesAsText } from './tools/DOM/SetAttributesAsText.ts';
export { TakeHeapSnapshot } from './tools/HeapProfiler/TakeHeapSnapshot.ts';
export { EmulateTouchFromMouseEvent } from './tools/Input/EmulateTouchFromMouseEvent.ts';
export { GetVersion } from './tools/Lynx/GetVersion.ts';
export { GetAllMemoryUsage } from './tools/Memory/GetAllMemoryUsage.ts';
export { GetResourceContent } from './tools/Page/GetResourceContent.ts';
export { GetResourceTree } from './tools/Page/GetResourceTree.ts';
export { Reload } from './tools/Page/Reload.ts';
export { TakeScreenshot } from './tools/Page/TakeScreenshot.ts';
export { GetAllPerformanceEntries } from './tools/Performance/GetAllPerformanceEntries.ts';
export { GetAllTimingInfo } from './tools/Performance/GetAllTimingInfo.ts';
export { Evaluate } from './tools/Runtime/Evaluate.ts';
export { GetHeapUsage } from './tools/Runtime/GetHeapUsage.ts';
export { GetProperties } from './tools/Runtime/GetProperties.ts';
export { ListConsole } from './tools/Runtime/ListConsole.ts';
export { GetLynxUITree } from './tools/UITree/GetLynxUITree.ts';
export {
  AbortRetryError,
  expBackoff,
  type ExpBackoffOptions,
} from './utils/backoff.ts';
export { attachMcpServerCleanup } from './utils/mcp_cleanup.ts';
export { raceWithTimeout } from './utils/raceWithTimeout.ts';
export { readableFromIterable } from './utils/readableFromIterable.ts';
export { parseSocketSpec } from './utils/socket_spec.ts';
