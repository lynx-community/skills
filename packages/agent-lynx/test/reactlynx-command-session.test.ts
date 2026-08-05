// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import {
  type CommandClient,
  type CommandObject,
  DevNodeType,
  ok,
} from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import { registerReactLynxCommand } from '../src/commands/reactlynx/index.ts';
import type { Context } from '../src/commands/utils.ts';

interface CommandCall {
  action: string;
  params: CommandObject;
}

test('component maps labels and numeric ids to the daemon action', async (t) => {
  const fixture = createFixture(t);

  await fixture.parse(['reactlynx', 'component', '@c2', '--json', '--refresh']);
  await fixture.parse(['reactlynx', 'component', '84', '--json']);

  assert.deepEqual(fixture.calls, [
    {
      action: 'reactlynx-component',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        ref: '@c2',
        showShells: false,
        refresh: true,
      },
    },
    {
      action: 'reactlynx-component',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        ref: '84',
        showShells: false,
        refresh: false,
      },
    },
  ]);
});

test('tree and find map projection and cache options to daemon actions', async (t) => {
  const fixture = createFixture(t);

  await fixture.parse([
    'reactlynx',
    'tree',
    '--depth',
    '2',
    '--show-shells',
    '--json',
  ]);
  await fixture.parse([
    'reactlynx',
    'find',
    'Fresh',
    '--regex',
    '--show-shells',
    '--limit',
    '3',
    '--refresh',
    '--json',
  ]);

  assert.deepEqual(fixture.calls, [
    {
      action: 'reactlynx-tree',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        depth: 2,
        showShells: true,
      },
    },
    {
      action: 'reactlynx-find',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        pattern: 'Fresh',
        regex: true,
        showShells: true,
        limit: 3,
        refresh: true,
      },
    },
  ]);
});

test('link maps both ref domains to one daemon action', async (t) => {
  const fixture = createFixture(t);

  await fixture.parse([
    'reactlynx',
    'link',
    '@e3',
    '--show-shells',
    '--refresh',
    '--json',
  ]);
  await fixture.parse(['reactlynx', 'link', '@c2', '--json']);

  assert.deepEqual(fixture.calls, [
    {
      action: 'reactlynx-link',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        ref: '@e3',
        showShells: true,
        refresh: true,
      },
    },
    {
      action: 'reactlynx-link',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        ref: '@c2',
        showShells: false,
        refresh: false,
      },
    },
  ]);
});

test('update-prop keeps CLI parsing at the edge and sends one daemon action', async (t) => {
  const fixture = createFixture(t);

  await fixture.parse([
    'reactlynx',
    'update-prop',
    '@c2',
    'count',
    '2',
    '--json',
  ]);

  assert.deepEqual(fixture.calls, [
    {
      action: 'reactlynx-update-prop',
      params: {
        clientId: 'device:8901',
        sessionId: 1,
        ref: '@c2',
        path: 'count',
        value: 2,
        showShells: false,
        refresh: false,
      },
    },
  ]);
});

test('all ReactLynx update flavors use their matching daemon route', async (t) => {
  const fixture = createFixture(t);

  await fixture.parse([
    'reactlynx',
    'update-state',
    '84',
    'count',
    '2',
    '--json',
  ]);
  await fixture.parse([
    'reactlynx',
    'update-context',
    '84',
    'theme',
    '"dark"',
    '--json',
  ]);

  assert.deepEqual(
    fixture.calls.map((call) => [call.action, call.params['value']]),
    [
      ['reactlynx-update-state', 2],
      ['reactlynx-update-context', 'dark'],
    ],
  );
});

test('--no-daemon rejects a ReactLynx link before making an HTTP request', async (t) => {
  const previousExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = previousExitCode;
  });
  const fixture = createFixture(t);

  await fixture.parse(['--no-daemon', 'reactlynx', 'link', '@e1']);

  assert.equal(fixture.calls.length, 0);
  assert.equal(process.exitCode, 1);
});

function createFixture(t: TestContext): {
  calls: CommandCall[];
  parse(args: string[]): Promise<void>;
} {
  const calls: CommandCall[] = [];
  const commandClient = {
    async execute(action: string, params: CommandObject) {
      calls.push({ action, params });
      if (action === 'reactlynx-tree') {
        return ok(action, {
          clientId: 'device:8901',
          sessionId: 1,
          cache: { status: 'refreshed', generation: 1, capturedAt: 1 },
          labels: [84],
          roots: [84],
          nodes: [
            {
              id: 84,
              name: 'FreshComponent',
              type: DevNodeType.Memo,
              key: '',
              parent: -1,
              owner: -1,
              children: [],
              startTime: 0,
              endTime: 0,
            },
          ],
        });
      }
      if (action === 'reactlynx-find') {
        return ok(action, {
          clientId: 'device:8901',
          sessionId: 1,
          cache: { status: 'reused', generation: 1, capturedAt: 1 },
          componentCount: 1,
          matches: [
            {
              label: '@c1',
              id: 84,
              name: 'FreshComponent',
              type: DevNodeType.Memo,
              key: '',
              ancestors: [],
            },
          ],
        });
      }
      if (action === 'reactlynx-link') {
        const elementToComponent = String(params['ref']).startsWith('@e');
        return ok(action, {
          clientId: 'device:8901',
          sessionId: 1,
          cache: { status: 'reused', generation: 1, capturedAt: 1 },
          direction: elementToComponent
            ? 'element-to-component'
            : 'component-to-element',
          relation: elementToComponent
            ? 'nearest-component'
            : 'first-host-element',
          element: {
            ref: '@e3',
            tag: 'view',
            text: 'Button',
            nodeId: 4,
            backendNodeId: 4,
            center: { x: 60, y: 320 },
            box: { x: 10, y: 300, width: 100, height: 40 },
            flags: {
              interactive: true,
              visible: true,
              offscreen: false,
              scrollable: false,
              disabled: false,
              editable: false,
            },
            attributes: { bindtap: 'tap' },
          },
          component: {
            ref: '@c2',
            id: 84,
            name: 'FreshComponent',
            type: DevNodeType.Memo,
            key: '',
          },
        });
      }
      return ok(action, {
        clientId: 'device:8901',
        sessionId: 1,
        cache: { status: 'reused', generation: 1, capturedAt: 1 },
        ref: typeof params['ref'] === 'string' ? params['ref'] : '@c1',
        id: 84,
        component: {
          id: 84,
          name: 'FreshComponent',
          type: DevNodeType.Memo,
          key: null,
          props: { count: 2 },
          state: null,
          hooks: null,
          context: null,
          signals: null,
        },
      });
    },
  } as unknown as CommandClient;
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});

  const program = new Command();
  program.option('--no-daemon');
  registerReactLynxCommand(program, {
    commandClient,
    transports: [],
  } satisfies Context);
  return {
    calls,
    parse: async (args) => {
      await program.parseAsync([
        'node',
        'test',
        ...args,
        '--client',
        'device:8901',
        '--session',
        '1',
      ]);
    },
  };
}
