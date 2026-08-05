// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, type TestContext, test } from 'node:test';
import {
  renderTraceEventSummary,
  runTraceEventSummary,
  runTraceQuery,
} from '../src/commands/trace-query.ts';

const TRACE_EVENTS = {
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
};

async function createTraceFixture(t: TestContext) {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-trace-query-'),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const tracePath = path.join(directory, 'fixture.json');
  await fs.writeFile(tracePath, JSON.stringify(TRACE_EVENTS));
  return { directory, tracePath };
}

describe('trace query', () => {
  test('executes Perfetto SQL and emits bounded, attributable JSON rows', async (t) => {
    const { tracePath } = await createTraceFixture(t);
    const sql = `SELECT name, COUNT(*) AS count
FROM slice
GROUP BY name
ORDER BY name ASC`;

    const result = await runTraceQuery(tracePath, sql, { maxRows: 1 });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.parseSucceeded, true);
    assert.equal(result.trace.path, tracePath);
    assert.ok(result.trace.bytes > 0);
    assert.match(result.trace.sha256, /^[a-f\d]{64}$/u);
    assert.deepEqual(result.query, {
      source: 'inline',
      text: sql,
      sha256: result.query.sha256,
    });
    assert.match(result.query.sha256, /^[a-f\d]{64}$/u);
    assert.deepEqual(result.columns, ['name', 'count']);
    assert.equal(result.totalRows, 2);
    assert.equal(result.returnedRows, 1);
    assert.equal(result.truncated, true);
    assert.deepEqual(result.rows, [{ name: 'LynxDomReady', count: '1' }]);
  });

  test('attributes SQL loaded from a file', async (t) => {
    const { directory, tracePath } = await createTraceFixture(t);
    const sqlFile = path.join(directory, 'query.sql');
    const sql = 'SELECT COUNT(*) AS count FROM slice';
    await fs.writeFile(sqlFile, sql);

    const result = await runTraceQuery(tracePath, sql, { sqlFile });

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.query.source, 'file');
    assert.equal(result.query.filePath, sqlFile);
    assert.deepEqual(result.rows, [{ count: '3' }]);
  });

  test('rejects an invalid programmatic row limit', async (t) => {
    const { tracePath } = await createTraceFixture(t);
    await assert.rejects(
      runTraceQuery(tracePath, 'SELECT 1', { maxRows: 0 }),
      /positive integer/u,
    );
  });

  test('distinguishes a SQL failure from a trace parse failure', async (t) => {
    const { tracePath } = await createTraceFixture(t);

    const result = await runTraceQuery(
      tracePath,
      'SELECT * FROM missing_agent_lynx_table',
    );

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.parseSucceeded, true);
    assert.equal(result.error.phase, 'query');
    assert.match(result.error.message, /missing_agent_lynx_table/u);
  });
});

describe('trace event-summary', () => {
  test('lists every slice event name by descending count', async (t) => {
    const { tracePath } = await createTraceFixture(t);

    const result = await runTraceEventSummary(tracePath);

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.equal(result.eventSource, 'slice.name');
    assert.equal(result.totalEvents, 3);
    assert.equal(result.uniqueEventNames, 2);
    assert.deepEqual(result.events, [
      { name: 'LynxLoadTemplate', count: 2 },
      { name: 'LynxDomReady', count: 1 },
    ]);
    const table = renderTraceEventSummary(result);
    assert.match(table, /Total slice events: 3/u);
    assert.match(table, /\b2 {2}LynxLoadTemplate\b/u);
    assert.match(table, /\b1 {2}LynxDomReady\b/u);
  });

  test('returns structured parse evidence for an invalid trace', async (t) => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'agent-lynx-invalid-trace-'),
    );
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const tracePath = path.join(directory, 'invalid.pftrace');
    await fs.writeFile(tracePath, 'not a trace');

    const result = await runTraceEventSummary(tracePath);

    assert.equal(result.success, false);
    if (result.success) return;
    assert.equal(result.parseSucceeded, false);
    assert.equal(result.error.phase, 'parse');
    assert.ok(result.error.message.length > 0);
    assert.equal(result.trace.bytes, 11);
  });
});
