#!/usr/bin/env node

// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { readFile } from "node:fs/promises";
import { Command } from "commander";
import type { QueryResult, SqlValue } from "../vendor/perfetto/engine.js";
import { WasmEngine } from "./index.js";

const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB

function extractTraceUrl(input: string): string {
  try {
    const parsed = new URL(input);
    if (parsed.hash.includes("url=")) {
      // Handle hash-based routing: #!/viewer?url=...
      const hashQuery = parsed.hash.replace(/^#!?\/[^?]*\??/, "");
      const params = new URLSearchParams(hashQuery);
      const url = params.get("url");
      if (url) return url;
    }
    if (parsed.searchParams.has("url")) {
      const url = parsed.searchParams.get("url");
      if (url) return url;
    }
  } catch {
    // Not a URL, treat as local path
  }
  return input;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function fetchTrace(url: string): Promise<Uint8Array> {
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch trace: ${resp.status} ${resp.statusText}`);
  }
  return new Uint8Array(await resp.arrayBuffer());
}

async function loadTrace(input: string): Promise<Uint8Array> {
  const resolved = extractTraceUrl(input);

  if (/^https?:\/\//.test(resolved)) {
    return fetchTrace(resolved);
  }

  return new Uint8Array(await readFile(resolved));
}

function formatResultsAsJson(result: QueryResult): string {
  const columns = result.columns();
  if (columns.length === 0 || result.numRows() === 0) {
    return "[]";
  }

  const spec: Record<string, SqlValue> = {};
  for (const col of columns) {
    spec[col] = null;
  }

  const rows: Record<string, SqlValue>[] = [];
  const iter = result.iter(spec);
  while (iter.valid()) {
    const row: Record<string, SqlValue> = {};
    for (const col of columns) {
      const val = iter.get(col);
      // Convert bigint to number for JSON compatibility
      row[col] = typeof val === "bigint" ? Number(val) : val;
    }
    rows.push(row);
    iter.next();
  }

  return JSON.stringify(rows);
}

const program = new Command();

program
  .name("trace-processor")
  .description("Query Perfetto trace files using SQL")
  .argument(
    "<trace>",
    'path or URL to a .pftrace file, or a Lynx trace viewer URL (the "url" param will be extracted automatically)',
  )
  .argument("<sql>", 'SQL query to execute, or "-" to read from stdin')
  .action(async (trace: string, sqlArg: string) => {
    const sql = sqlArg === "-" ? (await readStdin()).trim() : sqlArg;
    if (!sql) {
      process.exitCode = 1;
      throw new Error("empty SQL query");
    }

    const traceData = await loadTrace(trace);
    const engine = new WasmEngine("cli");

    for (let offset = 0; offset < traceData.byteLength; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, traceData.byteLength);
      await engine.parse(traceData.subarray(offset, end));
    }
    await engine.notifyEof();

    const result = await engine.query(sql);
    const error = result.error();
    if (error) {
      process.exitCode = 1;
      throw new Error(error);
    }

    process.stdout.write(formatResultsAsJson(result) + "\n");

    engine[Symbol.dispose]();
  });

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
