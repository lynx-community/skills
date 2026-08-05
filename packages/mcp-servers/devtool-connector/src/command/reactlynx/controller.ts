// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '../../index.ts';
import {
  buildReactLynxUpdatePath,
  buildRegexMatcher,
  buildSubstringMatcher,
  findReactLynxComponents,
  formatReactLynxTree,
  parseReactLynxComponentRef,
  serializeRendererState,
} from './model.ts';
import type { ID, RendererState } from './protocol.ts';
import {
  buildReactLynxOutboundFrame,
  type PreactEnvelope,
  type ReactLynxSessionResult,
  reactLynxEmptyTreeDiagnostic,
  runReactLynxSession,
} from './session.ts';
import type {
  ReactLynxCacheInfo,
  ReactLynxComponentData,
  ReactLynxFindData,
  ReactLynxInspectResult,
  ReactLynxLinkedComponent,
  ReactLynxTreeData,
  ReactLynxUpdateKind,
} from './types.ts';

interface ReactLynxCacheEntry {
  state: RendererState;
  capturedAt: number;
  generation: number;
  labelViews: Map<string, ID[]>;
}

export interface ReactLynxCacheSnapshot {
  capturedAt: number;
  generation: number;
  nodeCount: number;
  compactLabels?: ID[];
  shellLabels?: ID[];
}

export class ReactLynxActionError extends Error {
  readonly reason: string;
  readonly recoverable: boolean;
  readonly nextActions: string[];

  constructor(
    message: string,
    options: { reason: string; recoverable?: boolean; nextActions?: string[] },
  ) {
    super(message);
    this.name = 'ReactLynxActionError';
    this.reason = options.reason;
    this.recoverable = options.recoverable ?? true;
    this.nextActions = options.nextActions ?? [];
  }
}

interface Target {
  clientId: string;
  sessionId: number;
}

interface CachedTarget extends Target {
  entry: ReactLynxCacheEntry;
  status: 'refreshed' | 'reused';
}

export interface ReactLynxElementToComponentMapping {
  cache: ReactLynxCacheInfo;
  component: ReactLynxLinkedComponent;
}

export interface ReactLynxComponentToElementMapping
  extends ReactLynxElementToComponentMapping {
  uniqueId: number;
}

function labelViewKey(showShells: boolean): string {
  return showShells ? 'shells' : 'compact';
}

function cacheInfo(target: CachedTarget): ReactLynxCacheInfo {
  return {
    status: target.status,
    generation: target.entry.generation,
    capturedAt: target.entry.capturedAt,
  };
}

function envelopeTypes(result: ReactLynxSessionResult): string {
  return [...result.envelopeTypes].sort().join(',') || '(none)';
}

function parseParameter<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    throw new ReactLynxActionError(
      error instanceof Error ? error.message : String(error),
      {
        reason: 'bad-params',
        recoverable: false,
      },
    );
  }
}

