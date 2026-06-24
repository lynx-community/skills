// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export interface Node {
  nodeId: number;
  backendNodeId: number;
  nodeType: number;
  nodeName: string;
  localName: string;
  nodeValue: string;
  attributes?: string[];
  childNodeCount?: number;
  children?: Node[];
  box_model?: BoxModel;
}

export interface BoxModel {
  content: number[];
  padding: number[];
  border: number[];
  margin: number[];
  width: number;
  height: number;
}

export interface GetDocumentResponse {
  root: Node;
}

export interface DescribeNodeResponse {
  node?: Node;
  compress?: boolean;
}

export interface GetAttributesResponse {
  attributes: string[];
}

export interface GetBoxModelResponse {
  model: BoxModel;
}

export interface QuerySelectorResponse {
  nodeId: number;
}

export interface QuerySelectorAllResponse {
  nodeIds: number[];
}

export interface PerformSearchResponse {
  searchId: number | string;
  resultCount: number;
}

export interface GetSearchResultsResponse {
  nodeIds: number[];
}

export interface PushNodesByBackendIdsToFrontendResponse {
  nodeIds: number[];
}

export interface InnerTextResponse {
  nodeId: number;
  rawTextValues: string[];
}

export interface GetOriginalNodeIndexResponse {
  nodeIndex: number;
}

export interface UITreeNode {
  name?: string;
  id?: number;
  tagName?: string;
  nodeIndex?: number;
  props?: Record<string, unknown>;
  label?: string;
  frame?: number[];
  children?: UITreeNode[];
}

export interface GetLynxUITreeResponse {
  root: UITreeNode;
  compress?: boolean;
}

export interface PerformanceEntry {
  entryType?: string;
  name?: string;
  instanceId?: number;
  [key: string]: unknown;
}

export interface GetAllPerformanceEntriesResponse {
  entries: PerformanceEntry[];
}
