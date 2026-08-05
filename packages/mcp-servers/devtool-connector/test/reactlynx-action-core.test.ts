// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { ReadableStream } from 'node:stream/web';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import type { CommandData } from '../src/command/contract.ts';
import { ActionCore } from '../src/command/core.ts';
import {
  applyOperationV2,
  createRendererState,
} from '../src/command/reactlynx/protocol.ts';
import type { PreactEnvelope } from '../src/command/reactlynx/session.ts';
import type { DomNode } from '../src/command/snapshot.ts';
import type { Connector } from '../src/index.ts';

const ADD_VNODE = 2;
const COMMIT_STATS = 7;
const TARGET = { clientId: 'device:8901', sessionId: 7 };

interface OutboundEnvelope extends PreactEnvelope {
  data: unknown;
}

function operation(strings: string[], body: number[]): number[] {
  const table: number[] = [];
  let tableLength = 0;
  for (const value of strings) {
    tableLength += value.length + 1;
    table.push(
      value.length,
      ...[...value].map((character) => character.codePointAt(0)!),
    );
  }
  return [1, tableLength, ...table, ...body];
}

function componentTree(): number[] {
  return operation(
    ['Root', 'App', 'Parent', 'Deep', 'Sibling'],
    [
      ADD_VNODE,
      1,
      0,
      -1,
      -1,
      1,
      0,
      0,
      0,
      ADD_VNODE,
      2,
      3,
      1,
      1,
      2,
      0,
      0,
      0,
      ADD_VNODE,
      3,
      3,
      2,
      2,
      3,
      0,
      0,
      0,
      ADD_VNODE,
      4,
      3,
      3,
      3,
      4,
      0,
      0,
      0,
      ADD_VNODE,
      5,
      3,
      2,
      2,
      5,
      0,
      0,
      0,
    ],
  );
}

function vmEvent(type: string, data: unknown): unknown {
  return {
    method: 'Lynx.onVMEvent',
    params: {
      event: 'PreactDevtools',
      data: JSON.stringify({ source: 'preact-page-hook', type, data }),
    },
  };
}

function inspectResult(
  id: number,
  props: Record<string, unknown> = {},
): unknown {
  const names: Record<number, string> = {
    1: 'Root',
    2: 'App',
    3: 'Parent',
    4: 'Deep',
    5: 'Sibling',
  };
  return {
    id,
    name: names[id] ?? 'Unknown',
    type: 3,
    key: null,
    props,
    state: null,
    hooks: null,
    context: null,
    signals: null,
  };
}

function quad(x: number, y: number, width: number, height: number): number[] {
  return [x, y, x + width, y, x + width, y + height, x, y + height];
}

function domTree(): DomNode {
  return {
    nodeId: 100,
    backendNodeId: 100,
    localName: 'page',
    box_model: { content: quad(0, 0, 300, 600) },
    children: [
      {
        nodeId: 104,
        backendNodeId: 999,
        localName: 'view',
        attributes: ['text', 'Unrelated frontend collision'],
        box_model: { content: quad(5, 5, 10, 10) },
      },
      {
        nodeId: 4,
        backendNodeId: 104,
        localName: 'view',
        attributes: ['text', 'Deep host'],
        box_model: { content: quad(20, 30, 120, 40) },
      },
    ],
  };
}

interface ReactLynxHarness {
  connector: Connector;
  outbound: OutboundEnvelope[];
  streamCount: number;
  refreshCount: number;
  maxActiveStreams: number;
}

