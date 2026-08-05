// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function readJavaScriptFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        return readJavaScriptFiles(file);
      }
      return entry.name.endsWith('.mjs')
        ? [await fs.readFile(file, 'utf8')]
        : [];
    }),
  );
  return contents.flat();
}

async function exists(url: URL): Promise<boolean> {
  try {
    await fs.access(url);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

test('the built package starts its bin and exposes the typed connector API', async (t) => {
  const builtBin = new URL('../dist/index.mjs', import.meta.url);
  if (!(await exists(builtBin))) {
    t.skip('build artifacts are not present; run pnpm build first');
    return;
  }

  await fs.access(new URL('../dist/connector.mjs', import.meta.url));
  await fs.access(new URL('../dist/connector.d.ts', import.meta.url));
  await fs.access(new URL('../dist/devtool.mjs', import.meta.url));
  await fs.access(new URL('../dist/commands/snapshot.mjs', import.meta.url));
  await fs.access(new URL('../dist/commands/skills.mjs', import.meta.url));
  await fs.access(new URL('../dist/commands/trace.mjs', import.meta.url));
  await fs.access(new URL('../dist/commands/trace-query.mjs', import.meta.url));
  assert.equal(
    await exists(new URL('../dist/daemon-entry.mjs', import.meta.url)),
    false,
  );

  // The published command surface is an allow-list: anything not registered by
  // devtool.ts must not appear as a top-level command module in dist.
  const commandModules = (
    await fs.readdir(new URL('../dist/commands', import.meta.url))
  )
    .filter((name) => name.endsWith('.mjs'))
    .map((name) => name.replace(/\.mjs$/u, ''))
    .sort();
  assert.deepEqual(commandModules, [
    'app',
    'cdp',
    'cli',
    'evaluate',
    'fill',
    'get',
    'get-console',
    'get-sources',
    'global-switch',
    'inspect',
    'list-clients',
    'list-sessions',
    'open',
    'recorder-analysis',
    'recorder-end',
    'recorder-start',
    'result',
    'screenshot',
    'scroll',
    'skills',
    'snapshot',
    'take-content-screenshot',
    'take-heap-snapshot',
    'take-screenshot',
    'tap',
    'trace',
    'trace-query',
    'utils',
    'wait',
    'wait-for-client',
  ]);

  const connector = await import('agent-lynx/connector');
  assert.equal(typeof connector.Connector, 'function');
  assert.equal(typeof connector.DaemonTransport, 'function');
  assert.equal(typeof connector.createDefaultConnector, 'function');
  assert.equal(typeof connector.createDefaultTransports, 'function');
  assert.equal(typeof connector.evaluateExpression, 'function');
  assert.equal(typeof connector.wrapExpression, 'function');

  const defaultTransports = connector.createDefaultTransports();
  assert.equal(defaultTransports.length, 1);
  assert.ok(defaultTransports[0] instanceof connector.DaemonTransport);

  const buildFiles = await readJavaScriptFiles(
    fileURLToPath(new URL('../dist', import.meta.url)),
  );
  const connectorReferences = [
    ...buildFiles
      .join('\n')
      .matchAll(/["'](@lynx-js\/devtool-connector(?:\/[^"']*)?)["']/gu),
  ].map((match) => match[1]);
  assert.deepEqual([...new Set(connectorReferences)].sort(), [
    '@lynx-js/devtool-connector',
    '@lynx-js/devtool-connector/command',
    '@lynx-js/devtool-connector/streams',
    '@lynx-js/devtool-connector/transport',
  ]);
  assert.match(buildFiles.join('\n'), /["']@lynx-js\/trace-processor["']/u);

  const help = await execFileAsync(process.execPath, [
    fileURLToPath(builtBin),
    '--help',
  ]);
  assert.match(
    help.stdout,
    /trace\s+Record, download, and inspect Lynx\s+performance traces/,
  );

  const traceHelp = await execFileAsync(process.execPath, [
    fileURLToPath(builtBin),
    'trace',
    '--help',
  ]);
  assert.match(traceHelp.stdout, /start \[options\]/);
  assert.match(traceHelp.stdout, /end \[options\]/);
  assert.match(traceHelp.stdout, /read-data \[options\]/);
  assert.match(traceHelp.stdout, /query \[options\] <trace>/);
  assert.match(traceHelp.stdout, /event-summary \[options\] <trace>/);

  const localOnlyEnvironment = {
    ...process.env,
    CODEX_SANDBOX_NETWORK_DISABLED: '1',
  };
  const list = await execFileAsync(
    process.execPath,
    [fileURLToPath(builtBin), 'skills', 'list'],
    {
      env: localOnlyEnvironment,
    },
  );
  assert.match(list.stdout, /<available_skills>/);
  assert.match(list.stdout, /<name>lynx-devtool<\/name>/);
  assert.match(list.stdout, /\/SKILL\.md<\/location>/);

  const get = await execFileAsync(
    process.execPath,
    [fileURLToPath(builtBin), 'skills', 'get', 'lynx-devtool'],
    {
      env: localOnlyEnvironment,
    },
  );
  assert.match(get.stdout, /^<skill_content name="lynx-devtool">/);
  assert.match(get.stdout, /<file>examples\//);
  assert.match(get.stdout, /<file>references\//);
  assert.doesNotMatch(get.stdout, /<file>dist\//);
});

test('the built bin runs offline trace analysis without a device', async (t) => {
  const builtBin = new URL('../dist/index.mjs', import.meta.url);
  if (!(await exists(builtBin))) {
    t.skip('build artifacts are not present; run pnpm build first');
    return;
  }

  const workDirectory = await fs.mkdtemp(
    path.join(await fs.realpath('/tmp'), 'agent-lynx-trace-'),
  );
  t.after(() => fs.rm(workDirectory, { recursive: true, force: true }));
  const localOnlyEnvironment = {
    ...process.env,
    CODEX_SANDBOX_NETWORK_DISABLED: '1',
  };

  const traceFixture = path.join(workDirectory, 'trace-fixture.json');
  await fs.writeFile(
    traceFixture,
    JSON.stringify({
      traceEvents: [
        {
          name: 'LynxLoadTemplate',
          cat: 'lynx',
          ph: 'X',
          ts: 1_000,
          dur: 200,
          pid: 1,
          tid: 1,
        },
        {
          name: 'LynxDomReady',
          cat: 'lynx',
          ph: 'X',
          ts: 1_300,
          dur: 50,
          pid: 1,
          tid: 1,
        },
        {
          name: 'LynxLoadTemplate',
          cat: 'lynx',
          ph: 'X',
          ts: 1_500,
          dur: 100,
          pid: 1,
          tid: 1,
        },
      ],
    }),
  );

  const eventSummaryPath = path.join(workDirectory, 'event-summary.json');
  await execFileAsync(
    process.execPath,
    [
      fileURLToPath(builtBin),
      'trace',
      'event-summary',
      traceFixture,
      '--json',
      '--output',
      eventSummaryPath,
    ],
    { cwd: workDirectory, env: localOnlyEnvironment },
  );
  const eventSummary = JSON.parse(
    await fs.readFile(eventSummaryPath, 'utf8'),
  ) as {
    success?: boolean;
    events?: Array<{ name?: string; count?: number }>;
  };
  assert.equal(eventSummary.success, true);
  assert.deepEqual(eventSummary.events, [
    { name: 'LynxLoadTemplate', count: 2 },
    { name: 'LynxDomReady', count: 1 },
  ]);

  const sqlFile = path.join(workDirectory, 'required-events.sql');
  await fs.writeFile(
    sqlFile,
    'SELECT name, COUNT(*) AS count FROM slice GROUP BY name ORDER BY name ASC',
  );
  const queryPath = path.join(workDirectory, 'query-result.json');
  await execFileAsync(
    process.execPath,
    [
      fileURLToPath(builtBin),
      'trace',
      'query',
      traceFixture,
      '--sql-file',
      sqlFile,
      '--output',
      queryPath,
    ],
    { cwd: workDirectory, env: localOnlyEnvironment },
  );
  const query = JSON.parse(await fs.readFile(queryPath, 'utf8')) as {
    success?: boolean;
    rows?: Array<Record<string, unknown>>;
  };
  assert.equal(query.success, true);
  assert.deepEqual(query.rows, [
    { name: 'LynxDomReady', count: '1' },
    { name: 'LynxLoadTemplate', count: '2' },
  ]);
});
