// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { checkLynxmlSource } from '../scripts/check-lynxml.mjs';

const execFileAsync = promisify(execFile);
const packageRoot = new URL('../', import.meta.url);
const scriptPath = fileURLToPath(
  new URL('../scripts/check-lynxml.mjs', import.meta.url),
);

test('bundled example .lynxml artifacts pass static validation', async () => {
  const examplesDir = new URL('assets/examples/', packageRoot);
  const entries = (await readdir(examplesDir)).filter((name) =>
    name.endsWith('.lynxml')
  );
  assert.ok(entries.length >= 3);

  for (const name of entries) {
    const source = await readFile(new URL(name, examplesDir), 'utf8');
    assert.deepEqual(
      checkLynxmlSource(source),
      { ok: true, issues: [] },
      `${name} should have zero validation issues`,
    );
  }
});

test('bundled script preserves shebang, node-only imports, and third-party licenses', async () => {
  const scriptContent = await readFile(scriptPath, 'utf8');
  assert.ok(
    scriptContent.startsWith('#!/usr/bin/env node\n'),
    'bundled script must start with node shebang on line 1',
  );
  assert.match(scriptContent, /--- acorn \(MIT\) ---/);
  assert.match(scriptContent, /--- eslint-scope \(BSD-2-Clause\) ---/);
  assert.match(
    scriptContent,
    /--- estraverse & esrecurse \(BSD-2-Clause\) ---/,
  );

  const importSpecs = [
    ...scriptContent.matchAll(
      /^\s*import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gm,
    ),
  ].map((match) => match[1]);
  assert.ok(importSpecs.length > 0);
  for (const spec of importSpecs) {
    assert.ok(
      spec.startsWith('node:'),
      `unexpected runtime import "${spec}" in bundled script`,
    );
  }
});

test('validates .lynxml document envelopes, block order, and closing tags', () => {
  const validWithBomAndComments = [
    '\uFEFF<!doctype lynx>',
    '<!-- Header comment -->',
    '<lynx engine-version="4.2">',
    '<style>.page { display: flex; }</style>',
    '<script thread="main">',
    'const page = __CreatePage("0", 0);',
    'void page;',
    '</script>',
    '</lynx>',
    '',
  ].join('\n');
  assert.deepEqual(checkLynxmlSource(validWithBomAndComments), {
    ok: true,
    issues: [],
  });

  const invalidCases = [
    {
      name: 'XML declaration',
      source:
        '<?xml version="1.0"?>\n<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">void 0;</script></lynx>',
      pattern: /XML declarations/,
    },
    {
      name: 'missing doctype',
      source:
        '<lynx engine-version="4.2"><script thread="main">void 0;</script></lynx>',
      pattern: /<!doctype lynx>/,
    },
    {
      name: 'empty engine-version',
      source:
        '<!doctype lynx>\n<lynx engine-version=""><script thread="main">void 0;</script></lynx>',
      pattern: /engine-version/,
    },
    {
      name: 'CDATA section',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main"><![CDATA[const x = 1;]]></script></lynx>',
      pattern: /CDATA/,
    },
    {
      name: 'UI markup inside root',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><view></view><script thread="main">void 0;</script></lynx>',
      pattern: /Unsupported top-level element `<view>`/,
    },
    {
      name: 'out-of-order style after main script',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">void 0;</script><style></style></lynx>',
      pattern: /Out-of-order/,
    },
    {
      name: 'missing main script',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><style></style></lynx>',
      pattern: /Missing required `<script thread="main">`/,
    },
    {
      name: 'empty main script',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">  \n </script></lynx>',
      pattern: /`<script thread="main">` must not be empty/,
    },
    {
      name: 'literal closing script tag inside string',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">const s = "</script>";</script></lynx>',
      pattern: /Unexpected text content/,
    },
    {
      name: 'closing script tag with whitespace before >',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">void 0;</script ></lynx>',
      pattern: /Closing tag `<\/script>` must not contain whitespace/,
    },
    {
      name: 'closing lynx tag with whitespace before >',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main">void 0;</script></lynx >',
      pattern: /Closing tag `<\/lynx>` must not contain whitespace/,
    },
    {
      name: 'self-closing script tag',
      source:
        '<!doctype lynx>\n<lynx engine-version="4.2"><script thread="main"/></lynx>',
      pattern: /Self-closing tags/,
    },
  ];

  for (const { name, source, pattern } of invalidCases) {
    const result = checkLynxmlSource(source);
    assert.equal(result.ok, false, `${name} must fail`);
    assert.equal(result.issues[0]?.code, 'envelope-error');
    assert.match(result.issues[0]?.message ?? '', pattern);
  }
});

