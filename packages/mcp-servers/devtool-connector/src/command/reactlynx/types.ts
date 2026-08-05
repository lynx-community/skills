// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { SnapshotRef } from '../snapshot.ts';
import type { DevNodeType, ID, VNode } from './protocol.ts';

export type ReactLynxCacheInfo =
  | { status: 'not-used' }
  | { status: 'refreshed' | 'reused'; generation: number; capturedAt: number };

export interface ReactLynxTargetData {
  clientId: string;
  sessionId: number;
  cache: ReactLynxCacheInfo;
}

export interface ReactLynxTreeData extends ReactLynxTargetData {
  labels: ID[];
  roots: ID[];
  nodes: VNode[];
}

export interface ReactLynxFindMatch {
  label: string;
  id: ID;
  name: string;
  type: DevNodeType;
  key: string;
  ancestors: Array<{ label: string; name: string }>;
}

export interface ReactLynxFindData extends ReactLynxTargetData {
  componentCount: number;
  matches: ReactLynxFindMatch[];
}

/** JSON-ish `InspectData` emitted by `@lynx-js/preact-devtools`. */
export interface ReactLynxInspectResult {
  id: ID;
  name: string;
  type: DevNodeType;
  key: string | null;
  props: unknown;
  state: unknown;
  hooks: unknown;
  context: unknown;
  signals: unknown;
  suspended?: boolean;
  canSuspend?: boolean;
  version?: string;
  __source?: { fileName: string; lineNumber: number; columnNumber: number };
}

export interface ReactLynxComponentData extends ReactLynxTargetData {
  ref: string;
  id: ID;
  component: ReactLynxInspectResult;
}

export interface ReactLynxLinkedComponent {
  ref: string | null;
  id: ID;
  type: DevNodeType;
  name: string;
  key: string;
}

export interface ReactLynxLinkData extends ReactLynxTargetData {
  direction: 'element-to-component' | 'component-to-element';
  relation: 'nearest-component' | 'first-host-element';
  element: SnapshotRef;
  component: ReactLynxLinkedComponent;
}

export type ReactLynxUpdateKind =
  | 'update-prop'
  | 'update-state'
  | 'update-context';
