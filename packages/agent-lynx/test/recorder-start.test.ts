// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test } from 'node:test';
import type { Connector } from '@lynx-js/devtool-connector';
import { runRecordingStart } from '../src/commands/recorder-start.ts';

function createMockConnector(opts: {
  debugMode: boolean;
  debugModePersists?: boolean;
  recordingStartError?: Error;
}): Connector & {
  calls: Array<{ method: string; args: unknown[] }>;
} {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  let currentDebugMode = opts.debugMode;
  return {
    calls,
    getGlobalSwitch(_clientId: string, key: string) {
      calls.push({ method: 'getGlobalSwitch', args: [key] });
      return Promise.resolve(currentDebugMode);
    },
    setGlobalSwitch(_clientId: string, key: string, value: boolean) {
      calls.push({ method: 'setGlobalSwitch', args: [key, value] });
      if (opts.debugModePersists !== false) {
        currentDebugMode = value;
      }
      return Promise.resolve();
    },
    sendCDPMessage(
      _clientId: string,
      _sessionId: number,
      method: string,
      params: unknown,
    ) {
      calls.push({ method: 'sendCDPMessage', args: [method, params] });
      if (opts.recordingStartError) {
        return Promise.reject(opts.recordingStartError);
      }
      return Promise.resolve({});
    },
  } as unknown as Connector & {
    calls: Array<{ method: string; args: unknown[] }>;
  };
}

describe('runRecordingStart', () => {
  test('enables debug mode and asks for app restart when switch persists', async (t) => {
    const connector = createMockConnector({
      debugMode: false,
      debugModePersists: true,
    });

    const result = await runRecordingStart(connector, 'test-client');

    t.assert.equal(result.started, false);
    t.assert.equal(result.restartRequired, true);
    t.assert.match(
      result.message,
      /Restart the app and run `recorder start` again/,
    );
    t.assert.deepEqual(connector.calls, [
      { method: 'getGlobalSwitch', args: ['enable_debug_mode'] },
      { method: 'setGlobalSwitch', args: ['enable_debug_mode', true] },
      { method: 'getGlobalSwitch', args: ['enable_debug_mode'] },
    ]);
  });

  test('skips restart and starts recording when switch does not persist', async (t) => {
    const connector = createMockConnector({
      debugMode: false,
      debugModePersists: false,
    });

    const result = await runRecordingStart(connector, 'test-client');

    t.assert.equal(result.started, true);
    t.assert.equal(result.restartRequired, false);
    t.assert.deepEqual(connector.calls, [
      { method: 'getGlobalSwitch', args: ['enable_debug_mode'] },
      { method: 'setGlobalSwitch', args: ['enable_debug_mode', true] },
      { method: 'getGlobalSwitch', args: ['enable_debug_mode'] },
      { method: 'sendCDPMessage', args: ['Recording.start', {}] },
    ]);
  });

  test('starts recording when debug mode is already enabled', async (t) => {
    const connector = createMockConnector({ debugMode: true });

    const result = await runRecordingStart(connector, 'test-client');

    t.assert.equal(result.started, true);
    t.assert.equal(result.restartRequired, false);
    t.assert.match(
      result.message,
      /Open or reload a Lynx page before `recorder end`/,
    );
    t.assert.doesNotMatch(result.message, /session -1/);
    t.assert.deepEqual(connector.calls, [
      { method: 'getGlobalSwitch', args: ['enable_debug_mode'] },
      { method: 'sendCDPMessage', args: ['Recording.start', {}] },
    ]);
  });

  test('adds a recorder build hint when Recording.start is not implemented', async (t) => {
    const connector = createMockConnector({
      debugMode: true,
      recordingStartError: new Error(
        'CDP request error: Not implemented: Recording.start',
      ),
    });

    await t.assert.rejects(
      () => runRecordingStart(connector, 'test-client'),
      /ENABLE_TESTBENCH_RECORDER|dev\/recorder/,
    );
  });
});