test('flags undeclared browser, Node, and unsupported JS globals with line, column, and hints', () => {
  const source = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">',
    'const root = document.getElementById("app");',
    'Intl.NumberFormat().format(1);',
    'new Float16Array(4);',
    'this.performance.now();',
    'void root;',
    '</script>',
    '<script thread="background">',
    'const startedAt = performance.now();',
    'const viaGlobal = globalThis.performance.now();',
    'const { performance: destructuredPerf } = globalThis;',
    'const hasWin = typeof window !== "undefined";',
    'Iterator.from([]);',
    'void [startedAt, viaGlobal, destructuredPerf, hasWin];',
    '</script>',
    '</lynx>',
  ].join('\n');

  const result = checkLynxmlSource(source);
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map(({ line, column, code, thread, symbol }) => ({
      line,
      column,
      code,
      thread,
      symbol,
    })),
    [
      {
        line: 4,
        column: 14,
        code: 'undeclared-global',
        thread: 'main',
        symbol: 'document',
      },
      {
        line: 5,
        column: 1,
        code: 'undeclared-global',
        thread: 'main',
        symbol: 'Intl',
      },
      {
        line: 6,
        column: 5,
        code: 'undeclared-global',
        thread: 'main',
        symbol: 'Float16Array',
      },
      {
        line: 7,
        column: 1,
        code: 'undeclared-global',
        thread: 'main',
        symbol: 'performance',
      },
      {
        line: 11,
        column: 19,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'performance',
      },
      {
        line: 12,
        column: 19,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'performance',
      },
      {
        line: 13,
        column: 9,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'performance',
      },
      {
        line: 14,
        column: 23,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'window',
      },
      {
        line: 15,
        column: 1,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'Iterator',
      },
    ],
  );
  assert.match(result.issues[4]?.hint ?? '', /Date\.now\(\)/);
  assert.match(result.issues[4]?.hint ?? '', /requestAnimationFrame/);
  assert.match(result.issues[4]?.hint ?? '', /lynx\.performance/);
});

test('enforces thread boundaries, forbidden compiler PAPIs, and Fiber PAPI calibration', () => {
  const source = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">',
    'const page = __CreatePage("0", 0);',
    'const width = __GetComputedStyleByKey(page, "width");',
    '__AddEvent(page, "bindEvent", "tap", "onTap");',
    'fetch("https://example.com/data.json");',
    '__CreateGestureDetector();',
    '__GetComputedStyles(page);',
    'processData({});',
    'void width;',
    '</script>',
    '<script thread="background">',
    'fetch("https://example.com/data.json");',
    'const bridge = NativeModules.bridge;',
    'const ratio = globalThis.SystemInfo.pixelRatio;',
    'const el = lynx.getElementById("card");',
    'void [bridge, ratio, el];',
    '__FlushElementTree();',
    'globalThis.fetch("https://example.com/data.json");',
    'getElementById("card");',
    'new URL("https://example.com/data.json");',
    'TextCodecHelper.encode("x");',
    'new TextDecoder();',
    'void LynxJSBI;',
    '</script>',
    '</lynx>',
  ].join('\n');

  const result = checkLynxmlSource(source);
  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map(({ line, code, thread, symbol }) => ({
      line,
      code,
      thread,
      symbol,
    })),
    [
      {
        line: 6,
        code: 'forbidden-api',
        thread: 'main',
        symbol: '__AddEvent',
      },
      {
        line: 7,
        code: 'wrong-thread-global',
        thread: 'main',
        symbol: 'fetch',
      },
      {
        line: 8,
        code: 'undeclared-global',
        thread: 'main',
        symbol: '__CreateGestureDetector',
      },
      {
        line: 9,
        code: 'undeclared-global',
        thread: 'main',
        symbol: '__GetComputedStyles',
      },
      {
        line: 10,
        code: 'undeclared-global',
        thread: 'main',
        symbol: 'processData',
      },
      {
        line: 19,
        code: 'wrong-thread-global',
        thread: 'background',
        symbol: '__FlushElementTree',
      },
      {
        line: 20,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'fetch',
      },
      {
        line: 21,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'getElementById',
      },
      {
        line: 22,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'URL',
      },
      {
        line: 23,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'TextCodecHelper',
      },
      {
        line: 24,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'TextDecoder',
      },
      {
        line: 25,
        code: 'undeclared-global',
        thread: 'background',
        symbol: 'LynxJSBI',
      },
    ],
  );
  assert.match(result.issues[6]?.hint ?? '', /bare identifier/);
  assert.doesNotMatch(result.issues[10]?.hint ?? '', /TextCodecHelper/);
});

