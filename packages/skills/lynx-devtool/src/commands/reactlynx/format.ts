// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { type ID, type RendererState, typeTag, type VNode } from "./protocol.ts";

export interface FormattedTree {
  text: string;
  labels: ID[];
}

const PIPE = "│  ";
const TEE = "├─ ";
const ELBOW = "└─ ";
const SPACE = "   ";

interface FormatContext {
  state: RendererState;
  labels: ID[];
  labelOf: Map<ID, string>;
  maxDepth: number;
  lines: string[];
  hideShells: boolean;
}

const SHELL_NAMES = new Set(["Fragment", "Root", "Anonymous"]);

function isShell(node: VNode): boolean {
  return SHELL_NAMES.has(node.name);
}

function visibleChildren(ctx: FormatContext, node: VNode): VNode[] {
  const out: VNode[] = [];
  for (const cid of node.children) {
    const child = ctx.state.tree.get(cid);
    if (!child) continue;
    if (ctx.hideShells && isShell(child)) {
      out.push(...visibleChildren(ctx, child));
    } else {
      out.push(child);
    }
  }
  return out;
}

function formatRef(ctx: FormatContext, node: VNode): string {
  const label = ctx.labelOf.get(node.id) ?? "@c?";
  let out = `${label} [${typeTag(node.type)}] ${node.name}`;
  if (node.key) out += ` key=${node.key}`;
  return out;
}

function walk(
  ctx: FormatContext,
  node: VNode,
  prefix: string,
  isLast: boolean,
  isRoot: boolean,
  depth: number,
): void {
  const connector = isRoot ? "" : isLast ? ELBOW : TEE;
  ctx.lines.push(`${prefix}${connector}${formatRef(ctx, node)}`);

  if (depth >= ctx.maxDepth) return;

  const children = visibleChildren(ctx, node);
  const childPrefix = isRoot ? "" : prefix + (isLast ? SPACE : PIPE);
  children.forEach((child, idx) => {
    walk(ctx, child, childPrefix, idx === children.length - 1, false, depth + 1);
  });
}

export function formatTree(
  state: RendererState,
  options: { maxDepth?: number; hideShells?: boolean } = {},
): FormattedTree {
  const ctx: FormatContext = {
    state,
    labels: [],
    labelOf: new Map(),
    maxDepth: options.maxDepth ?? Number.POSITIVE_INFINITY,
    lines: [],
    hideShells: options.hideShells ?? true,
  };

  const visibleRoots: VNode[] = [];
  for (const rootId of state.roots) {
    const root = state.tree.get(rootId);
    if (!root) continue;
    if (ctx.hideShells && isShell(root)) {
      visibleRoots.push(...visibleChildren(ctx, root));
    } else {
      visibleRoots.push(root);
    }
  }

  function assign(node: VNode, depth: number): void {
    ctx.labels.push(node.id);
    ctx.labelOf.set(node.id, `@c${ctx.labels.length}`);
    if (depth >= ctx.maxDepth) return;
    for (const c of visibleChildren(ctx, node)) assign(c, depth + 1);
  }
  for (const r of visibleRoots) assign(r, 1);

  visibleRoots.forEach((root, idx) => {
    walk(ctx, root, "", idx === visibleRoots.length - 1, true, 1);
  });

  return { text: ctx.lines.join("\n"), labels: ctx.labels };
}
