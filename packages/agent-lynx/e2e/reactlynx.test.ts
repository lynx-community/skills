// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TestContext } from 'node:test';
import {
  ActionCore,
  type CommandData,
  deserializeRendererState,
  formatReactLynxTree,
} from '@lynx-js/devtool-connector/command';
import {
  getTestingSession,
  testWithClient,
} from '@lynx-js/devtool-connector/test-with-client';

testWithClient(
  'reactlynx daemon actions',
  async (t, connector, client, target) => {
    const session = await getTestingSession(connector, client.id);
    const actionCore = new ActionCore();
    const commandTarget = {
      clientId: client.id,
      sessionId: session.session_id,
    };
    let treeData: CommandData<'reactlynx-tree'> | undefined;

    await t.test(
      'tree refresh decodes and caches a labelled component tree',
      async (t: TestContext) => {
        const result = await actionCore.execute(
          'reactlynx-tree',
          commandTarget,
          { connector },
          t.signal,
        );
        t.assert.equal(result.ok, true, result.error?.message);
        if (!result.ok) return;
        const data = result.data as CommandData<'reactlynx-tree'>;
        t.assert.equal(data.cache.status, 'refreshed');
        t.assert.ok(
          data.nodes.length > 0,
          'decoded component tree must not be empty',
        );
        t.assert.ok(
          data.roots.length > 0,
          'decoded component tree must expose a root',
        );
        t.assert.ok(
          data.labels.length > 0,
          'tree must expose at least one @cN label',
        );

        const formatted = formatReactLynxTree(
          deserializeRendererState({ roots: data.roots, nodes: data.nodes }),
          { hideShells: true },
        );
        t.assert.ok(formatted.text.startsWith('@c1 ['));
        t.assert.deepEqual(formatted.labels, data.labels);
        t.assert.equal(
          formatted.labels.length,
          formatted.text.split('\n').length,
        );
        t.assert.deepEqual(
          actionCore.getReactLynxCache(client.id, session.session_id)
            ?.compactLabels,
          data.labels,
        );
        t.diagnostic(
          'page=' +
            target.pageUrl +
            ' generation=' +
            (data.cache.status === 'refreshed'
              ? data.cache.generation
              : 'n/a') +
            ' nodes=' +
            data.nodes.length +
            ' first=' +
            formatted.text.split('\n')[0],
        );
        treeData = data;
      },
    );

    await t.test(
      'find reuses the cached generation without refreshing',
      async (t: TestContext) => {
        if (!treeData) {
          t.skip('tree action did not complete');
          return;
        }
        // Derive the pattern from the tree we just captured instead of
        // hard-coding a component name: production bundles are usually
        // minified (`eT`, `ov`, ...), so any literal pattern only holds for
        // one specific bundle. `find` searches the very same compact label
        // set `tree` reported (both format the cached state with shells
        // hidden and label it `@cN` in render order), so the first labelled
        // component's own name is a pattern that must match on any bundle.
        const nodesById = new Map(
          treeData.nodes.map((node) => [node.id, node]),
        );
        let named: { pattern: string; label: string } | undefined;
        for (const [index, id] of treeData.labels.entries()) {
          const name = nodesById.get(id)?.name;
          if (name) {
            named = { pattern: name, label: `@c${index + 1}` };
            break;
          }
        }
        t.assert.ok(
          named,
          'tree must expose at least one labelled component with a name',
        );
        if (!named) return;
        const { pattern, label: firstLabel } = named;

        const result = await actionCore.execute(
          'reactlynx-find',
          { ...commandTarget, pattern },
          { connector },
          t.signal,
        );
        t.assert.equal(result.ok, true, result.error?.message);
        if (!result.ok) return;
        const data = result.data as CommandData<'reactlynx-find'>;
        t.assert.equal(data.cache.status, 'reused');
        if (
          data.cache.status === 'reused' &&
          treeData.cache.status === 'refreshed'
        ) {
          t.assert.equal(data.cache.generation, treeData.cache.generation);
        }
        t.assert.ok(
          data.matches.length > 0,
          `expected a component containing ${JSON.stringify(pattern)}`,
        );
        // Every earlier label is unnamed, so the component the pattern came
        // from is necessarily the first match: this pins `find` to the same
        // `@cN` numbering `tree` handed out for this generation.
        t.assert.equal(
          data.matches[0]?.label,
          firstLabel,
          'find must reuse the @cN numbering from the cached tree generation',
        );
        for (const match of data.matches) {
          t.assert.match(match.label, /^@c\d+$/u);
          t.assert.ok(match.name.toLowerCase().includes(pattern.toLowerCase()));
        }
        t.diagnostic(
          'find pattern=' +
            pattern +
            ' matches: ' +
            data.matches
              .map((match) => match.label + ' ' + match.name)
              .join(', '),
        );
      },
    );

    await t.test(
      'DOM and component refs round-trip through runtime identities',
      async (t: TestContext) => {
        if (target.appPackageName === 'EmbeddedLynx') {
          t.skip(
            'Clay-based EmbeddedLynx does not expose the App-side host identity mapping yet',
          );
          return;
        }
        if (!treeData) {
          t.skip('tree action did not complete');
          return;
        }
        const snapshot = await actionCore.execute(
          'snapshot',
          commandTarget,
          { connector },
          t.signal,
        );
        t.assert.equal(snapshot.ok, true, snapshot.error?.message);
        if (!snapshot.ok) return;
        const snapshotData = snapshot.data as CommandData<'snapshot'>;
        t.assert.ok(
          snapshotData.refs.length > 0,
          'snapshot must expose at least one @eN ref',
        );

        const visibleRefs = snapshotData.refs.filter(
          (ref) => ref.flags.visible && !ref.flags.offscreen,
        );
        const parentRefs = new Set(
          visibleRefs.flatMap((ref) => (ref.parentRef ? [ref.parentRef] : [])),
        );
        const candidates = [
          ...visibleRefs.filter((ref) => parentRefs.has(ref.ref)).reverse(),
          ...visibleRefs.slice().reverse(),
        ]
          .filter(
            (ref, index, refs) =>
              refs.findIndex((candidate) => candidate.ref === ref.ref) ===
              index,
          )
          .slice(0, 8);
        t.assert.ok(
          candidates.length > 0,
          'snapshot must expose at least one visible DOM ref',
        );

        let sourceElement: (typeof candidates)[number] | undefined;
        let componentData: CommandData<'reactlynx-link'> | undefined;
        const mappingFailures: string[] = [];
        for (const candidate of candidates) {
          const result = await actionCore.execute(
            'reactlynx-link',
            { ...commandTarget, ref: candidate.ref, showShells: true },
            { connector },
            AbortSignal.any([t.signal, AbortSignal.timeout(1_500)]),
          );
          if (!result.ok) {
            mappingFailures.push(`${candidate.ref}:${result.error.reason}`);
            continue;
          }
          sourceElement = candidate;
          componentData = result.data as CommandData<'reactlynx-link'>;
          break;
        }
        t.assert.ok(
          sourceElement && componentData,
          `none of ${candidates.length} visible DOM candidates mapped to ReactLynx (${mappingFailures.join(', ')})`,
        );
        if (!sourceElement || !componentData) return;

        t.assert.equal(componentData.direction, 'element-to-component');
        t.assert.equal(componentData.relation, 'nearest-component');
        t.assert.equal(componentData.element.ref, sourceElement.ref);
        t.assert.match(componentData.component.ref ?? '', /^@c\d+$/u);
        t.assert.ok(componentData.component.name.length > 0);
        t.assert.equal(componentData.cache.status, 'reused');

        const toElement = await actionCore.execute(
          'reactlynx-link',
          {
            ...commandTarget,
            ref: componentData.component.ref!,
            showShells: true,
          },
          { connector },
          t.signal,
        );
        t.assert.equal(toElement.ok, true, toElement.error?.message);
        if (!toElement.ok) return;
        const elementData = toElement.data as CommandData<'reactlynx-link'>;
        t.assert.equal(elementData.direction, 'component-to-element');
        t.assert.equal(elementData.relation, 'first-host-element');
        t.assert.equal(elementData.component.id, componentData.component.id);
        t.assert.match(elementData.element.ref, /^@e\d+$/u);
        t.assert.ok(
          snapshotData.refs.some((ref) => ref.ref === elementData.element.ref),
        );
        t.assert.equal(elementData.cache.status, 'reused');
        t.diagnostic(
          `${sourceElement.ref} -> ${componentData.component.ref} -> ${elementData.element.ref}`,
        );
      },
    );

    await t.test(
      'component resolves a cached @cN ref and returns InspectData',
      async (t: TestContext) => {
        const result = await actionCore.execute(
          'reactlynx-component',
          { ...commandTarget, ref: '@c1' },
          { connector },
          t.signal,
        );
        t.assert.equal(result.ok, true, result.error?.message);
        if (!result.ok) return;
        const data = result.data as CommandData<'reactlynx-component'>;
        t.assert.equal(data.cache.status, 'reused');
        t.assert.equal(typeof data.component.name, 'string');
        t.assert.ok(data.component.name.length > 0);
        t.assert.equal(data.component.id, data.id);
        t.diagnostic(
          'inspect-result: id=' + data.id + ' name=' + data.component.name,
        );
      },
    );

    await t.test(
      'update-prop resolves the same cache and confirms the mutation',
      async (t: TestContext) => {
        const key = '__agentLynxReactLynxDaemonTest';
        const value = 'marker-' + Date.now();
        const result = await actionCore.execute(
          'reactlynx-update-prop',
          { ...commandTarget, ref: '@c1', path: key, value },
          { connector },
          t.signal,
        );
        t.assert.equal(result.ok, true, result.error?.message);
        if (!result.ok) return;
        const data = result.data as CommandData<'reactlynx-update-prop'>;
        t.assert.equal(data.cache.status, 'reused');
        t.assert.ok(
          typeof data.component.props === 'object' &&
            data.component.props !== null,
          'post-update inspect-result.props must be an object',
        );
        if (
          typeof data.component.props !== 'object' ||
          data.component.props === null
        )
          return;
        t.assert.equal(
          (data.component.props as Record<string, unknown>)[key],
          value,
        );
        t.diagnostic(
          'update-prop confirmed: id=' +
            data.id +
            ' props.' +
            key +
            '=' +
            value,
        );
      },
    );
  },
);
