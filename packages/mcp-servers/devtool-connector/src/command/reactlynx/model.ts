// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type ID,
  type RendererState,
  typeTag,
  type VNode,
} from './protocol.ts';
import type { ReactLynxFindMatch } from './types.ts';

export interface FormattedReactLynxTree {
  text: string;
  /** `labels[index]` is the vnode id represented by `@c${index + 1}`. */
  labels: ID[];
}

export interface ReactLynxTreeState {
  roots: ID[];
  nodes: VNode[];
}

export type ReactLynxLinkRef =
  | { kind: 'element'; ref: string }
  | { kind: 'component-label'; index: number }
  | { kind: 'component-id'; id: ID };

const SHELL_NAMES = new Set(['Fragment', 'Root', 'Anonymous']);
const PIPE = '│  ';
const TEE = '├─ ';
const ELBOW = '└─ ';
const SPACE = '   ';

interface FormatContext {
  state: RendererState;
  labels: ID[];
  labelOf: Map<ID, string>;
  maxDepth: number;
  lines: string[];
  hideShells: boolean;
}

function isShell(node: VNode): boolean {
  return SHELL_NAMES.has(node.name);
}

function visibleChildren(context: FormatContext, node: VNode): VNode[] {
  const output: VNode[] = [];
  for (const childId of node.children) {
    const child = context.state.tree.get(childId);
    if (!child) continue;
    if (context.hideShells && isShell(child)) {
      output.push(...visibleChildren(context, child));
    } else {
      output.push(child);
    }
  }
  return output;
}

function formatRef(context: FormatContext, node: VNode): string {
  const label = context.labelOf.get(node.id) ?? '@c?';
  const key = node.key ? ` key=${node.key}` : '';
  return `${label} [${typeTag(node.type)}] ${node.name}${key}`;
}

function walk(
  context: FormatContext,
  node: VNode,
  prefix: string,
  isLast: boolean,
  isRoot: boolean,
  depth: number,
): void {
  const connector = isRoot ? '' : isLast ? ELBOW : TEE;
  context.lines.push(`${prefix}${connector}${formatRef(context, node)}`);
  if (depth >= context.maxDepth) return;

  const children = visibleChildren(context, node);
  const childPrefix = isRoot ? '' : prefix + (isLast ? SPACE : PIPE);
  children.forEach((child, index) => {
    walk(
      context,
      child,
      childPrefix,
      index === children.length - 1,
      false,
      depth + 1,
    );
  });
}

/** Assign canonical `@cN` labels and render the matching compact tree. */
export function formatReactLynxTree(
  state: RendererState,
  options: { maxDepth?: number; hideShells?: boolean } = {},
): FormattedReactLynxTree {
  const context: FormatContext = {
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
    if (context.hideShells && isShell(root)) {
      visibleRoots.push(...visibleChildren(context, root));
    } else {
      visibleRoots.push(root);
    }
  }

  const assign = (node: VNode, depth: number): void => {
    context.labels.push(node.id);
    context.labelOf.set(node.id, `@c${context.labels.length}`);
    if (depth >= context.maxDepth) return;
    for (const child of visibleChildren(context, node))
      assign(child, depth + 1);
  };
  for (const root of visibleRoots) assign(root, 1);

  visibleRoots.forEach((root, index) => {
    walk(context, root, '', index === visibleRoots.length - 1, true, 1);
  });

  return { text: context.lines.join('\n'), labels: context.labels };
}

/** Copy a mutable renderer tree into an HTTP/JSON-safe representation. */
export function serializeRendererState(
  state: RendererState,
): ReactLynxTreeState {
  return {
    roots: [...state.roots],
    nodes: [...state.tree.values()].map((node) => ({
      ...node,
      children: [...node.children],
    })),
  };
}

/** Rebuild a renderer tree at the CLI edge without sharing daemon state. */
export function deserializeRendererState(
  value: ReactLynxTreeState,
): RendererState {
  return {
    roots: [...value.roots],
    tree: new Map(
      value.nodes.map((node) => [
        node.id,
        { ...node, children: [...node.children] },
      ]),
    ),
  };
}

export function buildSubstringMatcher(
  pattern: string,
): (name: string) => boolean {
  const needle = pattern.toLowerCase();
  return (name) => name.toLowerCase().includes(needle);
}