function createHarness(
  options: { refreshDelayMs?: number; respondToInspect?: boolean } = {},
): ReactLynxHarness {
  const harness: ReactLynxHarness = {
    connector: undefined as unknown as Connector,
    outbound: [],
    streamCount: 0,
    refreshCount: 0,
    maxActiveStreams: 0,
  };
  let activeStreams = 0;

  harness.connector = {
    async sendCDPMessage(
      _clientId: string,
      _sessionId: number,
      method: string,
    ) {
      if (method === 'DOM.enable') return {};
      if (method === 'DOM.getDocumentWithBoxModel') return { root: domTree() };
      throw new Error(`Unexpected CDP method ${method}`);
    },
    async sendCDPStream(
      _clientId: string,
      _sessionId: number,
      input: ReadableStream<{ method: string; params?: unknown }>,
      streamOptions?: { signal?: AbortSignal },
    ) {
      harness.streamCount += 1;
      activeStreams += 1;
      harness.maxActiveStreams = Math.max(
        harness.maxActiveStreams,
        activeStreams,
      );
      let outputController:
        | ReadableStreamDefaultController<unknown>
        | undefined;
      let disposed = false;
      const output = new ReadableStream<unknown>({
        start(controller) {
          outputController = controller;
        },
      });

      const abort = () => {
        try {
          outputController?.error(streamOptions?.signal?.reason);
        } catch {
          // The session may already have cancelled this output stream.
        }
      };
      streamOptions?.signal?.addEventListener('abort', abort, { once: true });

      const inputClosed = (async () => {
        try {
          for await (const frame of input) {
            const params = frame.params as { data?: string } | undefined;
            const envelope = JSON.parse(
              params?.data ?? 'null',
            ) as OutboundEnvelope;
            harness.outbound.push(envelope);
            if (envelope.type === 'refresh') {
              harness.refreshCount += 1;
              if (options.refreshDelayMs) await delay(options.refreshDelayMs);
              outputController?.enqueue(
                vmEvent('operation_v2', componentTree()),
              );
              outputController?.enqueue(vmEvent('root-order', [1]));
              outputController?.close();
            } else if (
              envelope.type === 'inspect' &&
              options.respondToInspect !== false
            ) {
              const id = envelope.data as number;
              outputController?.enqueue(
                vmEvent('inspect-result', inspectResult(id)),
              );
            } else if (
              envelope.type.startsWith('update-') &&
              options.respondToInspect !== false
            ) {
              const payload = envelope.data as {
                id: number;
                path: string;
                value: unknown;
              };
              outputController?.enqueue(
                vmEvent(
                  'inspect-result',
                  inspectResult(payload.id, { [payload.path]: payload.value }),
                ),
              );
            } else if (envelope.type === 'element-picked') {
              const uniqueId = (envelope.data as { uniqueId?: number } | null)
                ?.uniqueId;
              if (uniqueId === 104)
                outputController?.enqueue(
                  vmEvent('element-picked-vnode-id', { id: 4 }),
                );
            } else if (envelope.type === 'highlight') {
              const id = envelope.data as number;
              if (id === 4) {
                outputController?.enqueue(
                  vmEvent('preact-devtools-highlight', {
                    snapshotId: 44,
                    uniqueId: 104,
                  }),
                );
              }
            }
          }
        } catch {
          // Cancellation is the normal way a short-lived command closes input.
        }
      })();

      return Object.assign(output, {
        inputClosed,
        async [Symbol.asyncDispose]() {
          if (disposed) return;
          disposed = true;
          streamOptions?.signal?.removeEventListener('abort', abort);
          try {
            outputController?.close();
          } catch {
            // The output can already be closed or errored.
          }
          await inputClosed;
          activeStreams -= 1;
        },
      });
    },
  } as unknown as Connector;
  return harness;
}

test('ReactLynx ActionCore caches the exact emitted label view across commands', async () => {
  const harness = createHarness();
  const core = new ActionCore();

  const tree = await core.execute(
    'reactlynx-tree',
    { ...TARGET, depth: 2 },
    { connector: harness.connector },
  );
  assert.equal(tree.ok, true, tree.error?.message);
  if (!tree.ok) return;
  const treeData = tree.data as CommandData<'reactlynx-tree'>;
  assert.deepEqual(treeData.labels, [2, 3, 5]);
  assert.equal(treeData.cache.status, 'refreshed');
  assert.deepEqual(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId)?.compactLabels,
    [2, 3, 5],
  );

  const sibling = await core.execute(
    'reactlynx-component',
    { ...TARGET, ref: '@c3' },
    { connector: harness.connector },
  );
  assert.equal(sibling.ok, true, sibling.error?.message);
  if (!sibling.ok) return;
  assert.equal(
    (sibling.data as CommandData<'reactlynx-component'>).component.name,
    'Sibling',
  );
  assert.deepEqual(
    harness.outbound.map((envelope) => envelope.type),
    ['init', 'refresh', 'init', 'inspect'],
  );

  const shell = await core.execute(
    'reactlynx-component',
    { ...TARGET, ref: '@c1', showShells: true },
    { connector: harness.connector },
  );
  assert.equal(shell.ok, true, shell.error?.message);
  if (!shell.ok) return;
  assert.equal(
    (shell.data as CommandData<'reactlynx-component'>).component.name,
    'Root',
  );
  assert.deepEqual(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId)?.compactLabels,
    [2, 3, 5],
  );
  assert.deepEqual(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId)?.shellLabels,
    [1, 2, 3, 4, 5],
  );

  const find = await core.execute(
    'reactlynx-find',
    { ...TARGET, pattern: 'Deep' },
    { connector: harness.connector },
  );
  assert.equal(find.ok, true, find.error?.message);
  if (!find.ok) return;
  const findData = find.data as CommandData<'reactlynx-find'>;
  assert.equal(findData.cache.status, 'reused');
  assert.deepEqual(
    findData.matches.map((match) => [match.label, match.id]),
    [['@c3', 4]],
  );
  assert.equal(
    harness.streamCount,
    3,
    'find must project the daemon cache without opening CDP',
  );

  const deep = await core.execute(
    'reactlynx-component',
    { ...TARGET, ref: '@c3' },
    { connector: harness.connector },
  );
  assert.equal(deep.ok, true, deep.error?.message);
  if (!deep.ok) return;
  assert.equal(
    (deep.data as CommandData<'reactlynx-component'>).component.name,
    'Deep',
  );
});

