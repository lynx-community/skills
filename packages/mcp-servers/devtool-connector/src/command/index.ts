// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export type { CommandCallOptions, CommandStreamOptions } from './client.ts';
export {
  callCommand,
  callRawCommand,
  HttpCommandClient,
  streamCommand,
  streamRawCommand,
} from './client.ts';
export type {
  ClientTarget,
  CommandAction,
  CommandClient,
  CommandData,
  CommandMap,
  CommandObject,
  CommandParams,
  ScreenshotAnnotation,
  SessionTarget,
  SnapshotAfterResult,
  SnapshotData,
  SnapshotRefreshError,
  StreamCommandAction,
  StreamCommandEvent,
  StreamCommandMap,
  StreamCommandParams,
  WaitProgressData,
} from './contract.ts';
export type { ActionContext } from './core.ts';
export { ActionCore } from './core.ts';
export type {
  FormattedReactLynxTree,
  ReactLynxLinkRef,
  ReactLynxTreeState,
} from './reactlynx/model.ts';
export {
  buildReactLynxUpdatePath,
  buildRegexMatcher,
  buildSubstringMatcher,
  deserializeRendererState,
  findReactLynxComponents,
  formatReactLynxTree,
  parseReactLynxComponentRef,
  parseReactLynxLinkRef,
  serializeRendererState,
} from './reactlynx/model.ts';
export type {
  DevNodeType as ReactLynxDevNodeType,
  ID as ReactLynxID,
  RendererState,
  VNode,
} from './reactlynx/protocol.ts';
export {
  applyOperationV2,
  applyRootOrder,
  createRendererState,
  DevNodeType,
  typeTag,
} from './reactlynx/protocol.ts';
export type {
  ReactLynxCacheInfo,
  ReactLynxComponentData,
  ReactLynxFindData,
  ReactLynxFindMatch,
  ReactLynxInspectResult,
  ReactLynxLinkData,
  ReactLynxLinkedComponent,
  ReactLynxTargetData,
  ReactLynxTreeData,
  ReactLynxUpdateKind,
} from './reactlynx/types.ts';
export type { RefFailureReason } from './ref-actions.ts';
export { normalizeRef, touchTap, validateRef } from './ref-actions.ts';
export type {
  CommandError,
  CommandFailure,
  CommandResult,
  CommandSuccess,
} from './result.ts';
export { fail, ok } from './result.ts';
export type {
  CapturedScreenshot,
  CaptureScreenshotOptions,
  ScreencastFrameMetadata,
} from './screenshot.ts';
export {
  captureScreenshot,
  captureScreenshotFrame,
  ScreenshotTimeoutError,
} from './screenshot.ts';
export type {
  AnnotatedScreenshot,
  AnnotateScreenshotOptions,
} from './screenshot-annotation.ts';
export {
  annotateScreenshot,
  ScreenshotAnnotationError,
} from './screenshot-annotation.ts';
export type {
  Box,
  DomNode,
  Point,
  RefFlags,
  SnapshotRef,
  SnapshotResult,
} from './snapshot.ts';
export { buildRefs, buildSnapshot, centerOfQuad } from './snapshot.ts';
