// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Integration test for `lynx-devtool reactlynx tree`.
 *
 * Drives the full wire protocol against a real ReactLynx page running on a
 * connected client, using the standard `testWithClient` harness so the test
 * runs across every supported transport.
 *
 * The page bundle pinned via `LYNX_DEVTOOL_MCP_TESTING_PAGE_URL` is built from
 * a ReactLynx app that ships an upgraded `@lynx-js/preact-devtools` containing
 * the `document.body` and `preactDevtoolsCtx.Node` fixes -- the App therefore
 * honors `refresh` and the test can assert the full
 * init -> refresh -> operation_v2 -> root-order pipeline.
 *
 * Default page URL:
 *   https://unpkg.com/@lynx-example/react-devtool@0.2.0/dist/main.lynx.bundle
 *
 * Override per-environment with `LYNX_DEVTOOL_MCP_TESTING_PAGE_URL`.
 */

import type { TestContext } from 'node:test';
import {
  getTestingSession,
  testWithClient,
} from '@lynx-js/devtool-connector/test-with-client';
import {
  buildSubstringMatcher,
  findComponents,
} from '../src/commands/reactlynx/find.ts';
import { formatTree } from '../src/commands/reactlynx/format.ts';
import type { RendererState } from '../src/commands/reactlynx/protocol.ts';
import {
  buildOutboundFrame,
  type PreactEnvelope,
  runReactLynxSession,
} from '../src/commands/reactlynx/transport.ts';

const run = testWithClient;

