// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { WasmEngine } from '../dist/index.js';

function skip(msg) {
  // Keep it simple: CI should treat this as success.
  console.log(`[trace-processor smoke] SKIP: ${msg}`);
  process.exit(0);
}

async function download(url, outPath) {
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(
      `Failed to download ${url}: ${res.status} ${res.statusText}`,
    );
  const buf = new Uint8Array(await res.arrayBuffer());
  await writeFile(outPath, buf);
}

function spawnWait(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  if (process.platform === 'win32') skip('benchx_cli not supported on Windows');

  // Provided by workspace package @lynx-js/benchx-cli
  const benchxCmd = 'benchx_cli';

  const dir = await mkdtemp(join(tmpdir(), 'trace-processor-smoke-'));
  const bundlePath = join(dir, 'GalleryComplete.lynx.bundle');
  const tracePath = join(dir, 'GalleryComplete.ptrace');

  // 1) Download test bundle
  await download(
    'https://unpkg.com/@lynx-example/gallery@0.6.7/dist/GalleryComplete.lynx.bundle',
    bundlePath,
  );

  // 2) Run benchx_cli to generate a perfetto trace
  await spawnWait(benchxCmd, [
    '-o',
    tracePath,
    'run',
    bundlePath,
    '--wait',
    '1000',
  ]);

  // 3) Load trace into wasm engine
  const traceData = new Uint8Array(await readFile(tracePath));

  const engine = new WasmEngine(`smoke-${Date.now()}`);
  try {
    await engine.parse(traceData);
    await engine.notifyEof();

    // 4) Verify trace contains expected symbols
    const result = await engine.query(`
      SELECT name FROM slice WHERE
        name GLOB 'LynxEngine::LoadTemplate'
        OR name GLOB 'LynxShell::~LynxShell'
        OR name GLOB 'ReactLynx::diff::*'
    `);
    const queryError = result.error?.();
    if (queryError) throw new Error(`Trace query failed: ${queryError}`);

    const found = new Set();
    for (const it = result.iter({}); it.valid(); it.next()) {
      const name = it.get('name');
      if (typeof name === 'string') found.add(name);
    }

    const expected = [
      'LynxEngine::LoadTemplate',
      'LynxShell::~LynxShell',
      // wildcard check: any ReactLynx::diff::* should match
      'ReactLynx::diff::',
    ];

    for (const sym of expected) {
      if (sym.endsWith('::') || sym.includes('*')) {
        const ok = [...found].some((x) => x.startsWith(sym.replace('*', '')));
        if (!ok) throw new Error(`Missing expected symbol prefix '${sym}'`);
      } else {
        if (!found.has(sym))
          throw new Error(`Missing expected symbol '${sym}'`);
      }
    }

    // 5) Verify FiberElement Constructor/Destructor balance
    const match = await engine.query(`
      SELECT
        (SELECT COUNT(DISTINCT int_value) FROM args JOIN slice USING(arg_set_id)
         WHERE slice.name = 'FiberElement::Constructor' AND key = 'debug.id') as constructed_unique,
        (SELECT COUNT(DISTINCT int_value) FROM args JOIN slice USING(arg_set_id)
         WHERE slice.name = 'FiberElement::Destructor' AND key = 'debug.id') as destroyed_unique,
        (SELECT COUNT(*) FROM (
           SELECT int_value FROM args JOIN slice USING(arg_set_id)
           WHERE slice.name = 'FiberElement::Constructor' AND key = 'debug.id'
           EXCEPT
           SELECT int_value FROM args JOIN slice USING(arg_set_id)
           WHERE slice.name = 'FiberElement::Destructor' AND key = 'debug.id'
         )) as diff_count;
    `);
    const matchError = match.error?.();
    if (matchError) throw new Error(`Trace query failed: ${matchError}`);

    const cols = match.columns();
    const it = match.iter({});
    if (!it.valid())
      throw new Error('FiberElement balance query returned no rows');

    /** @type {Record<string, any>} */
    const row = {};
    for (const c of cols) row[c] = it.get(c);

    const constructed = Number(row.constructed_unique ?? 0);
    const diff = Number(row.diff_count ?? -1);

    if (!(constructed > 0)) {
      throw new Error(
        `Expected constructed_unique > 0, got ${row.constructed_unique}`,
      );
    }
    if (diff !== 0) {
      throw new Error(`FiberElement imbalance: diff_count=${row.diff_count}`);
    }

    console.log(`[trace-processor smoke] PASS (tmp=${dir})`);
  } finally {
    engine?.[Symbol.dispose]?.();
  }
}

await main();
