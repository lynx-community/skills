// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import type { CommandClient } from '@lynx-js/devtool-connector/command';
import { Command } from 'commander';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { registerGetSourceInfoCommand } from '../src/commands/get-source-info.ts';
import type { Context } from '../src/commands/utils.ts';
import { createProgram } from '../src/devtool.ts';

function metadataResponse() {
  return new Response(
    JSON.stringify({
      artifacts: [],
      uiSourceMap: {
        version: 1,
        sources: ['src/App.tsx'],
        mappings: [[0, 32, 5]],
        uiMaps: [42],
      },
      buildInfo: {
        git: {
          commit: 'abc123',
          rootDir: null,
          remoteUrl: 'https://github.com/lynx-community/skills.git',
          commitUrl: null,
        },
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

describe('get-source-info', () => {
  test('registers the command in the root CLI', () => {
    const commandNames = createProgram({ env: {} }).commands.map(command =>
      command.name()
    );
    assert.ok(
      commandNames.includes('get-source-info'),
      'get-source-info must be registered',
    );
  });

  test('numeric nodeId bypasses ActionCore and supports --no-daemon', async (t) => {
    const sentMessages: Array<{
      clientId: string;
      sessionId: number;
      method: string;
      params: unknown;
    }> = [];
    t.mock.method(
      Connector.prototype,
      'sendCDPMessage',
      async (
        clientId: string,
        sessionId: number,
        method: string,
        params: unknown,
      ) => {
        sentMessages.push({ clientId, sessionId, method, params });
        return {
          nodeId: 13,
          tag: 'view',
          nodeIndex: 42,
          debugMetadataUrl:
            'https://example.com/get-source-info.debug-metadata.json',
          lazyBundleUrl: null,
        };
      },
    );
    t.mock.method(globalThis, 'fetch', async () => metadataResponse());

    const output: string[] = [];
    t.mock.method(console, 'log', (line: string) => output.push(line));

    const commandClient = {
      async execute() {
        assert.fail('numeric nodeId must not use ActionCore');
      },
      async *stream() {
        yield await Promise.reject<never>(
          new Error('numeric nodeId must not use ActionCore'),
        );
      },
    } as CommandClient;
    const context: Context = { transports: [], commandClient };
    const program = new Command().option('--no-daemon').exitOverride();
    registerGetSourceInfoCommand(program, context);

    await program.parseAsync([
      'node',
      'test',
      '--no-daemon',
      'get-source-info',
      '13',
      '--client',
      'test-client',
      '--session',
      '7',
    ]);

    assert.deepEqual(sentMessages, [{
      clientId: 'test-client',
      sessionId: 7,
      method: 'DOM.getOriginalNodeSourceInfo',
      params: { nodeId: 13 },
    }]);
    assert.deepEqual(JSON.parse(output[0]!), {
      nodeId: 13,
      tag: 'view',
      nodeIndex: 42,
      debugMetadataUrl:
        'https://example.com/get-source-info.debug-metadata.json',
      lazyBundleUrl: null,
      repo: 'lynx-community/skills',
      source: 'src/App.tsx',
      line: 32,
      column: 5,
      status: 'mapped',
      reason: null,
    });
  });

  test('snapshot ref goes through ActionCore and prints source info', async (t) => {
    const sourceInfo = {
      nodeId: 13,
      tag: 'view',
      nodeIndex: 42,
      debugMetadataUrl:
        'https://example.com/get-source-info.debug-metadata.json',
      lazyBundleUrl: null,
      repo: 'lynx-community/skills',
      source: 'src/App.tsx',
      line: 32,
      column: 5,
      status: 'mapped' as const,
      reason: null,
    };
    const calls: unknown[] = [];
    const commandClient = {
      async execute(action: string, params: unknown) {
        calls.push({ action, params });
        return { ok: true as const, action, data: sourceInfo };
      },
      async *stream() {
        yield await Promise.reject<never>(
          new Error('get-source-info must use a unary ActionCore command'),
        );
      },
    } as CommandClient;
    const output: string[] = [];
    t.mock.method(console, 'log', (line: string) => output.push(line));

    const program = new Command().exitOverride();
    registerGetSourceInfoCommand(program, { transports: [], commandClient });
    await program.parseAsync([
      'node',
      'test',
      'get-source-info',
      '@e3',
      '--client',
      'test-client',
      '--session',
      '7',
    ]);

    assert.deepEqual(calls, [{
      action: 'get-source-info',
      params: { clientId: 'test-client', sessionId: 7, ref: '@e3' },
    }]);
    assert.deepEqual(JSON.parse(output[0]!), sourceInfo);
  });

  test('snapshot ref rejects --no-daemon before calling ActionCore', async (t) => {
    let executeCalls = 0;
    const commandClient = {
      async execute() {
        executeCalls += 1;
        assert.fail('--no-daemon ref must not use ActionCore');
      },
      async *stream() {
        yield await Promise.reject<never>(
          new Error('--no-daemon ref must not use ActionCore'),
        );
      },
    } as CommandClient;
    const errors: string[] = [];
    t.mock.method(console, 'error', (line: string) => errors.push(line));

    const program = new Command().option('--no-daemon').exitOverride();
    registerGetSourceInfoCommand(program, { transports: [], commandClient });
    await program.parseAsync([
      'node',
      'test',
      '--no-daemon',
      'get-source-info',
      '@e3',
    ]);

    assert.equal(executeCalls, 0);
    assert.match(
      errors[0] ?? '',
      /--no-daemon cannot be used with get-source-info/u,
    );
    process.exitCode = undefined;
  });

  test('rejects an invalid nodeId before connecting', async () => {
    const program = new Command().exitOverride();
    registerGetSourceInfoCommand(program, { transports: [] });

    await assert.rejects(
      program.parseAsync(['node', 'test', 'get-source-info', 'invalid']),
      /nodeId must be a non-negative integer/,
    );
  });

  test('rejects an invalid snapshot ref before connecting', async () => {
    const program = new Command().exitOverride();
    registerGetSourceInfoCommand(program, { transports: [] });

    await assert.rejects(
      program.parseAsync(['node', 'test', 'get-source-info', '@e0']),
      /ref must be @e1, @e2/,
    );
  });
});
