#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
/**
 * Cross-project bundle-lever TRIAGE scanner (source-only, no build).
 *
 * The skill is measure-first per project — but you can't build a whole fleet to
 * decide where to look. This scans the *source* of one or more project dirs for
 * the cheap precursors of the three size levers, so you can rank which projects
 * deserve a real build+measure. A hit means "measure here", NOT "confirmed bloat".
 * Read references/cross-project-triage.md for how to interpret + its traps.
 *
 * Usage:
 *   node scan-levers.mjs <projectDir> [<projectDir> ...]   # scan given dirs
 *   node scan-levers.mjs --glob <reposRoot>                # scan each child dir
 *   node scan-levers.mjs ... --json out.json               # also write full JSON
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Background-only signatures live in signatures.cjs (overridable per stack / via the
// internal overlay). See that file for the jsb-backed-vs-console caveat.
import signatures from './signatures.cjs';

const { LEAK_PATTERNS } = signatures;
const GUARD_PATTERNS = [
  /__BACKGROUND__/,
  /__MAIN_THREAD__/,
  /__LEPUS__/,
  /__JS__/,
  /['"]background[ -]only['"]/,
];
const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts']);
const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const SKIP_DIR = new Set([
  'node_modules',
  'dist',
  'output',
  'lynx_output',
  '.rspeedy',
  '.git',
  'build',
  'coverage',
  '__tests__',
  'test',
  'tests',
]);
const BIG_IMG = 50 * 1024,
  BIG_B64 = 5000;

function walk(dir, depth, onFile) {
  if (depth > 12) return;
  let ents;
  try {
    ents = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    if (e.name.startsWith('.') && e.name !== '.') continue;
    if (SKIP_DIR.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, depth + 1, onFile);
    else if (e.isFile()) onFile(full);
  }
}

function scanProject(subdir) {
  const leakHits = {};
  const leakFiles = new Set();
  let guardedFiles = 0,
    scannedSrc = 0,
    b64Count = 0,
    b64Bytes = 0,
    bigImgCount = 0,
    bigImgBytes = 0;
  walk(subdir, 0, (full) => {
    const ext = path.extname(full);
    if (IMG_EXT.has(ext)) {
      let sz = 0;
      try {
        sz = statSync(full).size;
      } catch {}
      if (sz >= BIG_IMG) {
        bigImgCount++;
        bigImgBytes += sz;
      }
      return;
    }
    if (!SRC_EXT.has(ext)) return;
    let src;
    try {
      src = readFileSync(full, 'utf8');
    } catch {
      return;
    }
    if (src.length > 4 * 1024 * 1024) return;
    scannedSrc++;
    let fileLeaks = false;
    for (const [name, re] of LEAK_PATTERNS)
      if (re.test(src)) {
        leakHits[name] = (leakHits[name] || 0) + 1;
        fileLeaks = true;
      }
    if (fileLeaks) {
      leakFiles.add(full);
      if (GUARD_PATTERNS.some((g) => g.test(src))) guardedFiles++;
    }
    for (const m of src.matchAll(/data:[^;]+;base64,([A-Za-z0-9+/=]{1000,})/g))
      if (m[1].length >= BIG_B64) {
        b64Count++;
        b64Bytes += m[1].length;
      }
  });
  let sideEffects = 'missing';
  try {
    const j = JSON.parse(
      readFileSync(path.join(subdir, 'package.json'), 'utf8'),
    );
    if ('sideEffects' in j) sideEffects = JSON.stringify(j.sideEffects);
  } catch {}
  return {
    dir: subdir,
    scannedSrc,
    leakFiles: leakFiles.size,
    guardedFiles,
    guardRatio: leakFiles.size
      ? +(guardedFiles / leakFiles.size).toFixed(2)
      : null,
    leakHits,
    sideEffects,
    b64Count,
    b64KB: +(b64Bytes / 1024).toFixed(1),
    bigImgCount,
    bigImgKB: +(bigImgBytes / 1024).toFixed(1),
  };
}

const argv = process.argv.slice(2);
const jsonIdx = argv.indexOf('--json');
const jsonOut = jsonIdx >= 0 ? argv[jsonIdx + 1] : null;
let dirs = argv.filter(
  (a, i) => !a.startsWith('--') && argv[i - 1] !== '--json',
);
const globIdx = argv.indexOf('--glob');
if (globIdx >= 0) {
  const root = argv[globIdx + 1];
  dirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(root, e.name));
}
if (!dirs.length) {
  console.error(
    'usage: scan-levers.mjs <projectDir>... | --glob <reposRoot> [--json out.json]',
  );
  process.exit(1);
}

const results = dirs.map(scanProject);
const ranked = [...results]
  .filter((r) => r.leakFiles > 0)
  .sort(
    (a, b) =>
      (a.guardRatio ?? 1) - (b.guardRatio ?? 1) || b.leakFiles - a.leakFiles,
  );
const leakFreq = {};
for (const r of results)
  for (const k of Object.keys(r.leakHits)) leakFreq[k] = (leakFreq[k] || 0) + 1;
console.log('=== ranked leak candidates (low guardRatio first) ===');
for (const r of ranked.slice(0, 30))
  console.log(
    `${path.basename(r.dir).slice(0, 36).padEnd(36)} leakFiles=${String(r.leakFiles).padStart(3)} guard=${r.guardRatio} bigImg=${r.bigImgCount} sideFx=${r.sideEffects}`,
  );
console.log(
  '\n=== leak-API frequency (projects) ===',
  JSON.stringify(
    Object.fromEntries(Object.entries(leakFreq).sort((a, b) => b[1] - a[1])),
  ),
);
console.log(
  `projects=${results.length} withLeak=${results.filter((r) => r.leakFiles > 0).length} missingSideEffects=${results.filter((r) => r.sideEffects === 'missing').length}`,
);
if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({ results, leakFreq }, null, 2));
  console.log(`wrote ${jsonOut}`);
}
