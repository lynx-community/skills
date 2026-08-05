// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ReadableStream } from 'node:stream/web';
import { describe, test } from 'node:test';
import { Connector } from '@lynx-js/devtool-connector';
import { Command } from 'commander';
import {
  registerTraceCommand,
  runTraceEnd,
  runTraceReadData,
  runTraceStart,
} from '../src/commands/trace.ts';
import type { Context } from '../src/commands/utils.ts';

interface MockTraceConnector extends Connector {
  calls: Array<{ method: string; args: unknown[] }>;
}

interface MockTraceConnectorOptions {
  appProcessName?: string;
  debugMode?: boolean;
  startError?: Error;
  endEvents?: unknown[];
  ioChunks?: Array<{ data?: string; base64Encoded?: boolean; eof?: boolean }>;
  ioReadErrorAt?: number;
}

function createMockConnector(
  options: MockTraceConnectorOptions = {},
): MockTraceConnector {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  let debugMode = options.debugMode ?? true;
  let ioReadCount = 0;

  return {
    calls,
    listClients() {
      calls.push({ method: 'listClients', args: [] });
      return Promise.resolve([
        {
          id: 'test-client',
          info:
            options.appProcessName === undefined
              ? {}
              : { AppProcessName: options.appProcessName },
        },
      ]);
    },
    getGlobalSwitch(_clientId: string, key: string) {
      calls.push({ method: 'getGlobalSwitch', args: [key] });
      return Promise.resolve(debugMode);
    },
    setGlobalSwitch(_clientId: string, key: string, value: boolean) {
      calls.push({ method: 'setGlobalSwitch', args: [key, value] });
      debugMode = value;
      return Promise.resolve();
    },
    sendCDPMessage(
      _clientId: string,
      sessionId: number,
      method: string,
      params: unknown,
    ) {
      calls.push({
        method: 'sendCDPMessage',
        args: [sessionId, method, params],
      });
      if (method === 'Tracing.start' && options.startError) {
        return Promise.reject(options.startError);
      }
      if (method === 'IO.read') {
        ioReadCount++;
        if (options.ioReadErrorAt === ioReadCount) {
          return Promise.reject(new Error('IO.read failed'));
        }
        return Promise.resolve(options.ioChunks?.shift() ?? { eof: true });
      }
      return Promise.resolve({});
    },
    async sendCDPStream(
      _clientId: string,
      sessionId: number,
      input: ReadableStream<unknown>,
    ) {
      const requests: unknown[] = [];
      for await (const request of input) requests.push(request);
      calls.push({ method: 'sendCDPStream', args: [sessionId, requests] });

      let controller: ReadableStreamDefaultController<unknown> | undefined;
      const stream = new ReadableStream<unknown>({
        start(currentController) {
          controller = currentController;
          for (const event of options.endEvents ?? [])
            currentController.enqueue(event);
          currentController.close();
        },
      });
      Object.assign(stream, {
        async [Symbol.asyncDispose]() {
          try {
            controller?.close();
          } catch {
            // The fixture stream normally closes itself before disposal.
          }
        },
      });
      return stream;
    },
  } as unknown as MockTraceConnector;
}

describe('runTraceStart', () => {
  test('enables Android debug mode and asks for a restart before tracing', async () => {
    const connector = createMockConnector({
      appProcessName: 'com.example.app',
      debugMode: false,
    });

    const result = await runTraceStart(connector, 'test-client', {
      enableSystrace: true,
      includedCategories: ['*'],
      excludedCategories: ['*'],
      enableMemoryTrace: false,
      forceGC: true,
      enableAutoHeapSnapshot: false,
      sharedGroupId: '',
      jsProfileInterval: -1,
      jsProfileType: 'quickjs',
    });

    assert.deepEqual(result, {
      started: false,
      restartRequired: true,
      message:
        '`enable_debug_mode` has been enabled. Restart the app and run `trace start` again.',
    });
    assert.deepEqual(
      connector.calls.map((call) => call.method),
      ['listClients', 'getGlobalSwitch', 'setGlobalSwitch'],
    );
  });

  test("starts with the trace recorder's complete configuration", async () => {
    const connector = createMockConnector({
      appProcessName: 'com.example.app',
      debugMode: true,
    });

    const result = await runTraceStart(connector, 'test-client', {
      enableSystrace: false,
      includedCategories: ['lynx', 'jsb'],
      excludedCategories: ['devtool', 'vitals'],
      enableMemoryTrace: true,
      forceGC: false,
      enableAutoHeapSnapshot: true,
      sharedGroupId: 'xxx',
      jsProfileInterval: 1_000,
      jsProfileType: 'v8',
    });

    assert.equal(result.started, true);
    const startCall = connector.calls.find(
      (call) =>
        call.method === 'sendCDPMessage' && call.args[1] === 'Tracing.start',
    );
    assert.deepEqual(startCall?.args, [
      -1,
      'Tracing.start',
      {
        traceConfig: {
          recordMode: 'recordContinuously',
          includedCategories: ['lynx', 'jsb'],
          excludedCategories: ['devtool', 'vitals'],
          enableSystrace: false,
          enableMemoryTrace: true,
          forceGC: false,
          enableAutoHeapSnapshot: true,
          sharedGroupId: 'xxx',
          bufferSize: 200 * 1024,
          JSProfileInterval: 1_000,
          JSProfileType: 'v8',
          enableCompress: true,
        },
      },
    ]);
  });

  test('does not toggle Android-only debug mode for an iOS-style client', async () => {
    const connector = createMockConnector({ debugMode: false });

    const result = await runTraceStart(connector, 'test-client', {
      enableSystrace: true,
      includedCategories: ['*'],
      excludedCategories: ['*'],
      enableMemoryTrace: false,
      forceGC: true,
      enableAutoHeapSnapshot: false,
      sharedGroupId: '',
      jsProfileInterval: -1,
      jsProfileType: 'quickjs',
    });

    assert.equal(result.started, true);
    assert.deepEqual(
      connector.calls.map((call) => call.method),
      ['listClients', 'sendCDPMessage'],
    );
  });

  test('adds a supported-runtime hint for unavailable tracing', async () => {
    const connector = createMockConnector({
      startError: new Error(
        'CDP request error: Failed to get trace controller',
      ),
    });

    await assert.rejects(
      runTraceStart(connector, 'test-client', {
        enableSystrace: true,
        includedCategories: ['*'],
        excludedCategories: ['*'],
        enableMemoryTrace: false,
        forceGC: true,
        enableAutoHeapSnapshot: false,
        sharedGroupId: '',
        jsProfileInterval: -1,
        jsProfileType: 'quickjs',
      }),
      /Android local_test build|iOS Lynx Profile build/,
    );
  });
});

