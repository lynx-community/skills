// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { DebugMetadataAsset, RemappedUiNode } from "@lynx-js/debug-metadata";
import { remapUiTree } from "@lynx-js/debug-metadata";
import type { Connector } from "../index.ts";

export type RemapStatus = "mapped" | "runtime_only" | "unsupported";

export interface OriginalNodeSourceInfo {
  nodeId?: number;
  tag?: string;
  nodeIndex?: number;
  debugMetadataUrl?: string;
  lazyBundleUrl?: string | null;
  repo?: string | null;
  source?: string | null;
  line?: number | null;
  column?: number | null;
  status?: RemapStatus;
  reason?: string | null;
}

export type DebugMetadataLoader = (url: string) => Promise<DebugMetadataAsset>;

const debugMetadataCaches = new WeakMap<DebugMetadataLoader, Map<string, Promise<DebugMetadataAsset>>>();
const DEBUG_METADATA_FETCH_TIMEOUT_MS = 30_000;

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch debug metadata from ${url}: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json() as T;
}

export async function fetchDebugMetadata(debugMetadataUrl: string): Promise<DebugMetadataAsset> {
  return await fetchJson<DebugMetadataAsset>(debugMetadataUrl, AbortSignal.timeout(DEBUG_METADATA_FETCH_TIMEOUT_MS));
}

async function loadDebugMetadata(debugMetadataUrl: string, loader: DebugMetadataLoader): Promise<DebugMetadataAsset> {
  let debugMetadataCache = debugMetadataCaches.get(loader);
  if (!debugMetadataCache) {
    debugMetadataCache = new Map();
    debugMetadataCaches.set(loader, debugMetadataCache);
  }
  const cached = debugMetadataCache.get(debugMetadataUrl);
  if (cached) {
    return cached;
  }

  const loading = Promise.resolve().then(() => loader(debugMetadataUrl));

  debugMetadataCache.set(debugMetadataUrl, loading);

  try {
    return await loading;
  } catch (error) {
    debugMetadataCache.delete(debugMetadataUrl);
    throw error;
  }
}

export async function remapOriginalNodeSourceInfo(
  sourceInfo: OriginalNodeSourceInfo,
  loader: DebugMetadataLoader = fetchDebugMetadata,
): Promise<OriginalNodeSourceInfo> {
  // 1) Missing inputs: cannot remap, mark unsupported.
  if (typeof sourceInfo.nodeIndex !== "number" || !sourceInfo.debugMetadataUrl) {
    return {
      ...sourceInfo,
      status: "unsupported",
      reason: "Node has no debugMetadataUrl or nodeIndex; UIWiki source info is unavailable.",
    };
  }

  // 2) Only feed the fields the library expects. Do not leak CDP-specific
  //    fields (nodeId / tag / lazyBundleUrl) into the UiNode input.
  let remapped: RemappedUiNode;
  try {
    remapped = await remapUiTree(
      {
        nodeIndex: sourceInfo.nodeIndex,
        debugMetadataUrl: sourceInfo.debugMetadataUrl,
      },
      url => loadDebugMetadata(url, loader),
    );
  } catch (error) {
    return {
      ...sourceInfo,
      status: "unsupported",
      reason: `Failed to remap debug metadata: ${(error as Error).message}`,
    };
  }

  // 3) Explicitly pick the location fields; do not return the RemappedUiNode
  //    directly so CDP-specific fields on sourceInfo are preserved by type.
  const location = {
    repo: remapped.repo ?? null,
    source: remapped.source ?? null,
    line: typeof remapped.line === "number" ? remapped.line : null,
    column: typeof remapped.column === "number" ? remapped.column : null,
  };

  const hasLocation = location.line !== null && location.column !== null;
  if (hasLocation) {
    return { ...sourceInfo, ...location, status: "mapped", reason: null };
  }

  if (sourceInfo.tag === "wrapper") {
    return {
      ...sourceInfo,
      ...location,
      status: "runtime_only",
      reason: "Runtime generated wrapper node has no direct source location.",
    };
  }

  return {
    ...sourceInfo,
    ...location,
    status: "unsupported",
    reason: "nodeIndex is not present in the UI source map.",
  };
}

export async function getOriginalNodeSourceInfo(
  connector: Connector,
  clientId: string,
  sessionId: number,
  nodeId: number,
  signal?: AbortSignal,
  loader: DebugMetadataLoader = fetchDebugMetadata,
): Promise<OriginalNodeSourceInfo> {
  signal?.throwIfAborted();
  const sourceInfo = await connector.sendCDPMessage<OriginalNodeSourceInfo, { nodeId: number }>(
    clientId,
    sessionId,
    "DOM.getOriginalNodeSourceInfo",
    { nodeId },
  );
  signal?.throwIfAborted();
  const remapped = await remapOriginalNodeSourceInfo(sourceInfo, loader);
  signal?.throwIfAborted();
  return remapped;
}