run('reactlynx tree', async (t, connector, client, target) => {
  let capturedTree: RendererState | undefined;

  const session = await getTestingSession(connector, client.id);

  await t.test(
    'init + refresh produces a non-empty tree',
    async (t: TestContext) => {
      const collected = await runReactLynxSession({
        connector,
        clientId: client.id,
        sessionId: session.session_id,
        outbound: [buildOutboundFrame('refresh')],
        idleMs: 1_000,
        maxMs: 15_000,
        signal: t.signal,
      });

      t.assert.ok(
        collected.framesSeen > 0,
        `Expected at least one PreactDevtools frame from page ${target.pageUrl}; saw 0. ` +
          `Verify the page bundle contains a recent @lynx-js/preact-devtools dev build.`,
      );
      t.assert.ok(
        collected.operationFrames > 0,
        `Expected at least one operation_v2 frame after refresh; saw types=${[...collected.envelopeTypes].join(',')}. ` +
          `If only root-order/root-order-page arrived, the App is running an outdated ` +
          `@lynx-js/preact-devtools without the PR #2 / PR #5 fixes.`,
      );
      t.assert.ok(
        collected.rootOrderFrames > 0,
        `Expected at least one root-order frame after refresh; saw types=${[...collected.envelopeTypes].join(',')}`,
      );

      t.assert.ok(
        collected.state.tree.size > 0,
        'Decoded tree must not be empty after a successful operation_v2 mount',
      );
      t.assert.ok(
        collected.state.roots.length > 0,
        'Decoded tree must report at least one root',
      );

      const formatted = formatTree(collected.state, { hideShells: true });
      t.assert.ok(
        formatted.text.length > 0,
        'Formatted tree must be non-empty',
      );
      t.assert.ok(
        formatted.text.startsWith('@c1 ['),
        `Formatted tree must start with @c1; got: ${formatted.text.split('\n')[0]}`,
      );
      t.assert.ok(
        formatted.labels.length > 0,
        'Formatted tree must expose at least one @cN label',
      );
      t.assert.equal(
        formatted.labels.length,
        formatted.text.split('\n').length,
        'Every visible printed line must correspond to one @cN label',
      );

      t.diagnostic(
        `frames=${collected.framesSeen} operation_v2=${collected.operationFrames} ` +
          `root-order=${collected.rootOrderFrames} types=${[
            ...collected.envelopeTypes,
          ]
            .sort()
            .join(',')} treeSize=${collected.state.tree.size}`,
      );
      t.diagnostic(`first line: ${formatted.text.split('\n')[0]}`);

      capturedTree = collected.state;
    },
  );

  await t.test(
    'findComponents finds at least one match in the live tree',
    async (t: TestContext) => {
      if (!capturedTree) {
        t.skip('tree snapshot not captured (preceding subtest failed)');
        return;
      }
      const matches = findComponents(
        capturedTree,
        buildSubstringMatcher('Provider'),
        {
          hideShells: true,
          limit: 50,
        },
      );
      t.assert.ok(
        matches.length > 0,
        "Expected at least one component containing 'Provider' in the bundle",
      );
      for (const match of matches) {
        t.assert.match(
          match.label,
          /^@c\d+$/,
          `match.label must be @cN form, got ${match.label}`,
        );
        t.assert.ok(match.name.toLowerCase().includes('provider'));
      }
      t.diagnostic(
        `find matches: ${matches.map((m) => `${m.label} ${m.name}`).join(', ')}`,
      );
    },
  );

  await t.test(
    'inspect round-trip returns InspectData for first labelled component',
    async (t: TestContext) => {
      if (!capturedTree) {
        t.skip('tree snapshot not captured (preceding subtest failed)');
        return;
      }
      const labels = formatTree(capturedTree, { hideShells: true }).labels;
      const targetId = labels[0];
      t.assert.ok(
        targetId !== undefined,
        'tree must expose at least one labelled root',
      );
      if (targetId === undefined) return;

      let inspectData: { id: number; name: string; props: unknown } | undefined;
      await runReactLynxSession({
        connector,
        clientId: client.id,
        sessionId: session.session_id,
        outbound: [buildOutboundFrame('inspect', targetId)],
        idleMs: 1_000,
        maxMs: 5_000,
        signal: t.signal,
        onEnvelope: (envelope: PreactEnvelope) => {
          if (envelope.type !== 'inspect-result') return 'continue';
          inspectData = envelope.data as typeof inspectData;
          return 'stop';
        },
      });

      t.assert.ok(
        inspectData !== undefined,
        `Expected an inspect-result frame for id ${targetId} within 5s`,
      );
      if (!inspectData) return;
      t.assert.equal(
        inspectData.id,
        targetId,
        'inspect-result.id must match the requested id',
      );
      t.assert.equal(typeof inspectData.name, 'string');
      t.assert.ok(
        inspectData.name.length > 0,
        'inspect-result.name must be non-empty',
      );
      t.diagnostic(
        `inspect-result: id=${inspectData.id} name=${inspectData.name}`,
      );
    },
  );

  await t.test(
    'update-prop round-trip applies the new value and confirms via inspect-result',
    async (t: TestContext) => {
      if (!capturedTree) {
        t.skip('tree snapshot not captured (preceding subtest failed)');
        return;
      }
      const labels = formatTree(capturedTree, { hideShells: true }).labels;
      const targetId = labels[0];
      t.assert.ok(
        targetId !== undefined,
        'tree must expose at least one labelled root',
      );
      if (targetId === undefined) return;

      const TEST_KEY = '__lynxDevtoolUpdatePropTest';
      const TEST_VALUE = `marker-${Date.now()}`;

      let confirmed: { id: number; props: Record<string, unknown> } | undefined;
      await runReactLynxSession({
        connector,
        clientId: client.id,
        sessionId: session.session_id,
        outbound: [
          buildOutboundFrame('update-prop', {
            id: targetId,
            path: `root.${TEST_KEY}`,
            value: TEST_VALUE,
          }),
        ],
        idleMs: 1_000,
        maxMs: 5_000,
        signal: t.signal,
        onEnvelope: (envelope: PreactEnvelope) => {
          if (envelope.type !== 'inspect-result') return 'continue';
          const candidate = envelope.data as {
            id?: number;
            props?: Record<string, unknown>;
          };
          if (candidate.id !== targetId) return 'continue';
          confirmed = candidate as typeof confirmed;
          return 'stop';
        },
      });

      t.assert.ok(
        confirmed !== undefined,
        `Expected an inspect-result for id ${targetId} after update-prop within 5s`,
      );
      if (!confirmed) return;
      t.assert.ok(
        confirmed.props && typeof confirmed.props === 'object',
        'post-update inspect-result.props must be an object',
      );
      t.assert.equal(
        confirmed.props[TEST_KEY],
        TEST_VALUE,
        `post-update inspect-result.props.${TEST_KEY} must equal the value we sent (${TEST_VALUE})`,
      );
      t.diagnostic(
        `update-prop confirmed: id=${confirmed.id} props.${TEST_KEY}=${JSON.stringify(confirmed.props[TEST_KEY])}`,
      );
    },
  );
});