describe('trace start command', () => {
  for (const { name, args, expectedEnableSystrace } of [
    {
      name: 'enables systrace by default',
      args: [] as string[],
      expectedEnableSystrace: true,
    },
    {
      name: 'disables systrace with --no-systrace',
      args: ['--no-systrace'],
      expectedEnableSystrace: false,
    },
  ]) {
    test(name, async (t) => {
      const startParams: Array<Record<string, unknown>> = [];
      t.mock.method(Connector.prototype, 'listClients', async () => [
        {
          id: 'test-client',
          info: {},
        },
      ]);
      t.mock.method(
        Connector.prototype,
        'sendCDPMessage',
        async (
          _clientId: string,
          _sessionId: number,
          method: string,
          params: unknown,
        ) => {
          if (method === 'Tracing.start')
            startParams.push(params as Record<string, unknown>);
          return {};
        },
      );
      t.mock.method(console, 'log', () => {});

      const context: Context = { transports: [] };
      const program = new Command().exitOverride();
      registerTraceCommand(program, context);

      await program.parseAsync([
        'node',
        'test',
        'trace',
        'start',
        '--client',
        'test-client',
        ...args,
      ]);

      assert.equal(startParams.length, 1);
      assert.deepEqual(startParams[0]?.['traceConfig'], {
        recordMode: 'recordContinuously',
        includedCategories: ['*'],
        excludedCategories: ['*'],
        enableSystrace: expectedEnableSystrace,
        enableMemoryTrace: false,
        forceGC: true,
        enableAutoHeapSnapshot: false,
        sharedGroupId: '',
        bufferSize: 200 * 1024,
        JSProfileInterval: -1,
        JSProfileType: '',
        enableCompress: true,
      });
    });
  }

  test('maps category, memory, and JS profile options', async (t) => {
    const startParams: Array<Record<string, unknown>> = [];
    t.mock.method(Connector.prototype, 'listClients', async () => [
      {
        id: 'test-client',
        info: {},
      },
    ]);
    t.mock.method(
      Connector.prototype,
      'sendCDPMessage',
      async (
        _clientId: string,
        _sessionId: number,
        method: string,
        params: unknown,
      ) => {
        if (method === 'Tracing.start')
          startParams.push(params as Record<string, unknown>);
        return {};
      },
    );
    t.mock.method(console, 'log', () => {});

    const context: Context = { transports: [] };
    const program = new Command().exitOverride();
    registerTraceCommand(program, context);

    await program.parseAsync([
      'node',
      'test',
      'trace',
      'start',
      '--client',
      'test-client',
      '--include-categories',
      'lynx, jsb',
      '--exclude-categories',
      'devtool, vitals',
      '--enable-memory-trace',
      '--no-force-gc',
      '--enable-auto-heap-snapshot',
      '--shared-group-id',
      'xxx',
      '--js-profile-type',
      'v8',
    ]);

    assert.equal(startParams.length, 1);
    assert.deepEqual(startParams[0]?.['traceConfig'], {
      recordMode: 'recordContinuously',
      includedCategories: ['lynx', 'jsb'],
      excludedCategories: ['devtool', 'vitals'],
      enableSystrace: true,
      enableMemoryTrace: true,
      forceGC: false,
      enableAutoHeapSnapshot: true,
      sharedGroupId: 'xxx',
      bufferSize: 200 * 1024,
      JSProfileInterval: 100,
      JSProfileType: 'v8',
      enableCompress: true,
    });
  });

  test('exposes only the opt-out systrace flag', () => {
    const program = new Command();
    registerTraceCommand(program, { transports: [] });
    const trace = program.commands.find(
      (command) => command.name() === 'trace',
    );
    const start = trace?.commands.find((command) => command.name() === 'start');
    assert.ok(start);

    let output = '';
    start.configureOutput({
      writeOut: (value) => {
        output += value;
      },
    });
    start.outputHelp();

    assert.match(output, /--no-systrace\s+Disable systrace/);
    assert.doesNotMatch(output, /--enable-systrace/);
  });
});

