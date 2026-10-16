// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  Connector,
  type ListSessionResponse,
  type Session,
} from '@lynx-js/devtool-connector';
import {
  type CommandClient,
  type CommandResult,
  fail,
  HttpCommandClient,
  ok,
  type OpenData,
} from '@lynx-js/devtool-connector/command';
import assert from 'node:assert/strict';
import test from 'node:test';
import { runOpenCommand } from '../src/commands/open.ts';
import { createProgram } from '../src/devtool.ts';
import { MonitorCode } from '../src/telemetry.ts';

interface MonitorEvent {
  code: number;
  data: Record<string, unknown>;
}

function createSession(
  sessionId = 7,
  url = 'lynx://example/page',
): Session {
  return {
    session_id: sessionId,
    type: 'lynx',
    url,
  };
}

function createResponse(
  sessions: Session[] = [createSession()],
): ListSessionResponse {
  return {
    event: 'Customized',
    data: {
      type: 'SessionList',
      data: sessions,
    },
  };
}

function createCommandClient(
  result: CommandResult<OpenData>,
  calls: Array<{ action: string; params: unknown; options: unknown; }> = [],
): CommandClient {
  const client = {
    async execute(
      ...[action, params, options]: Parameters<CommandClient['execute']>
    ) {
      calls.push({ action, params, options });
      return result as never;
    },
    async *stream() {
      yield await Promise.reject<never>(new Error('open must not use SSE'));
    },
  } satisfies CommandClient;

  return client;
}

test('open preserves raw SessionList output and optional telemetry', async () => {
  const url = 'lynx://example/page';
  const response = createResponse();
  const calls: Array<{ action: string; params: unknown; options: unknown; }> =
    [];
  const monitorEvents: MonitorEvent[] = [];
  const lines: string[] = [];

  await runOpenCommand(
    createCommandClient(
      ok('open', { clientId: 'device:8901', response }),
      calls,
    ),
    url,
    undefined,
    {
      logMonitor(code, data) {
        monitorEvents.push({ code, data: { ...data } });
      },
      print(line) {
        lines.push(line);
      },
    },
  );

  assert.deepEqual(calls, [{
    action: 'open',
    params: { url },
    options: undefined,
  }]);
  assert.deepEqual(lines.map(line => JSON.parse(line) as unknown), [response]);
  assert.deepEqual(monitorEvents, [
    { code: MonitorCode.COMMAND_OPEN, data: {} },
    { code: MonitorCode.COMMAND_OPEN_SUCCESS, data: { d1: url } },
  ]);
});

test('open preserves ActionCore failures without success telemetry or stdout', async () => {
  const monitorEvents: MonitorEvent[] = [];

  await assert.rejects(
    () =>
      runOpenCommand(
        createCommandClient(
          fail('open', 'Unable to open page', { reason: 'open-failed' }),
        ),
        'lynx://example/page',
        undefined,
        {
          logMonitor(code, data) {
            monitorEvents.push({ code, data: { ...data } });
          },
          print() {
            assert.fail('a failed open command must not print a response');
          },
        },
      ),
    { message: 'Unable to open page' },
  );

  assert.deepEqual(monitorEvents, [{
    code: MonitorCode.COMMAND_OPEN,
    data: {},
  }]);
});

test('open preserves explicit targets and raw output without selecting a transport timeout in the CLI', async () => {
  const response = createResponse([
    createSession(9, 'lynx://desktop/page'),
  ]);
  const calls: Array<{ action: string; params: unknown; options: unknown; }> =
    [];
  const lines: string[] = [];

  await runOpenCommand(
    createCommandClient(
      ok('open', { clientId: 'desktop:1', response }),
      calls,
    ),
    'lynx://desktop/page',
    'desktop:1',
    {
      logMonitor() {},
      print(line) {
        lines.push(line);
      },
    },
  );

  assert.deepEqual(calls, [{
    action: 'open',
    params: { url: 'lynx://desktop/page', clientId: 'desktop:1' },
    options: undefined,
  }]);
  assert.deepEqual(JSON.parse(lines[0] ?? '{}'), response);
});

test('default open uses daemon HTTP and never invokes Connector directly', async (t) => {
  const url = 'lynx://example/page';
  const response = createResponse();
  const lines: string[] = [];
  let connectorCalls = 0;
  let httpCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(
    HttpCommandClient.prototype,
    'execute',
    async function(
      ...[action, params, options]: Parameters<CommandClient['execute']>
    ) {
      httpCalls += 1;
      assert.deepEqual({ action, params, options }, {
        action: 'open',
        params: { url, clientId: 'device:8901' },
        options: undefined,
      });
      return ok('open', { clientId: 'device:8901', response }) as never;
    },
  );
  t.mock.method(Connector.prototype, 'openPage', async () => {
    connectorCalls += 1;
    return response;
  });

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    'open',
    url,
    '--client',
    'device:8901',
  ]);

  assert.equal(httpCalls, 1);
  assert.equal(connectorCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '{}'), response);
});

test('--no-daemon open invokes ActionCore in-process and never uses HTTP', async (t) => {
  const url = 'lynx://example/page';
  const response = createResponse();
  const lines: string[] = [];
  let openCalls = 0;
  let httpCalls = 0;
  t.mock.method(console, 'log', (line: unknown) => lines.push(String(line)));
  t.mock.method(HttpCommandClient.prototype, 'execute', async () => {
    httpCalls += 1;
    return ok('open', { clientId: 'device:8901', response }) as never;
  });
  t.mock.method(
    Connector.prototype,
    'openPage',
    async (clientId: string, openedUrl: string) => {
      openCalls += 1;
      assert.deepEqual({ clientId, openedUrl }, {
        clientId: 'device:8901',
        openedUrl: url,
      });
      return response;
    },
  );

  await createProgram({ env: {} }).parseAsync([
    'node',
    'agent-lynx',
    '--no-daemon',
    'open',
    url,
    '--client',
    'device:8901',
  ]);

  assert.equal(openCalls, 1);
  assert.equal(httpCalls, 0);
  assert.deepEqual(JSON.parse(lines.at(-1) ?? '{}'), response);
});
