// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs';

const src = fs.readFileSync(process.argv[2], 'utf8');
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
const REQ = /[a-zA-Z_$]\("(\(react:(?:main-thread|background)\)\/[^"]+)"\)/g;
const isMT = (p) => p.startsWith('(react:main-thread)');
const mt = mods.filter((x) => isMT(x.path));
for (const mod of mt) {
  mod.size = mod.body.length;
  mod.deps = new Set();
  for (const r of mod.body.matchAll(REQ))
    if (isMT(r[1]) && r[1] !== mod.path) mod.deps.add(r[1]);
}
const importers = new Map();
for (const mod of mt)
  for (const d of mod.deps) {
    if (!importers.has(d)) importers.set(d, new Set());
    importers.get(d).add(mod.path);
  }

// Real package/module path = AFTER the last /node_modules/ (strips the pnpm peer-dep hash dir),
// else the app/lib source path. Apply signatures to THIS, never the raw pnpm path.
const real = (p) => {
  const s = p.replace('(react:main-thread)/', '');
  const i = s.lastIndexOf('/node_modules/');
  return i >= 0 ? s.slice(i + 14) : s.replace('../../', '');
};

// Background-only packages + app-module signatures live in signatures.cjs
// (overridable per stack / via the internal overlay).
import signatures from './signatures.cjs';

const { BG_PACKAGES: BG, BG_APP } = signatures;
const flag = (p) => {
  const r = real(p);
  return (
    BG.test(r) ||
    (/\/(request|monitor|report|btm|log|tracker)\//i.test(`/${r}`) &&
      BG_APP.test(r)) ||
    BG_APP.test(r.split('/').pop())
  );
};
const short = (p) => real(p);
const bg = new Set(mt.filter((x) => flag(x.path)).map((x) => x.path));

let pureBg = 0,
  boundary = 0;
const bnd = [];
for (const p of bg) {
  const imps = [...(importers.get(p) || [])];
  const renderImps = imps.filter((i) => !bg.has(i));
  const mod = mt.find((x) => x.path === p);
  if (renderImps.length === 0)
    pureBg += mod.size; // only bg importers → free shake
  else {
    boundary += mod.size;
    bnd.push({ p, size: mod.size, renderImps });
  } // render imports it → cut here
}
console.log(
  `MT total: ${(mt.reduce((a, b) => a + b.size, 0) / 1024).toFixed(0)} kB`,
);
console.log(
  `background-only modules in MT: ${bg.size}, ${([...bg].reduce((a, p) => a + mt.find((x) => x.path === p).size, 0) / 1024).toFixed(1)} kB`,
);
console.log(
  `  • pure-background subtree (only bg importers → shakes for free once boundary cut): ${(pureBg / 1024).toFixed(1)} kB`,
);
console.log(
  `  • boundary modules (a RENDER module imports them → the cut points): ${(boundary / 1024).toFixed(1)} kB\n`,
);
console.log(
  `=== CUT POINTS: render module → background-only module (guard/split these) ===`,
);
for (const b of bnd.sort((a, b) => b.size - a.size).slice(0, 18)) {
  console.log(`${(b.size / 1024).toFixed(1).padStart(6)}kB  ${short(b.p)}`);
  for (const ri of b.renderImps.slice(0, 2))
    console.log(`         ← ${short(ri)}`);
}