async function waitForTurn(
  turn: Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  let onAbort: (() => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    await Promise.race([turn, aborted]);
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
}

/** Daemon-owned ReactLynx tree cache and Preact DevTools action implementation. */
export class ReactLynxController {
  #cache = new Map<string, ReactLynxCacheEntry>();
  #generations = new Map<string, number>();
  #sessionTails = new Map<string, Promise<void>>();

  #key(clientId: string, sessionId: number): string {
    return `${clientId}:${sessionId}`;
  }

  async #withSession<T>(
    target: Target,
    signal: AbortSignal,
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = this.#key(target.clientId, target.sessionId);
    const previous = this.#sessionTails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.catch(() => {}).then(() => gate);
    this.#sessionTails.set(key, tail);

    try {
      await waitForTurn(
        previous.catch(() => {}),
        signal,
      );
      signal.throwIfAborted();
      return await operation();
    } finally {
      release();
      void tail.then(() => {
        if (this.#sessionTails.get(key) === tail)
          this.#sessionTails.delete(key);
      });
    }
  }

  async #capture(
    connector: Connector,
    target: Target,
    signal: AbortSignal,
  ): Promise<ReactLynxCacheEntry> {
    const result = await runReactLynxSession({
      connector,
      clientId: target.clientId,
      sessionId: target.sessionId,
      outbound: [buildReactLynxOutboundFrame('refresh')],
      signal,
    });
    if (result.state.tree.size === 0) {
      throw new ReactLynxActionError(reactLynxEmptyTreeDiagnostic(result), {
        reason: 'reactlynx-empty-tree',
        nextActions: [
          'Verify that this is a ReactLynx development build with @lynx-js/preact-devtools enabled.',
          'Run `agent-lynx reactlynx tree` again after the page has settled.',
        ],
      });
    }

    const key = this.#key(target.clientId, target.sessionId);
    const generation = (this.#generations.get(key) ?? 0) + 1;
    this.#generations.set(key, generation);
    const entry: ReactLynxCacheEntry = {
      state: result.state,
      capturedAt: Date.now(),
      generation,
      labelViews: new Map(),
    };
    this.#cache.set(key, entry);
    return entry;
  }

  async #cachedTarget(
    connector: Connector,
    target: Target,
    refresh: boolean,
    signal: AbortSignal,
  ): Promise<CachedTarget> {
    const key = this.#key(target.clientId, target.sessionId);
    const existing = refresh ? undefined : this.#cache.get(key);
    if (existing) return { ...target, entry: existing, status: 'reused' };
    const entry = await this.#capture(connector, target, signal);
    return { ...target, entry, status: 'refreshed' };
  }

  #labels(entry: ReactLynxCacheEntry, showShells: boolean): ID[] {
    const key = labelViewKey(showShells);
    const existing = entry.labelViews.get(key);
    if (existing) return existing;
    const labels = formatReactLynxTree(entry.state, {
      hideShells: !showShells,
    }).labels;
    entry.labelViews.set(key, labels);
    return labels;
  }

  #linkedComponent(
    entry: ReactLynxCacheEntry,
    id: ID,
    showShells: boolean,
  ): ReactLynxLinkedComponent | undefined {
    const node = entry.state.tree.get(id);
    if (!node) return undefined;
    const index = this.#labels(entry, showShells).indexOf(id);
    return {
      ref: index < 0 ? null : `@c${index + 1}`,
      id: node.id,
      type: node.type,
      name: node.name,
      key: node.key,
    };
  }

  #evict(target: Target): void {
    this.#cache.delete(this.#key(target.clientId, target.sessionId));
  }

  getCache(
    clientId: string,
    sessionId: number,
  ): ReactLynxCacheSnapshot | undefined {
    const entry = this.#cache.get(this.#key(clientId, sessionId));
    if (!entry) return undefined;
    const compactLabels = entry.labelViews.get('compact');
    const shellLabels = entry.labelViews.get('shells');
    return {
      capturedAt: entry.capturedAt,
      generation: entry.generation,
      nodeCount: entry.state.tree.size,
      ...(compactLabels ? { compactLabels: [...compactLabels] } : {}),
      ...(shellLabels ? { shellLabels: [...shellLabels] } : {}),
    };
  }

  tree(
    connector: Connector,
    target: Target,
    options: { depth?: number; showShells: boolean },
    signal: AbortSignal,
  ): Promise<ReactLynxTreeData> {
    return this.#withSession(target, signal, async () => {
      const cached = await this.#cachedTarget(connector, target, true, signal);
      const formatted = formatReactLynxTree(cached.entry.state, {
        hideShells: !options.showShells,
        ...(options.depth === undefined ? {} : { maxDepth: options.depth }),
      });
      cached.entry.labelViews.set(
        labelViewKey(options.showShells),
        formatted.labels,
      );
      const serialized = serializeRendererState(cached.entry.state);
      return {
        ...target,
        cache: cacheInfo(cached),
        labels: formatted.labels,
        roots: serialized.roots,
        nodes: serialized.nodes,
      };
    });
  }

  find(
    connector: Connector,
    target: Target,
    options: {
      pattern: string;
      regex: boolean;
      showShells: boolean;
      limit: number;
      refresh: boolean;
    },
    signal: AbortSignal,
  ): Promise<ReactLynxFindData> {
    return this.#withSession(target, signal, async () => {
      const matcher = parseParameter(() =>
        options.regex
          ? buildRegexMatcher(options.pattern)
          : buildSubstringMatcher(options.pattern),
      );
      const cached = await this.#cachedTarget(
        connector,
        target,
        options.refresh,
        signal,
      );
      const formatted = formatReactLynxTree(cached.entry.state, {
        hideShells: !options.showShells,
      });
      const matches = findReactLynxComponents(cached.entry.state, matcher, {
        hideShells: !options.showShells,
        limit: options.limit,
        formatted,
      });
      if (matches.length === 0) {
        throw new ReactLynxActionError(
          `No components match ${options.regex ? 'regex' : 'substring'} ${JSON.stringify(options.pattern)} ` +
            `(searched ${cached.entry.state.tree.size} components${options.showShells ? '' : ', shells hidden'}).`,
          {
            reason: 'reactlynx-no-match',
            nextActions: [
              'Try a broader pattern or run `agent-lynx reactlynx tree`.',
            ],
          },
        );
      }
      cached.entry.labelViews.set(
        labelViewKey(options.showShells),
        formatted.labels,
      );
      return {
        ...target,
        cache: cacheInfo(cached),
        componentCount: cached.entry.state.tree.size,
        matches,
      };
    });
  }

  component(
    connector: Connector,
    target: Target,
    options: { ref: string; showShells: boolean; refresh: boolean },
    signal: AbortSignal,
  ): Promise<ReactLynxComponentData> {
    return this.#withSession(target, signal, async () => {
      const parsed = parseParameter(() =>
        parseReactLynxComponentRef(options.ref),
      );
      if (parsed.kind === 'id') {
        const component = await this.#inspect(
          connector,
          target,
          parsed.id,
          signal,
        );
        return {
          ...target,
          cache: { status: 'not-used' },
          ref: options.ref,
          id: parsed.id,
          component,
        };
      }

      const cached = await this.#cachedTarget(
        connector,
        target,
        options.refresh,
        signal,
      );
      const labels = this.#labels(cached.entry, options.showShells);
      const id = labels[parsed.index - 1];
      if (id === undefined) {
        throw new ReactLynxActionError(
          `Label ${options.ref} does not exist; the cached tree has ${labels.length} labelled component(s).`,
          {
            reason: 'reactlynx-ref-not-found',
            nextActions: [
              'Run `agent-lynx reactlynx tree`, then retry with one of its labels.',
            ],
          },
        );
      }

      try {
        const component = await this.#inspect(connector, target, id, signal);
        return {
          ...target,
          cache: cacheInfo(cached),
          ref: options.ref,
          id,
          component,
        };
      } catch (error) {
        this.#evict(target);
        throw error;
      }
    });
  }

  componentForElement(
    connector: Connector,
    target: Target,
    options: { uniqueId: number; showShells: boolean; refresh: boolean },
    signal: AbortSignal,
  ): Promise<ReactLynxElementToComponentMapping> {
    return this.#withSession(target, signal, async () => {
      let cached = await this.#cachedTarget(
        connector,
        target,
        options.refresh,
        signal,
      );
      const id = await this.#componentIdForUniqueId(
        connector,
        target,
        options.uniqueId,
        signal,
      );

      if (!cached.entry.state.tree.has(id) && cached.status === 'reused') {
        cached = {
          ...target,
          entry: await this.#capture(connector, target, signal),
          status: 'refreshed',
        };
      }
      const component = this.#linkedComponent(
        cached.entry,
        id,
        options.showShells,
      );
      if (!component) {
        throw new ReactLynxActionError(
          `Mapped component id ${id} is absent from the current ReactLynx tree.`,
          {
            reason: 'reactlynx-stale-component',
            nextActions: [
              'Run `agent-lynx reactlynx tree`, then retry the link.',
            ],
          },
        );
      }
      return { cache: cacheInfo(cached), component };
    });
  }

  elementForComponent(
    connector: Connector,
    target: Target,
    options: { ref: string; showShells: boolean; refresh: boolean },
    signal: AbortSignal,
  ): Promise<ReactLynxComponentToElementMapping> {
    return this.#withSession(target, signal, async () => {
      const parsed = parseParameter(() =>
        parseReactLynxComponentRef(options.ref),
      );
      let cached = await this.#cachedTarget(
        connector,
        target,
        options.refresh,
        signal,
      );
      let id: ID;
      if (parsed.kind === 'label') {
        const labels = this.#labels(cached.entry, options.showShells);
        const resolved = labels[parsed.index - 1];
        if (resolved === undefined) {
          throw new ReactLynxActionError(
            `Label ${options.ref} does not exist; the cached tree has ${labels.length} labelled component(s).`,
            {
              reason: 'reactlynx-ref-not-found',
              nextActions: [
                'Run `agent-lynx reactlynx tree`, then retry with one of its labels.',
              ],
            },
          );
        }
        id = resolved;
      } else {
        id = parsed.id;
        if (!cached.entry.state.tree.has(id) && cached.status === 'reused') {
          cached = {
            ...target,
            entry: await this.#capture(connector, target, signal),
            status: 'refreshed',
          };
        }
      }

      const component = this.#linkedComponent(
        cached.entry,
        id,
        options.showShells,
      );
      if (!component) {
        throw new ReactLynxActionError(
          `Component id ${id} is absent from the current ReactLynx tree.`,
          {
            reason: 'reactlynx-ref-not-found',
            nextActions: [
              'Run `agent-lynx reactlynx tree`, then retry the link.',
            ],
          },
        );
      }
      const uniqueId = await this.#uniqueIdForComponent(
        connector,
        target,
        id,
        signal,
      );
      return { cache: cacheInfo(cached), component, uniqueId };
    });
  }

  update(
    connector: Connector,
    target: Target,
    options: {
      kind: ReactLynxUpdateKind;
      ref: string;
      path: string;
      value: unknown;
      showShells: boolean;
      refresh: boolean;
    },
    signal: AbortSignal,
  ): Promise<ReactLynxComponentData> {
    return this.#withSession(target, signal, async () => {
      const path = parseParameter(() => buildReactLynxUpdatePath(options.path));
      const parsed = parseParameter(() =>
        parseReactLynxComponentRef(options.ref),
      );
      let id: ID;
      let cached: CachedTarget | undefined;
      if (parsed.kind === 'id') {
        id = parsed.id;
      } else {
        cached = await this.#cachedTarget(
          connector,
          target,
          options.refresh,
          signal,
        );
        const labels = this.#labels(cached.entry, options.showShells);
        const resolved = labels[parsed.index - 1];
        if (resolved === undefined) {
          throw new ReactLynxActionError(
            `Label ${options.ref} does not exist; the cached tree has ${labels.length} labelled component(s).`,
            {
              reason: 'reactlynx-ref-not-found',
              nextActions: [
                'Run `agent-lynx reactlynx tree`, then retry with one of its labels.',
              ],
            },
          );
        }
        id = resolved;
      }

      try {
        const component = await this.#update(
          connector,
          target,
          options.kind,
          { id, path, value: options.value },
          signal,
        );
        return {
          ...target,
          cache: cached ? cacheInfo(cached) : { status: 'not-used' },
          ref: options.ref,
          id,
          component,
        };
      } catch (error) {
        if (cached) this.#evict(target);
        throw error;
      }
    });
  }

  async #inspect(
    connector: Connector,
    target: Target,
    id: ID,
    signal: AbortSignal,
  ): Promise<ReactLynxInspectResult> {
    let component: ReactLynxInspectResult | undefined;
    const result = await runReactLynxSession({
      connector,
      clientId: target.clientId,
      sessionId: target.sessionId,
      outbound: [buildReactLynxOutboundFrame<ID>('inspect', id)],
      awaitEnvelope: true,
      idleMs: 1_000,
      maxMs: 5_000,
      signal,
      onEnvelope: (envelope: PreactEnvelope) => {
        if (
          envelope.type === 'inspect-result' &&
          typeof envelope.data === 'object' &&
          envelope.data !== null &&
          (envelope.data as { id?: number }).id === id
        ) {
          component = envelope.data as ReactLynxInspectResult;
          return 'stop';
        }
        return 'continue';
      },
    });
    if (component) return component;
    throw new ReactLynxActionError(
      `No \`inspect-result\` for id ${id} after ${result.framesSeen} frame(s) ` +
        `(types=${envelopeTypes(result)}). The component may be stale, the session may not be ReactLynx, ` +
        "or the App's @lynx-js/preact-devtools may not support inspect.",
      {
        reason: 'reactlynx-no-response',
        nextActions: [
          'Run `agent-lynx reactlynx tree` to refresh component refs, then retry.',
        ],
      },
    );
  }

  async #componentIdForUniqueId(
    connector: Connector,
    target: Target,
    uniqueId: number,
    signal: AbortSignal,
  ): Promise<ID> {
    let id: ID | undefined;
    const result = await runReactLynxSession({
      connector,
      clientId: target.clientId,
      sessionId: target.sessionId,
      outbound: [buildReactLynxOutboundFrame('element-picked', { uniqueId })],
      awaitEnvelope: true,
      idleMs: 1_000,
      maxMs: 5_000,
      signal,
      onEnvelope: (envelope: PreactEnvelope) => {
        if (envelope.type !== 'element-picked-vnode-id') return 'continue';
        const candidate = (envelope.data as { id?: unknown } | null)?.id;
        if (typeof candidate !== 'number' || !Number.isFinite(candidate))
          return 'continue';
        id = candidate;
        return 'stop';
      },
    });
    if (id !== undefined) return id;
    throw new ReactLynxActionError(
      `No ReactLynx component mapping was returned for DOM uniqueId ${uniqueId} after ` +
        `${result.framesSeen} frame(s) (types=${envelopeTypes(result)}). The element may not be React-owned, ` +
        'or the App-side identity mapping may not be ready.',
      {
        reason: 'reactlynx-component-not-found',
        nextActions: [
          'Retry after the page has settled, or run `agent-lynx reactlynx tree --refresh`.',
        ],
      },
    );
  }

  async #uniqueIdForComponent(
    connector: Connector,
    target: Target,
    id: ID,
    signal: AbortSignal,
  ): Promise<number> {
    let uniqueId: number | undefined;
    const result = await runReactLynxSession({
      connector,
      clientId: target.clientId,
      sessionId: target.sessionId,
      outbound: [buildReactLynxOutboundFrame('highlight', id)],
      awaitEnvelope: true,
      idleMs: 1_000,
      maxMs: 5_000,
      signal,
      onEnvelope: (envelope: PreactEnvelope) => {
        if (envelope.type !== 'preact-devtools-highlight') return 'continue';
        const candidate = (envelope.data as { uniqueId?: unknown } | null)
          ?.uniqueId;
        if (typeof candidate !== 'number' || !Number.isFinite(candidate))
          return 'continue';
        uniqueId = candidate;
        return 'stop';
      },
    });
    if (uniqueId !== undefined) return uniqueId;
    throw new ReactLynxActionError(
      `No host element mapping was returned for component id ${id} after ${result.framesSeen} frame(s) ` +
        `(types=${envelopeTypes(result)}). The component may render null or a Fragment, or its host element ` +
        'may be offscreen in a virtual list.',
      {
        reason: 'reactlynx-element-not-found',
        nextActions: [
          'Make the component visible, or retry with `--refresh` after the page has settled.',
        ],
      },
    );
  }

  async #update(
    connector: Connector,
    target: Target,
    kind: ReactLynxUpdateKind,
    payload: { id: ID; path: string; value: unknown },
    signal: AbortSignal,
  ): Promise<ReactLynxInspectResult> {
    let confirmation: ReactLynxInspectResult | undefined;
    const result = await runReactLynxSession({
      connector,
      clientId: target.clientId,
      sessionId: target.sessionId,
      outbound: [buildReactLynxOutboundFrame(kind, payload)],
      awaitEnvelope: true,
      idleMs: 1_000,
      maxMs: 5_000,
      signal,
      onEnvelope: (envelope: PreactEnvelope) => {
        if (
          envelope.type === 'inspect-result' &&
          typeof envelope.data === 'object' &&
          envelope.data !== null &&
          (envelope.data as { id?: number }).id === payload.id
        ) {
          confirmation = envelope.data as ReactLynxInspectResult;
          return 'stop';
        }
        return 'continue';
      },
    });
    if (confirmation) return confirmation;
    throw new ReactLynxActionError(
      `No confirmation \`inspect-result\` for id ${payload.id} after ${result.framesSeen} frame(s) ` +
        `(types=${envelopeTypes(result)}). The component may be stale or the App may not support \`${kind}\`.`,
      {
        reason: 'reactlynx-no-response',
        nextActions: [
          'Run `agent-lynx reactlynx tree`, verify the component/path, then retry.',
        ],
      },
    );
  }
}
