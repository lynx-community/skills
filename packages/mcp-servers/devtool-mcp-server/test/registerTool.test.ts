// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import { Client } from '@modelcontextprotocol/sdk/client';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as z from 'zod';
import {
  type Context,
  defineTool,
  McpContext,
  registerToolWithContext,
  type ToolDefinition,
} from '../src/index.ts';

async function connect(
  t: TestContext,
  register: (server: McpServer) => void,
): Promise<Client> {
  const server = new McpServer({ name: 'fixture', version: '1.0.0' });
  const client = new Client({ name: 'fixture-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport
    .createLinkedPair();
  t.after(async () => {
    await client.close();
    await server.close();
  });
  register(server);
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

test('context factories preserve distribution connectors and isolate concurrent responses', async t => {
  interface CustomContext extends Context {
    sequence: number;
  }
  const connector = new Connector([]);
  const schema = { value: z.string() };
  let sequence = 0;
  const tool = defineTool<typeof schema, CustomContext>({
    name: 'Fixture_context',
    description: 'Fixture context',
    annotations: { readOnlyHint: true },
    schema,
    async handler({ params, extra }, response, context) {
      assert.equal(context.connector(), connector);
      assert.ok(extra.signal instanceof AbortSignal);
      await Promise.resolve();
      response.appendLines(
        JSON.stringify({ value: params.value, sequence: context.sequence }),
      );
    },
  });
  const client = await connect(
    t,
    server =>
      registerToolWithContext(server, tool, async () => ({
        connector: () => connector,
        sequence: ++sequence,
      })),
  );
  const results = await Promise.all(
    ['first', 'second'].map(value =>
      client.callTool({
        name: tool.name,
        arguments: { value },
      })
    ),
  );
  const values = results.map(result => {
    assert.equal(result.isError, undefined);
    const content = result.content as Array<{ type: string; text: string; }>;
    assert.equal(content.length, 1);
    return JSON.parse(content[0]!.text) as { value: string; sequence: number; };
  });
  assert.deepEqual(values.map(value => value.value), ['first', 'second']);
  assert.deepEqual(values.map(value => value.sequence).sort(), [1, 2]);
  assert.equal(sequence, 2);
});

test('inferred schemas retain defaults and optional fields', async t => {
  const connector = new Connector([]);
  const tool = defineTool({
    name: 'Fixture_inferredSchema',
    description: 'Fixture inferred schema',
    annotations: { readOnlyHint: true },
    schema: {
      value: z.string(),
      count: z.number().default(2),
      suffix: z.string().optional(),
    },
    async handler({ params }, response) {
      response.appendLines(
        params.value.repeat(params.count) + (params.suffix ?? ''),
      );
    },
  });
  const client = await connect(
    t,
    server =>
      registerToolWithContext(
        server,
        tool,
        () => McpContext.withConnector(connector),
      ),
  );
  const result = await client.callTool({
    name: tool.name,
    arguments: { value: 'echo' },
  });
  assert.deepEqual(result.content, [{ type: 'text', text: 'echoecho' }]);
});

test('context registration type-checks concrete schemas and custom contexts', () => {
  const fileName = fileURLToPath(import.meta.url);
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    exactOptionalPropertyTypes: true,
    noUncheckedIndexedAccess: true,
    allowImportingTsExtensions: true,
    noEmit: true,
    types: ['node'],
  };
  const host = ts.createCompilerHost(options);
  const program = ts.createProgram([fileName], options, host);
  const sourceFile = program.getSourceFile(fileName);
  assert.ok(sourceFile);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ];
  assert.equal(diagnostics.length, 0, ts.formatDiagnostics(diagnostics, host));
});

test('shared execution preserves text/image output and normalizes tool failures', async t => {
  const context = { connector: () => new Connector([]) };
  const client = await connect(t, server => {
    for (
      const [name, failure] of [
        ['Fixture_error', new Error('original error')],
        ['Fixture_string', 'original string'],
      ] as const
    ) {
      registerToolWithContext(
        server,
        defineTool({
          name,
          description: name,
          schema: {},
          annotations: { readOnlyHint: true },
          async handler() {
            throw failure;
          },
        }),
        async () => context,
      );
    }
    registerToolWithContext(
      server,
      defineTool({
        name: 'Fixture_output',
        description: 'Fixture output',
        schema: {},
        annotations: { readOnlyHint: true },
        async handler(_request, response) {
          response.appendLines('first', 'second');
          response.attachImage({ data: 'aW1hZ2U=', mimeType: 'image/png' });
        },
      }),
      async () => context,
    );
  });
  const output = await client.callTool({
    name: 'Fixture_output',
    arguments: {},
  });
  assert.deepEqual(output.content, [
    { type: 'text', text: 'first\nsecond' },
    { type: 'image', data: 'aW1hZ2U=', mimeType: 'image/png' },
  ]);
  for (
    const [name, message] of [['Fixture_error', 'original error'], [
      'Fixture_string',
      'original string',
    ]]
  ) {
    const result = await client.callTool({ name: name!, arguments: {} });
    assert.equal(result.isError, true);
    assert.deepEqual(result.content, [{ type: 'text', text: message }]);
  }
});

test('schema failures are synchronous and do not invoke the context factory', () => {
  const server = new McpServer({ name: 'fixture', version: '1.0.0' });
  let invoked = false;
  assert.throws(
    () =>
      registerToolWithContext(
        server,
        { name: 'invalid' } as ToolDefinition,
        async () => {
          invoked = true;
          return { connector: () => new Connector([]) };
        },
      ),
    /Tool schema is required/,
  );
  assert.equal(invoked, false);
});

test('a failing context factory prevents handler execution', async t => {
  let invoked = false;
  const client = await connect(
    t,
    server =>
      registerToolWithContext(
        server,
        defineTool({
          name: 'Fixture_contextError',
          description: 'Fixture context failure',
          schema: {},
          annotations: { readOnlyHint: true },
          async handler() {
            invoked = true;
          },
        }),
        async () => {
          throw new Error('context unavailable');
        },
      ),
  );
  const result = await client.callTool({
    name: 'Fixture_contextError',
    arguments: {},
  });
  assert.equal(result.isError, true);
  assert.match(JSON.stringify(result.content), /context unavailable/);
  assert.equal(invoked, false);
});
