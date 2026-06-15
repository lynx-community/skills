// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// Import-chain analysis of the de-concat main-thread.js:
// list modules, sizes, background-only flags, and importer edges (who pulls each module).
import fs from 'node:fs';

const file = process.argv[2];
const src = fs.readFileSync(file, 'utf8');

// Split into modules by the rspack module header: "(react:...)/path"( ...args... ) {
// Distinguish from __webpack_require__("path") by requiring an OPEN paren right after the quote.
const HEADER = /"(\(react:(?:main-thread|background)\)\/[^"]+)"\(/g;
const heads = [];
for (const m of src.matchAll(HEADER))
  heads.push({ path: m[1], start: m.index });
const mods = heads.map((h, i) => ({
  path: h.path,
  body: src.slice(
    h.start,
    i + 1 < heads.length ? heads[i + 1].start : src.length,
  ),
}));

// Background-only signatures (basename + content) live in signatures.cjs
// (overridable per stack / via the internal overlay).
import signatures from './signatures.cjs';

const { BG_NAME, BG_CONTENT } = signatures;
const REQ = /[a-zA-Z_$]\("(\(react:(?:main-thread|background)\)\/[^"]+)"\)/g;

const importers = new Map(); // path -> Set of modules that require it
for (const mod of mods) {
  const seen = new Set();
  for (const r of mod.body.matchAll(REQ)) {
    const dep = r[1];
    if (dep === mod.path) continue;
    if (!importers.has(dep)) importers.set(dep, new Set());
    importers.get(dep).add(mod.path);
    seen.add(dep);
  }
  mod.deps = seen;
  mod.size = mod.body.length;
  const base = mod.path.split('/').pop();
  mod.bgName = BG_NAME.test(base);
  mod.bgContent = BG_CONTENT.test(mod.body);
}

const isMT = (p) => p.startsWith('(react:main-thread)');
const mtMods = mods.filter((x) => isMT(x.path));
console.log(
  `=== main-thread modules: ${mtMods.length}, total ${(mtMods.reduce((a, b) => a + b.size, 0) / 1024).toFixed(0)} kB ===`,
);

// Background-only modules that LEAKED into main-thread, by size.
const leaks = mtMods
  .filter((x) => x.bgName || x.bgContent)
  .sort((a, b) => b.size - a.size);
console.log(
  `\n=== background-only modules in MAIN-THREAD (top 30 by size) ===`,
);
for (const l of leaks.slice(0, 30)) {
  const imps = [...(importers.get(l.path) || [])]
    .map((p) => p.replace('(react:main-thread)/', ''))
    .slice(0, 3);
  console.log(
    `${(l.size / 1024).toFixed(1).padStart(7)}kB ${l.bgContent ? 'C' : ' '}${l.bgName ? 'N' : ' '}  ${l.path.replace('(react:main-thread)/', '')}`,
  );
  console.log(
    `          ← ${imps.join(' | ') || '(no MT importer — entry/root)'}`,
  );
}
console.log(
  `\nleak total: ${(leaks.reduce((a, b) => a + b.size, 0) / 1024).toFixed(1)} kB across ${leaks.length} modules`,
);