test('ReactLynx link reuses exact DOM/component identities and refreshes only when requested', async () => {
  const harness = createHarness();
  const core = new ActionCore();

  const snapshot = await core.execute('snapshot', TARGET, {
    connector: harness.connector,
  });
  assert.equal(snapshot.ok, true, snapshot.error?.message);
  if (!snapshot.ok) return;
  const snapshotData = snapshot.data as CommandData<'snapshot'>;
  assert.deepEqual(
    snapshotData.refs.map((ref) => [ref.ref, ref.nodeId, ref.backendNodeId]),
    [
      ['@e1', 104, 999],
      ['@e2', 4, 104],
    ],
  );

  const tree = await core.execute(
    'reactlynx-tree',
    { ...TARGET, depth: 2 },
    { connector: harness.connector },
  );
  assert.equal(tree.ok, true, tree.error?.message);
  if (!tree.ok) return;
  const treeData = tree.data as CommandData<'reactlynx-tree'>;
  assert.deepEqual(treeData.labels, [2, 3, 5]);

  const toComponent = await core.execute(
    'reactlynx-link',
    { ...TARGET, ref: '@e2' },
    { connector: harness.connector },
  );
  assert.equal(toComponent.ok, true, toComponent.error?.message);
  if (!toComponent.ok) return;
  const componentData = toComponent.data as CommandData<'reactlynx-link'>;
  assert.equal(componentData.direction, 'element-to-component');
  assert.equal(componentData.element.backendNodeId, 104);
  assert.equal(componentData.component.id, 4);
  assert.equal(componentData.component.name, 'Deep');
  assert.equal(
    componentData.component.ref,
    null,
    'a depth-limited emitted label view must remain exact',
  );
  assert.equal(componentData.cache.status, 'reused');
  if (
    componentData.cache.status === 'reused' &&
    treeData.cache.status === 'refreshed'
  ) {
    assert.equal(componentData.cache.generation, treeData.cache.generation);
  }
  assert.deepEqual(
    harness.outbound.find((envelope) => envelope.type === 'element-picked')
      ?.data,
    { uniqueId: 104 },
  );
  assert.equal(
    harness.refreshCount,
    1,
    'a cache hit must not refresh the component generation',
  );

  const find = await core.execute(
    'reactlynx-find',
    { ...TARGET, pattern: 'Deep' },
    { connector: harness.connector },
  );
  assert.equal(find.ok, true, find.error?.message);
  if (!find.ok) return;
  assert.deepEqual(
    (find.data as CommandData<'reactlynx-find'>).matches.map(
      (match) => match.label,
    ),
    ['@c3'],
  );

  const toElement = await core.execute(
    'reactlynx-link',
    { ...TARGET, ref: '@c3' },
    { connector: harness.connector },
  );
  assert.equal(toElement.ok, true, toElement.error?.message);
  if (!toElement.ok) return;
  const elementData = toElement.data as CommandData<'reactlynx-link'>;
  assert.equal(elementData.direction, 'component-to-element');
  assert.equal(elementData.component.id, 4);
  assert.equal(elementData.component.ref, '@c3');
  assert.equal(
    elementData.element.ref,
    '@e2',
    'backend identity must win over a colliding frontend node id',
  );
  assert.equal(elementData.cache.status, 'reused');
  assert.ok(
    harness.outbound.some(
      (envelope) => envelope.type === 'highlight' && envelope.data === 4,
    ),
  );

  const refreshed = await core.execute(
    'reactlynx-link',
    { ...TARGET, ref: '@e2', refresh: true },
    { connector: harness.connector },
  );
  assert.equal(refreshed.ok, true, refreshed.error?.message);
  if (!refreshed.ok) return;
  const refreshedData = refreshed.data as CommandData<'reactlynx-link'>;
  assert.equal(refreshedData.cache.status, 'refreshed');
  if (
    refreshedData.cache.status === 'refreshed' &&
    treeData.cache.status === 'refreshed'
  ) {
    assert.equal(refreshedData.cache.generation, treeData.cache.generation + 1);
  }
  assert.equal(refreshedData.component.ref, '@c3');
  assert.equal(harness.refreshCount, 2);
});