export function buildRegexMatcher(pattern: string): (name: string) => boolean {
  let expression: RegExp;
  try {
    expression = new RegExp(pattern);
  } catch (error) {
    throw new Error(
      `--regex pattern is invalid: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  return (name) => expression.test(name);
}

/** Find components in the exact label order used by the tree renderer. */
export function findReactLynxComponents(
  state: RendererState,
  matcher: (name: string) => boolean,
  options: {
    hideShells: boolean;
    limit: number;
    formatted?: FormattedReactLynxTree;
  },
): ReactLynxFindMatch[] {
  const formatted =
    options.formatted ??
    formatReactLynxTree(state, { hideShells: options.hideShells });
  const idToLabel = new Map<ID, string>();
  formatted.labels.forEach((id, index) => {
    idToLabel.set(id, `@c${index + 1}`);
  });

  const matches: ReactLynxFindMatch[] = [];
  for (const id of formatted.labels) {
    const node = state.tree.get(id);
    if (!node || !matcher(node.name)) continue;

    const ancestors: Array<{ label: string; name: string }> = [];
    let cursorId = node.parent;
    while (cursorId !== -1) {
      const cursor = state.tree.get(cursorId);
      if (!cursor) break;
      const label = idToLabel.get(cursorId);
      if (label) ancestors.unshift({ label, name: cursor.name });
      cursorId = cursor.parent;
    }

    matches.push({
      label: idToLabel.get(id) ?? '@c?',
      id: node.id,
      name: node.name,
      type: node.type,
      key: node.key,
      ancestors,
    });
    if (matches.length >= options.limit) break;
  }
  return matches;
}

export function parseReactLynxComponentRef(
  ref: string,
): { kind: 'label'; index: number } | { kind: 'id'; id: ID } {
  const labelMatch = /^@c(\d+)$/u.exec(ref);
  if (labelMatch) {
    const index = Number.parseInt(labelMatch[1]!, 10);
    if (!Number.isFinite(index) || index < 1) {
      throw new Error(`Invalid label ${ref}; expected @c1, @c2, ...`);
    }
    return { kind: 'label', index };
  }

  const numeric = Number.parseInt(ref, 10);
  if (!Number.isFinite(numeric) || String(numeric) !== ref.trim()) {
    throw new Error(
      `Invalid <ref> ${JSON.stringify(ref)}; expected @cN or a numeric id.`,
    );
  }
  return { kind: 'id', id: numeric };
}

export function parseReactLynxLinkRef(ref: string): ReactLynxLinkRef {
  const trimmed = ref.trim();
  const elementMatch = /^@?e(\d+)$/u.exec(trimmed);
  if (elementMatch) {
    const index = Number.parseInt(elementMatch[1]!, 10);
    if (!Number.isFinite(index) || index < 1) {
      throw new Error(`Invalid element ref ${ref}; expected @e1, @e2, ...`);
    }
    return { kind: 'element', ref: `@e${index}` };
  }

  const component = parseReactLynxComponentRef(trimmed);
  return component.kind === 'label'
    ? { kind: 'component-label', index: component.index }
    : { kind: 'component-id', id: component.id };
}

/** Add the sentinel segment discarded by the app-side Preact adapter. */
export function buildReactLynxUpdatePath(userPath: string): string {
  if (userPath.length === 0) {
    throw new Error(
      '<path> must not be empty. Use dot notation, e.g. `count`, `user.name`, `items.0.title`.',
    );
  }
  for (const prefix of ['root.', 'props.', 'state.', 'context.'] as const) {
    if (userPath.startsWith(prefix)) {
      throw new Error(
        `<path> ${JSON.stringify(userPath)} must not start with \`${prefix}\`. ` +
          'The CLI prepends `root.` automatically; pass paths starting at the field name, e.g. `count`.',
      );
    }
  }
  if (userPath.split('.').some((segment) => segment.length === 0)) {
    throw new Error(
      `<path> ${JSON.stringify(userPath)} contains an empty segment. ` +
        'Dot notation must look like `a.b.c`, not `a..b` or `.a`.',
    );
  }
  return `root.${userPath}`;
}