test('models background factory wrapper parameters, this receiver, and brace boundaries', () => {
  const validBg = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">void 0;</script>',
    '<script thread="background">',
    'this.lynx.getCoreContext();',
    'console.log(new.target);',
    'var navigator = { userAgent: "custom" };',
    'if (navigator.userAgent === "") return;',
    '</script>',
    '</lynx>',
  ].join('\n');
  assert.deepEqual(checkLynxmlSource(validBg), { ok: true, issues: [] });

  const invalidBgThisWrite = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">void 0;</script>',
    '<script thread="background">',
    'this.performance = { now: Date.now };',
    'performance.now();',
    '</script>',
    '</lynx>',
  ].join('\n');
  const bgThisResult = checkLynxmlSource(invalidBgThisWrite);
  assert.equal(bgThisResult.ok, false);
  assert.equal(bgThisResult.issues[0]?.symbol, 'performance');

  const fetchCollision = checkLynxmlSource(
    [
      '<!doctype lynx>',
      '<lynx engine-version="4.2">',
      '<script thread="main">void 0;</script>',
      '<script thread="background">',
      'const fetch = () => {};',
      'fetch();',
      '</script>',
      '</lynx>',
    ].join('\n'),
  );
  assert.equal(fetchCollision.ok, false);
  assert.equal(fetchCollision.issues[0]?.code, 'syntax-error');
  assert.equal(fetchCollision.issues[0]?.symbol, 'fetch');
  assert.match(fetchCollision.issues[0]?.hint ?? '', /app-service\.js/);

  const braceEscape = checkLynxmlSource(
    [
      '<!doctype lynx>',
      '<lynx engine-version="4.2">',
      '<script thread="main">void 0;</script>',
      '<script thread="background">',
      '}); (function(){',
      '</script>',
      '</lynx>',
    ].join('\n'),
  );
  assert.equal(braceEscape.ok, false);
  assert.equal(braceEscape.issues[0]?.code, 'syntax-error');
});

test('supports lexical shadowing and standard globalThis / main-thread global definitions', () => {
  const validSource = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">',
    'Object.assign(globalThis, {',
    '  processData(data) { return data; },',
    '});',
    'Object.defineProperty(globalThis, "definedSlot", { value: 1 });',
    'globalThis.extraState = 2;',
    'globalThis.lazyCount ??= 3;',
    'var classicState = globalThis.classicState ?? 0;',
    'function classicHelper() { return 4; }',
    'function localShadows(window) {',
    '  const { performance } = { performance: 5 };',
    '  return window + performance;',
    '}',
    'processData({',
    '  sum: definedSlot + extraState + lazyCount + classicState + globalThis.classicHelper() + localShadows(1),',
    '});',
    '</script>',
    '</lynx>',
  ].join('\n');

  assert.deepEqual(checkLynxmlSource(validSource), { ok: true, issues: [] });

  const selfReadInvalid = checkLynxmlSource(
    [
      '<!doctype lynx>',
      '<lynx engine-version="4.2">',
      '<script thread="main">',
      'globalThis.performance ||= globalThis.performance.now();',
      'var __AddEvent;',
      '</script>',
      '</lynx>',
    ].join('\n'),
  );
  assert.equal(selfReadInvalid.ok, false);
  assert.deepEqual(
    selfReadInvalid.issues.map(({ line, code, symbol }) => ({
      line,
      code,
      symbol,
    })),
    [
      { line: 4, code: 'undeclared-global', symbol: 'performance' },
      { line: 5, code: 'forbidden-api', symbol: '__AddEvent' },
    ],
  );
});

test('rejects ESM import/export, dynamic import(...), with, and supports CLI JSON mode', async () => {
  const staticImport = checkLynxmlSource(
    [
      '<!doctype lynx>',
      '<lynx engine-version="4.2">',
      '<script thread="main">',
      'import { helper } from "./helper.js";',
      'helper();',
      '</script>',
      '</lynx>',
    ].join('\n'),
  );
  assert.equal(staticImport.ok, false);
  assert.equal(staticImport.issues[0]?.code, 'unsupported-syntax');

  const dynamicImportAndWith = checkLynxmlSource(
    [
      '<!doctype lynx>',
      '<lynx engine-version="4.2">',
      '<script thread="main">void 0;</script>',
      '<script thread="background">',
      'with ({}) {}',
      'import(performance.now());',
      '</script>',
      '</lynx>',
    ].join('\n'),
  );
  assert.equal(dynamicImportAndWith.ok, false);
  assert.deepEqual(
    dynamicImportAndWith.issues.map(({ code, symbol }) => ({ code, symbol })),
    [
      { code: 'unsupported-syntax', symbol: undefined },
      { code: 'unsupported-syntax', symbol: undefined },
      { code: 'undeclared-global', symbol: 'performance' },
    ],
  );

  const counterPath = fileURLToPath(
    new URL('assets/examples/counter.lynxml', packageRoot),
  );
  const { stdout } = await execFileAsync(process.execPath, [
    scriptPath,
    '--json',
    counterPath,
  ]);
  assert.equal(JSON.parse(stdout).ok, true);

  const badDoc = [
    '<!doctype lynx>',
    '<lynx engine-version="4.2">',
    '<script thread="main">void 0;</script>',
    '<script thread="background">performance.now();</script>',
    '</lynx>',
  ].join('\n');

  await assert.rejects(
    () =>
      new Promise((resolvePromise, rejectPromise) => {
        const child = execFile(
          process.execPath,
          [scriptPath, '--json', '-'],
          (error, out) => {
            if (error) {
              error.stdout = out;
              rejectPromise(error);
              return;
            }
            resolvePromise(out);
          },
        );
        child.stdin?.end(badDoc);
      }),
    (error) => {
      assert.equal(error.code, 1);
      assert.equal(JSON.parse(error.stdout).ok, false);
      return true;
    },
  );
});