test('ReactLynx component-to-element link requires an explicit DOM snapshot', async () => {
  const harness = createHarness();
  const core = new ActionCore();
  const tree = await core.execute('reactlynx-tree', TARGET, {
    connector: harness.connector,
  });
  assert.equal(tree.ok, true, tree.error?.message);

  const result = await core.execute(
    'reactlynx-link',
    { ...TARGET, ref: '@c3' },
    { connector: harness.connector },
  );

  assert.equal(result.ok, false);
  assert.equal(result.error?.reason, 'no-snapshot');
  assert.equal(
    harness.outbound.some((envelope) => envelope.type === 'highlight'),
    false,
  );
});

test('ReactLynx protocol ignores a valid optional commit-stats payload', () => {
  const state = createRendererState();
  const stats = Array.from({ length: 74 }, (_, index) => index);
  const payload = operation(
    ['App', 'Child'],
    [
      ADD_VNODE,
      1,
      3,
      -1,
      -1,
      1,
      0,
      0,
      0,
      COMMIT_STATS,
      ...stats,
      ADD_VNODE,
      2,
      3,
      1,
      1,
      2,
      0,
      0,
      0,
    ],
  );

  applyOperationV2(state, payload);

  assert.equal(state.tree.get(1)?.name, 'App');
  assert.equal(state.tree.get(2)?.name, 'Child');
  assert.deepEqual(state.tree.get(1)?.children, [2]);
});

test('ReactLynx ActionCore auto-resolves an omitted client and latest session', async () => {
  const harness = createHarness();
  Object.assign(harness.connector, {
    async listClients() {
      return [
        { id: 'headless:0', info: {} },
        { id: TARGET.clientId, info: {} },
      ];
    },
    async sendListSessionMessage(clientId: string) {
      assert.equal(clientId, TARGET.clientId);
      return [
        { session_id: 3, type: 'page', url: 'older' },
        { session_id: TARGET.sessionId, type: 'page', url: 'latest' },
      ];
    },
  });
  const core = new ActionCore();

  const result = await core.execute(
    'reactlynx-tree',
    {},
    { connector: harness.connector },
  );

  assert.equal(result.ok, true, result.error?.message);
  if (!result.ok) return;
  const data = result.data as CommandData<'reactlynx-tree'>;
  assert.equal(data.clientId, TARGET.clientId);
  assert.equal(data.sessionId, TARGET.sessionId);
});

test('ReactLynx refresh replaces one session generation and update reuses it', async () => {
  const harness = createHarness();
  const core = new ActionCore();
  const first = await core.execute('reactlynx-tree', TARGET, {
    connector: harness.connector,
  });
  assert.equal(first.ok, true, first.error?.message);
  if (!first.ok) return;
  const firstData = first.data as CommandData<'reactlynx-tree'>;

  const refreshed = await core.execute(
    'reactlynx-find',
    { ...TARGET, pattern: 'Deep', refresh: true },
    { connector: harness.connector },
  );
  assert.equal(refreshed.ok, true, refreshed.error?.message);
  if (!refreshed.ok) return;
  const refreshedData = refreshed.data as CommandData<'reactlynx-find'>;
  assert.equal(refreshedData.cache.status, 'refreshed');
  if (
    refreshedData.cache.status === 'refreshed' &&
    firstData.cache.status === 'refreshed'
  ) {
    assert.equal(
      refreshedData.cache.generation,
      firstData.cache.generation + 1,
    );
  }

  const update = await core.execute(
    'reactlynx-update-prop',
    { ...TARGET, ref: '@c3', path: 'count', value: 2 },
    { connector: harness.connector },
  );
  assert.equal(update.ok, true, update.error?.message);
  if (!update.ok) return;
  const updateData = update.data as CommandData<'reactlynx-update-prop'>;
  assert.equal(updateData.id, 4);
  assert.equal(updateData.cache.status, 'reused');
  const updateEnvelope = harness.outbound.find(
    (envelope) => envelope.type === 'update-prop',
  );
  assert.deepEqual(updateEnvelope?.data, {
    id: 4,
    path: 'root.count',
    value: 2,
  });
});

