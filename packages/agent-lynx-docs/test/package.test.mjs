// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { createProcessor } from '@mdx-js/mdx';
import matter from 'gray-matter';
import remarkCjkFriendly from 'remark-cjk-friendly';
import remarkGfm from 'remark-gfm';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
const processor = createProcessor({
  format: 'mdx',
  remarkPlugins: [remarkGfm, remarkCjkFriendly],
});

function walk(node, fn) {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
}

function resolveImport(file, specifier) {
  const target = resolve(dirname(file), specifier);
  return ['', '.ts', '.tsx', '/index.ts', '/index.tsx'].some((suffix) =>
    existsSync(target + suffix)
  );
}

test('the package ships every manifest resource and both locales share page routes', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.files, ['content', 'public', 'manifest.json']);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(manifest.schemaVersion, 1);
  for (const entry of [...manifest.sharedContent, ...manifest.publicAssets]) {
    assert.ok(existsSync(join(root, entry.source)), entry.source);
  }
  for (const section of manifest.sections) {
    const routes = Object.values(section.content).map((folder) =>
      readdirSync(join(root, folder)).filter((name) => name.endsWith('.mdx'))
        .sort()
    );
    assert.deepEqual(routes[0], routes[1]);
    for (const folder of Object.values(section.content)) {
      const meta = JSON.parse(
        readFileSync(join(root, folder, '_meta.json'), 'utf8'),
      );
      for (const item of meta) {
        assert.ok(existsSync(join(root, folder, item.name)), item.name);
      }
      assert.ok(
        !meta.some((item) => item.name === 'simulator.mdx'),
        'keep the unreleased Simulator out of navigation',
      );
      assert.ok(
        existsSync(join(root, folder, 'memory.mdx')),
        'preserve the former memory URL',
      );
    }
  }
});

test('MDX imports and local links resolve within the package without website aliases', () => {
  for (const name of readdirSync(join(root, 'content'), { recursive: true })) {
    if (extname(name) !== '.mdx') continue;
    const file = join(root, 'content', name);
    // Rspress consumes explicit heading IDs before MDX parsing. The preview
    // build validates these anchors; this pass checks imports and page links.
    const source = matter(readFileSync(file, 'utf8'), {
      engines: { javascript: () => ({}) },
    }).content
      .replace(/^(#{1,6} .+?)\s+\{#[^}]+\}\s*$/gm, '$1');
    const tree = processor.parse({ path: file, value: source });
    walk(tree, (node) => {
      if (node.type === 'mdxjsEsm') {
        for (const statement of node.data.estree.body) {
          if (statement.type !== 'ImportDeclaration') continue;
          const specifier = statement.source.value;
          assert.ok(
            !/^@(lynx\/|site\/|\/)/.test(specifier),
            `${name}: ${specifier}`,
          );
          if (specifier.startsWith('.')) {
            assert.ok(resolveImport(file, specifier), `${name}: ${specifier}`);
          }
        }
      }
      if (!['link', 'definition'].includes(node.type)) return;
      const url = node.url;
      if (/^(?:https?:|mailto:|#)/.test(url)) return;
      assert.ok(
        !url.startsWith('/'),
        `${name}: use a full website URL for ${url}`,
      );
      const target = resolve(dirname(file), url.split(/[?#]/)[0]);
      assert.ok(
        target.startsWith(join(root, 'content') + sep),
        `${name}: link escapes the package`,
      );
      assert.ok(existsSync(target), `${name}: ${url}`);
    });
  }
});

test('interactive examples include their downloadable resources', () => {
  const assets = join(root, 'public/ai/agent-lynx');
  for (
    const file of [
      'annotated-screenshot.html',
      'simulator-demo.html',
      'simulator/page-env.mjs',
      'simulator/bankcards-init-data.patch',
    ]
  ) {
    assert.ok(readFileSync(join(assets, file), 'utf8').length > 0, file);
  }
});