describe('runTraceEnd', () => {
  test('returns the stream handle from Tracing.tracingComplete', async () => {
    const connector = createMockConnector({
      endEvents: [
        { id: 1, result: {} },
        {
          method: 'Tracing.tracingComplete',
          params: { stream: 42, dataLossOccurred: false },
        },
      ],
    });

    const result = await runTraceEnd(connector, 'test-client', 1_000);

    assert.deepEqual(result, { stream: '42', dataLossOccurred: false });
    const streamCall = connector.calls.find(
      (call) => call.method === 'sendCDPStream',
    );
    assert.deepEqual(streamCall?.args, [
      -1,
      [{ method: 'Tracing.end', params: {} }],
    ]);
  });

  test('turns the native not-started error into an actionable message', async () => {
    const connector = createMockConnector({
      endEvents: [{ error: { message: 'Tracing is not started' } }],
    });

    await assert.rejects(
      runTraceEnd(connector, 'test-client', 1_000),
      /agent-lynx trace start/,
    );
  });

  test('rejects tracingComplete without a usable stream handle', async () => {
    const connector = createMockConnector({
      endEvents: [
        {
          method: 'Tracing.tracingComplete',
          params: { dataLossOccurred: true },
        },
      ],
    });

    await assert.rejects(
      runTraceEnd(connector, 'test-client', 1_000),
      /data loss|stream handle/,
    );
  });
});

describe('runTraceReadData', () => {
  test('streams base64 data to an atomically published pftrace file', async (t) => {
    const connector = createMockConnector({
      ioChunks: [
        {
          data: Buffer.from('trace-').toString('base64'),
          base64Encoded: true,
          eof: false,
        },
        {
          data: Buffer.from('payload').toString('base64'),
          base64Encoded: true,
          eof: true,
        },
      ],
    });
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'agent-lynx-trace-'),
    );
    t.after(() => fs.rm(tempDir, { recursive: true, force: true }));
    const output = path.join(tempDir, 'nested', 'capture.pftrace');

    const result = await runTraceReadData(
      connector,
      'test-client',
      '42',
      output,
      1_000,
    );

    assert.deepEqual(result, { filePath: output, bytesWritten: 13 });
    assert.equal(await fs.readFile(output, 'utf8'), 'trace-payload');
    assert.deepEqual(await fs.readdir(path.dirname(output)), [
      'capture.pftrace',
    ]);
    assert.equal(
      connector.calls.filter(
        (call) =>
          call.method === 'sendCDPMessage' && call.args[1] === 'IO.read',
      ).length,
      2,
    );
    assert.equal(
      connector.calls.filter(
        (call) =>
          call.method === 'sendCDPMessage' && call.args[1] === 'IO.close',
      ).length,
      1,
    );
  });

  test('preserves an existing output and closes the native stream when reading fails', async (t) => {
    const connector = createMockConnector({
      ioChunks: [
        { data: Buffer.from('partial').toString('base64'), eof: false },
      ],
      ioReadErrorAt: 2,
    });
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'agent-lynx-trace-failure-'),
    );
    t.after(() => fs.rm(tempDir, { recursive: true, force: true }));
    const output = path.join(tempDir, 'capture.pftrace');
    await fs.writeFile(output, 'previous trace');

    await assert.rejects(
      runTraceReadData(connector, 'test-client', '7', output, 1_000),
      /IO\.read failed/,
    );

    assert.equal(await fs.readFile(output, 'utf8'), 'previous trace');
    assert.deepEqual(await fs.readdir(tempDir), ['capture.pftrace']);
    assert.equal(
      connector.calls.filter(
        (call) =>
          call.method === 'sendCDPMessage' && call.args[1] === 'IO.close',
      ).length,
      1,
    );
  });

  test('rejects a malformed stream handle before touching the connector', async () => {
    const connector = createMockConnector();

    await assert.rejects(
      runTraceReadData(
        connector,
        'test-client',
        'not-a-handle',
        undefined,
        1_000,
      ),
      /Invalid --stream value/,
    );
    assert.deepEqual(connector.calls, []);
  });
});