test('numeric ReactLynx ids bypass the tree cache', async () => {
  const harness = createHarness();
  const core = new ActionCore();
  const result = await core.execute(
    'reactlynx-component',
    { ...TARGET, ref: '4', refresh: true },
    { connector: harness.connector },
  );

  assert.equal(result.ok, true, result.error?.message);
  if (!result.ok) return;
  const data = result.data as CommandData<'reactlynx-component'>;
  assert.deepEqual(data.cache, { status: 'not-used' });
  assert.equal(data.component.name, 'Deep');
  assert.equal(harness.refreshCount, 0);
  assert.equal(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId),
    undefined,
  );
});

test('ReactLynx parameter failures do not capture or mutate the cache', async () => {
  const harness = createHarness();
  const core = new ActionCore();
  const cases: Array<[string, Record<string, unknown>]> = [
    ['reactlynx-find', { ...TARGET, pattern: '(', regex: true }],
    ['reactlynx-find', { ...TARGET, pattern: 'App', limit: 'many' }],
    ['reactlynx-component', { ...TARGET, ref: '@c0' }],
    [
      'reactlynx-update-prop',
      { ...TARGET, ref: '@c1', path: 'root.count', value: 2 },
    ],
    ['reactlynx-link', { ...TARGET, ref: '@e0' }],
    ['reactlynx-link', { ...TARGET, ref: '@e1', refresh: 'sometimes' }],
  ];

  for (const [action, params] of cases) {
    const result = await core.execute(action, params, {
      connector: harness.connector,
    });
    assert.equal(result.ok, false, action);
    if (!result.ok) assert.equal(result.error.reason, 'bad-params', action);
  }
  assert.equal(harness.streamCount, 0);
  assert.equal(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId),
    undefined,
  );
});

test('an unresponsive cached component evicts only its ReactLynx session', async () => {
  const harness = createHarness({ respondToInspect: false });
  const core = new ActionCore();
  const tree = await core.execute('reactlynx-tree', TARGET, {
    connector: harness.connector,
  });
  assert.equal(tree.ok, true, tree.error?.message);

  const result = await core.execute(
    'reactlynx-component',
    { ...TARGET, ref: '@c1' },
    { connector: harness.connector },
    AbortSignal.timeout(25),
  );
  assert.equal(result.ok, false);
  assert.equal(
    core.getReactLynxCache(TARGET.clientId, TARGET.sessionId),
    undefined,
  );
});

test('ReactLynx operations serialize per session but allow different sessions in parallel', async () => {
  const sameSessionHarness = createHarness({ refreshDelayMs: 20 });
  const sameSessionCore = new ActionCore();
  await Promise.all([
    sameSessionCore.execute('reactlynx-tree', TARGET, {
      connector: sameSessionHarness.connector,
    }),
    sameSessionCore.execute('reactlynx-tree', TARGET, {
      connector: sameSessionHarness.connector,
    }),
  ]);
  assert.equal(sameSessionHarness.maxActiveStreams, 1);

  const differentSessionHarness = createHarness({ refreshDelayMs: 20 });
  const differentSessionCore = new ActionCore();
  await Promise.all([
    differentSessionCore.execute('reactlynx-tree', TARGET, {
      connector: differentSessionHarness.connector,
    }),
    differentSessionCore.execute(
      'reactlynx-tree',
      { ...TARGET, sessionId: TARGET.sessionId + 1 },
      { connector: differentSessionHarness.connector },
    ),
  ]);
  assert.equal(differentSessionHarness.maxActiveStreams, 2);
});

test('an aborted queued ReactLynx action does not open a hole in the session lock', async () => {
  const harness = createHarness({ refreshDelayMs: 40 });
  const core = new ActionCore();
  const first = core.execute('reactlynx-tree', TARGET, {
    connector: harness.connector,
  });
  await delay(5);

  const aborted = await core.execute(
    'reactlynx-tree',
    TARGET,
    { connector: harness.connector },
    AbortSignal.timeout(5),
  );
  assert.equal(aborted.ok, false);

  const third = core.execute('reactlynx-tree', TARGET, {
    connector: harness.connector,
  });
  const [firstResult, thirdResult] = await Promise.all([first, third]);
  assert.equal(firstResult.ok, true, firstResult.error?.message);
  assert.equal(thirdResult.ok, true, thirdResult.error?.message);
  assert.equal(harness.maxActiveStreams, 1);
});
