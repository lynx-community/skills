// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector, type Session } from '@lynx-js/devtool-connector';
import {
  type CommandClient,
  type CommandResult,
  HttpCommandClient,
  type ListSessionsData,
  ok,
} from '@lynx-js/devtool-connector/command';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runListSessionsCommand } from '../src/commands/list-sessions.ts';
import { createProgram } from '../src/devtool.ts';
import { MonitorCode } from '../src/telemetry.ts';

type MonitorEvent = {
  code: number;
  data: Record<string, unknown>;
};

function createSession(
  sessionId = 7,
  type: Session['type'] = 'lynx',
  url = 'https://example.test/main.lynx.bundle',
): Session {
  return { session_id: sessionId, type, url };
}

function createCommandClient(
  result: CommandResult<ListSessionsData>,
  calls: Array<{ action: string; params: unknown; }> = [],
): CommandClient {
  return {
    async execute(action, params) {
      calls.push({ action, params });
      return result as never;
    },
    async *stream() {
      yield await Promise.reject<never>(
        new Error('list-sessions must not use SSE'),
      );
    },
  } as CommandClient;
}

test('list-sessions preserves stdout and optional success telemetry', async (t) => {
  const sessions = [
    createSession(7, 'lynx'),
    createSession(8, 'web', 'https://example.test/'),
  ];
  const monitorEvents: MonitorEvent[] = [];
  const lines: string[] = [];
  const calls: Array<{ action: string; params: unknown; }> = [];

  await runListSessionsCommand(
    createCommandClient(
      ok('list-sessions', { clientId: 'device:8901', sessions }),
      calls,
    ),
    'device:8901',
    {
      logMonitor(code, data) {
        monitorEvents.push({ code, data: { ...data } });
      },
      print(line) {
        lines.push(line);
      },
    },
  );

  t.assert.deepEqual(calls, [{
    action: 'list-sessions',
    params: { clientId: 'device:8901' },
  }]);
  t.assert.deepEqual(lines.map(line => JSON.parse(line) as unknown), [
    sessions,
  ]);
  t.assert.deepEqual(monitorEvents.map(({ code }) => code), [
    MonitorCode.COMMAND_LIST_SESSIONS,
    MonitorCode.COMMAND_LIST_SESSIONS_SUCCESS,
  ]);
  t.assert.equal(monitorEvents[1]?.data['m1'], 2);
  t.assert.deepEqual(JSON.parse(String(monitorEvents[1]?.data['d1'])), [{
    type: 'lynx',
  }, { type: 'web' }]);
});

test('list-sessions preserves an empty session snapshot as successful array output', async (t) => {
  const lines: string[] = [];

  await runListSessionsCommand(
    createCommandClient(
      ok('list-sessions', { clientId: 'device:8901', sessions: [] }),
    ),
    undefined,
    {
      logMonitor() {},
      print(line) {
        lines.push(line);
      },
    },
  );

  t.assert.deepEqual(lines.map(line => JSON.parse(line) as unknown), [[]]);
});

test('list-sessions preserves the ActionCore-resolved session without runtime notices', async (t) => {
  const session = createSession();
  const lines: string[] = [];

  await runListSessionsCommand(
    createCommandClient(
      ok('list-sessions', { clientId: 'desktop:1', sessions: [session] }),
    ),
    undefined,
    {
      logMonitor() {},
      print(line) {
        lines.push(line);
      },
    },
  );

  t.assert.deepEqual(JSON.parse(lines[0] ?? '[]'), [session]);
});

test('default list-sessions uses daemon HTTP and never invokes Connector directly', async (t) => {
  const session = createSession();
  const lines: string[] = [];
  let connectorCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(
    HttpCommandClient.prototype,
    'execute',
    async (action: string, params: unknown) => {
      assert.deepEqual({ action, params }, {
        action: 'list-sessions',
        params: {},
      });
      return ok('list-sessions', {
        clientId: 'device:8901',
        sessions: [session],
      }) as never;
    },
  );
  t.mock.method(Connector.prototype, 'listClients', async () => {
    connectorCalls += 1;
    return [];
  });
  t.mock.method(Connector.prototype, 'sendListSessionMessage', async () => {
    connectorCalls += 1;
    return [];
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    'list-sessions',
  ]);

  assert.equal(connectorCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [session]);
});

test('--no-daemon list-sessions invokes ActionCore in-process and never uses HTTP', async (t) => {
  const session = createSession();
  const lines: string[] = [];
  let clientCalls = 0;
  let sessionCalls = 0;
  let httpCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(HttpCommandClient.prototype, 'execute', async () => {
    httpCalls += 1;
    return ok('list-sessions', {
      clientId: 'device:8901',
      sessions: [session],
    }) as never;
  });
  t.mock.method(Connector.prototype, 'listClients', async () => {
    clientCalls += 1;
    return [{ id: 'device:8901', info: { App: 'Example' } }] as never;
  });
  t.mock.method(
    Connector.prototype,
    'sendListSessionMessage',
    async (clientId: string) => {
      sessionCalls += 1;
      assert.equal(clientId, 'device:8901');
      return [session];
    },
  );

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    '--no-daemon',
    'list-sessions',
  ]);

  assert.equal(clientCalls, 1);
  assert.equal(sessionCalls, 1);
  assert.equal(httpCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '[]'), [session]);
});
