// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  ReactLynxComponentData,
  ReactLynxFindData,
  ReactLynxLinkData,
  ReactLynxTreeData,
} from './reactlynx/types.ts';
import type { CommandResult } from './result.ts';
import type { Box, Point, SnapshotRef } from './snapshot.ts';

export type CommandObject = Record<string, unknown>;

export interface ClientTarget {
  clientId?: string;
}

export interface SessionTarget extends ClientTarget {
  sessionId?: number;
}

export interface SnapshotData {
  clientId: string;
  sessionId: number;
  viewport: Box | undefined;
  refs: SnapshotRef[];
}

export interface SnapshotRefreshError {
  message: string;
  cause?: string;
  recoverable: boolean;
  nextActions: string[];
}

export interface SnapshotAfterResult {
  snapshot?: SnapshotData;
  snapshotError?: SnapshotRefreshError;
}

export interface ScreenshotAnnotation {
  ref: string;
  number: number;
  tag: string;
  text?: string;
  /** Bounding box in captured-image pixels, clipped to the screenshot viewport. */
  box: Box;
}

export interface CommandMap {
  snapshot: {
    params: SessionTarget & { visibleOnly?: boolean };
    data: SnapshotData;
  };
  screenshot: {
    params: SessionTarget & { fullscreen?: boolean; annotate?: boolean };
    data: {
      clientId: string;
      sessionId: number;
      jpegBase64: string;
      width?: number;
      height?: number;
      snapshot?: SnapshotData;
      annotations?: ScreenshotAnnotation[];
    };
  };
  tap: {
    params: SessionTarget & { ref: string; snapshotAfter?: boolean };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      point: Point;
    } & SnapshotAfterResult;
  };
  'long-press': {
    params: SessionTarget & {
      ref: string;
      duration?: number;
      snapshotAfter?: boolean;
    };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      point: Point;
      longPress: true;
    } & SnapshotAfterResult;
  };
  fill: {
    params: SessionTarget & {
      ref: string;
      text: string;
      snapshotAfter?: boolean;
    };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      value: string;
    } & SnapshotAfterResult;
  };
  clear: {
    params: SessionTarget & { ref: string; snapshotAfter?: boolean };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      value: string;
    } & SnapshotAfterResult;
  };
  scroll: {
    params: SessionTarget & {
      ref: string;
      direction?: 'up' | 'down' | 'left' | 'right';
      snapshotAfter?: boolean;
    };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      direction: 'up' | 'down' | 'left' | 'right';
      from: Point;
      to: Point;
    } & SnapshotAfterResult;
  };
  'get-text': {
    params: SessionTarget & { ref: string };
    data: { clientId: string; sessionId: number; ref: string; text: string };
  };
  'get-style': {
    params: SessionTarget & { ref: string; property?: string | string[] };
    data: {
      clientId: string;
      sessionId: number;
      ref: string;
      style: Record<string, string>;
    };
  };
  wait: {
    params: SessionTarget & {
      text?: string;
      ref?: string;
      timeout?: number;
      interval?: number;
    };
    data: {
      clientId: string;
      sessionId: number;
      matched: true;
      by: 'text' | 'ref';
      query: string;
      elapsedMs: number;
    };
  };
  'reactlynx-tree': {
    params: SessionTarget & { depth?: number; showShells?: boolean };
    data: ReactLynxTreeData;
  };
  'reactlynx-find': {
    params: SessionTarget & {
      pattern: string;
      regex?: boolean;
      showShells?: boolean;
      limit?: number;
      refresh?: boolean;
    };
    data: ReactLynxFindData;
  };
  'reactlynx-component': {
    params: SessionTarget & {
      ref: string;
      showShells?: boolean;
      refresh?: boolean;
    };
    data: ReactLynxComponentData;
  };
  'reactlynx-link': {
    params: SessionTarget & {
      ref: string;
      showShells?: boolean;
      refresh?: boolean;
    };
    data: ReactLynxLinkData;
  };
  'reactlynx-update-prop': {
    params: SessionTarget & {
      ref: string;
      path: string;
      value: unknown;
      showShells?: boolean;
      refresh?: boolean;
    };
    data: ReactLynxComponentData;
  };
  'reactlynx-update-state': {
    params: SessionTarget & {
      ref: string;
      path: string;
      value: unknown;
      showShells?: boolean;
      refresh?: boolean;
    };
    data: ReactLynxComponentData;
  };
  'reactlynx-update-context': {
    params: SessionTarget & {
      ref: string;
      path: string;
      value: unknown;
      showShells?: boolean;
      refresh?: boolean;
    };
    data: ReactLynxComponentData;
  };
}

export type CommandAction = keyof CommandMap;
export type CommandParams<Action extends CommandAction> =
  CommandMap[Action]['params'];
export type CommandData<Action extends CommandAction> =
  CommandMap[Action]['data'];

export interface WaitProgressData {
  clientId: string;
  sessionId: number;
  matched: false;
  by: 'text' | 'ref';
  query: string;
  elapsedMs: number;
  refCount: number;
}

export interface StreamCommandMap {
  wait: {
    params: CommandParams<'wait'>;
    event: WaitProgressData | CommandData<'wait'>;
  };
}

export type StreamCommandAction = keyof StreamCommandMap;
export type StreamCommandParams<Action extends StreamCommandAction> =
  StreamCommandMap[Action]['params'];
export type StreamCommandEvent<Action extends StreamCommandAction> =
  StreamCommandMap[Action]['event'];

export interface CommandClient {
  execute<Action extends CommandAction>(
    action: Action,
    params: CommandParams<Action>,
    options?: { timeoutMs?: number },
  ): Promise<CommandResult<CommandData<Action>>>;
  stream<Action extends StreamCommandAction>(
    action: Action,
    params: StreamCommandParams<Action>,
    options?: { signal?: AbortSignal; method?: 'GET' | 'POST' },
  ): AsyncGenerator<CommandResult<StreamCommandEvent<Action>>>;
}
