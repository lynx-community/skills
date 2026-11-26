// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { GetGlobalSwitch } from './App/GetGlobalSwitch.ts';
import { ListGlobalSwitch } from './App/ListGlobalSwitch.ts';
import { SetGlobalSwitch } from './App/SetGlobalSwitch.ts';
import { GetBackgroundColors } from './CSS/GetBackgroundColors.ts';
import { GetComputedStyleForNode } from './CSS/GetComputedStyleForNode.ts';
import { GetInlineStylesForNode } from './CSS/GetInlineStylesForNode.ts';
import { GetMatchedStylesForNode } from './CSS/GetMatchedStylesForNode.ts';
import { GetStyleSheetText } from './CSS/GetStyleSheetText.ts';
import { GetScriptSource } from './Debugger/GetScriptSource.ts';
import { ListScripts } from './Debugger/ListScripts.ts';
import type { ToolDefinition } from './defineTool.ts';
import { ClosePage } from './Device/ClosePage.ts';
import { ListClients } from './Device/ListClients.ts';
import { ListDevices } from './Device/ListDevices.ts';
import { ListSessions } from './Device/ListSessions.ts';
import { OpenPage } from './Device/OpenPage.ts';
import { DescribeNode } from './DOM/DescribeNode.ts';
import { GetAttributes } from './DOM/GetAttributes.ts';
import { GetBoxModel } from './DOM/GetBoxModel.ts';
import { GetDocument } from './DOM/GetDocument.ts';
import { GetDocumentWithBoxModel } from './DOM/GetDocumentWithBoxModel.ts';
import { GetNodeForLocation } from './DOM/GetNodeForLocation.ts';
import { GetOriginalNodeIndex } from './DOM/GetOriginalNodeIndex.ts';
import { GetOriginalNodeSourceInfo } from './DOM/GetOriginalNodeSourceInfo.ts';
import { GetSearchResults } from './DOM/GetSearchResults.ts';
import { InnerText } from './DOM/InnerText.ts';
import { PerformSearch } from './DOM/PerformSearch.ts';
import { PushNodesByBackendIdsToFrontend } from './DOM/PushNodesByBackendIdsToFrontend.ts';
import { QuerySelector } from './DOM/QuerySelector.ts';
import { QuerySelectorAll } from './DOM/QuerySelectorAll.ts';
import { RequestChildNodes } from './DOM/RequestChildNodes.ts';
import { ScrollIntoViewIfNeeded } from './DOM/ScrollIntoViewIfNeeded.ts';
import { SetAttributesAsText } from './DOM/SetAttributesAsText.ts';
import { TakeHeapSnapshot } from './HeapProfiler/TakeHeapSnapshot.ts';
import { EmulateTouchFromMouseEvent } from './Input/EmulateTouchFromMouseEvent.ts';
import { GetVersion } from './Lynx/GetVersion.ts';
import { GetAllMemoryUsage } from './Memory/GetAllMemoryUsage.ts';
import { GetResourceContent } from './Page/GetResourceContent.ts';
import { GetResourceTree } from './Page/GetResourceTree.ts';
import { Reload } from './Page/Reload.ts';
import { TakeScreenshot } from './Page/TakeScreenshot.ts';
import { GetAllPerformanceEntries } from './Performance/GetAllPerformanceEntries.ts';
import { GetAllTimingInfo } from './Performance/GetAllTimingInfo.ts';
import { Evaluate } from './Runtime/Evaluate.ts';
import { GetHeapUsage } from './Runtime/GetHeapUsage.ts';
import { GetProperties } from './Runtime/GetProperties.ts';
import { ListConsole } from './Runtime/ListConsole.ts';
import { GetLynxUITree } from './UITree/GetLynxUITree.ts';

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

export { GetGlobalSwitch } from './App/GetGlobalSwitch.ts';
export {
  GLOBAL_SWITCH_KEYS,
  globalSwitchKeySchema,
} from './App/globalSwitch.ts';
export { ListGlobalSwitch } from './App/ListGlobalSwitch.ts';
export { SetGlobalSwitch } from './App/SetGlobalSwitch.ts';
export { GetBackgroundColors } from './CSS/GetBackgroundColors.ts';
export { GetComputedStyleForNode } from './CSS/GetComputedStyleForNode.ts';
export { GetInlineStylesForNode } from './CSS/GetInlineStylesForNode.ts';
export { GetMatchedStylesForNode } from './CSS/GetMatchedStylesForNode.ts';
export { GetStyleSheetText } from './CSS/GetStyleSheetText.ts';
export { GetScriptSource } from './Debugger/GetScriptSource.ts';
export { ListScripts } from './Debugger/ListScripts.ts';
export { ClosePage } from './Device/ClosePage.ts';
export { ListClients } from './Device/ListClients.ts';
export { ListDevices } from './Device/ListDevices.ts';
export { ListSessions } from './Device/ListSessions.ts';
export { OpenPage } from './Device/OpenPage.ts';
export { DescribeNode } from './DOM/DescribeNode.ts';
export { GetAttributes } from './DOM/GetAttributes.ts';
export { GetBoxModel } from './DOM/GetBoxModel.ts';
export { GetDocument } from './DOM/GetDocument.ts';
export { GetDocumentWithBoxModel } from './DOM/GetDocumentWithBoxModel.ts';
export { GetNodeForLocation } from './DOM/GetNodeForLocation.ts';
export { GetOriginalNodeIndex } from './DOM/GetOriginalNodeIndex.ts';
export { GetOriginalNodeSourceInfo } from './DOM/GetOriginalNodeSourceInfo.ts';
export { GetSearchResults } from './DOM/GetSearchResults.ts';
export { InnerText } from './DOM/InnerText.ts';
export { PerformSearch } from './DOM/PerformSearch.ts';
export { PushNodesByBackendIdsToFrontend } from './DOM/PushNodesByBackendIdsToFrontend.ts';
export { QuerySelector } from './DOM/QuerySelector.ts';
export { QuerySelectorAll } from './DOM/QuerySelectorAll.ts';
export { RequestChildNodes } from './DOM/RequestChildNodes.ts';
export { ScrollIntoViewIfNeeded } from './DOM/ScrollIntoViewIfNeeded.ts';
export { SetAttributesAsText } from './DOM/SetAttributesAsText.ts';
export { TakeHeapSnapshot } from './HeapProfiler/TakeHeapSnapshot.ts';
export { EmulateTouchFromMouseEvent } from './Input/EmulateTouchFromMouseEvent.ts';
export { GetVersion } from './Lynx/GetVersion.ts';
export { GetAllMemoryUsage } from './Memory/GetAllMemoryUsage.ts';
export { GetResourceContent } from './Page/GetResourceContent.ts';
export { GetResourceTree } from './Page/GetResourceTree.ts';
export { Reload } from './Page/Reload.ts';
export { TakeScreenshot } from './Page/TakeScreenshot.ts';
export { GetAllPerformanceEntries } from './Performance/GetAllPerformanceEntries.ts';
export { GetAllTimingInfo } from './Performance/GetAllTimingInfo.ts';
export { Evaluate } from './Runtime/Evaluate.ts';
export { GetHeapUsage } from './Runtime/GetHeapUsage.ts';
export { GetProperties } from './Runtime/GetProperties.ts';
export { ListConsole } from './Runtime/ListConsole.ts';
export { GetLynxUITree } from './UITree/GetLynxUITree.ts';
