// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

import { buildPlugin } from '../src/lib.ts';

const tempDirs = [];

async function makePlugin(pkg, { withSkills = false, withMcp = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'build-plugin-codex-'));
  tempDirs.push(dir);

  await writeFile(
    join(dir, 'package.json'),
    `${JSON.stringify(
      { name: '@lynx-js/ai-plugin-lynx-demo', version: '1.2.3', ...pkg },
      null,
      2,
    )}\n`,
  );

  if (withSkills) {
    await mkdir(join(dir, 'skills'), { recursive: true });
  }
  if (withMcp) {
    await writeFile(join(dir, '.mcp.json'), '{}\n');
  }

  return dir;
}

function codexManifestPath(dir) {
  return join(dir, '.codex-plugin', 'plugin.json');
}

function claudeManifestPath(dir) {
  return join(dir, '.claude-plugin', 'plugin.json');
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf-8'));
}

after(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

test('emits a Codex manifest when codexPlugin is declared', async () => {
  const dir = await makePlugin({
    description: 'Demo plugin for Lynx',
    keywords: ['lynx', 'demo'],
    license: 'Apache-2.0',
    homepage: 'https://lynxjs.org',
    repository: {
      type: 'git',
      url: 'https://github.com/lynx-community/skills',
    },
    author: { name: 'lynx', url: 'https://lynxjs.org' },
    claudePlugin: { category: 'development' },
    codexPlugin: {
      category: 'Development',
      interface: {
        displayName: 'Demo Suite',
        capabilities: ['Interactive', 'Read', 'Write', 'MCP'],
        brandColor: '#00A6FF',
      },
    },
  });

  await buildPlugin(dir);

  const manifest = await readJson(codexManifestPath(dir));

  assert.equal(manifest.name, 'lynx-demo');
  assert.equal(manifest.version, '1.2.3');
  assert.equal(manifest.description, 'Demo plugin for Lynx');
  assert.deepEqual(manifest.author, {
    name: 'lynx',
    url: 'https://lynxjs.org',
  });
  assert.deepEqual(manifest.keywords, ['lynx', 'demo']);
  assert.equal(manifest.homepage, 'https://lynxjs.org');
  assert.equal(manifest.license, 'Apache-2.0');
  assert.deepEqual(manifest.repository, {
    type: 'git',
    url: 'https://github.com/lynx-community/skills',
  });

  // Declared interface fields win over the generated defaults.
  assert.equal(manifest.interface.displayName, 'Demo Suite');
  assert.deepEqual(manifest.interface.capabilities, [
    'Interactive',
    'Read',
    'Write',
    'MCP',
  ]);
  assert.equal(manifest.interface.brandColor, '#00A6FF');

  // Generated defaults still fill in everything that was not declared.
  assert.equal(manifest.interface.category, 'Development');
  assert.equal(manifest.interface.developerName, 'lynx');
  assert.equal(manifest.interface.shortDescription, 'Demo plugin for Lynx');
  assert.equal(manifest.interface.longDescription, 'Demo plugin for Lynx');

  // defaultPrompt is generated from the package name, not from the
  // displayName override.
  assert.deepEqual(manifest.interface.defaultPrompt, [
    'Help me build a Lynx Demo feature.',
    'Review this Lynx Demo change.',
    'Debug this Lynx Demo issue.',
  ]);

  // The Claude manifest keeps being written alongside the Codex one.
  assert.deepEqual(await readJson(claudeManifestPath(dir)), {
    name: 'lynx-demo',
    version: '1.2.3',
    description: 'Demo plugin for Lynx',
  });
});

test('emits a Codex manifest when files lists .codex-plugin', async () => {
  const dir = await makePlugin({ files: ['.codex-plugin'] });

  await buildPlugin(dir);

  const manifest = await readJson(codexManifestPath(dir));

  assert.equal(manifest.name, 'lynx-demo');
  assert.equal(manifest.description, '');
  assert.deepEqual(manifest.author, { name: 'lynx' });
  assert.deepEqual(manifest.keywords, ['lynx', 'reactlynx', 'lynx-js']);
  assert.equal(manifest.interface.displayName, 'Lynx Demo');
  assert.equal(manifest.interface.category, 'Development');
  assert.equal(manifest.interface.shortDescription, 'Lynx Demo plugin');
  assert.equal(
    manifest.interface.longDescription,
    'Lynx Demo plugin with bundled skills and tool integrations.',
  );
  assert.deepEqual(manifest.interface.capabilities, [
    'Interactive',
    'Read',
    'Write',
  ]);

  // Optional fields stay absent instead of serializing as null.
  assert.equal('homepage' in manifest, false);
  assert.equal('license' in manifest, false);
  assert.equal('repository' in manifest, false);
  assert.equal('skills' in manifest, false);
  assert.equal('mcpServers' in manifest, false);
});

test('skips the Codex manifest when the plugin does not opt in', async () => {
  const dir = await makePlugin({
    description: 'Claude only',
    files: ['.claude-plugin'],
  });

  await buildPlugin(dir);

  assert.equal(existsSync(codexManifestPath(dir)), false);

  // .claude-plugin is unaffected by the Codex gate.
  assert.deepEqual(await readJson(claudeManifestPath(dir)), {
    name: 'lynx-demo',
    version: '1.2.3',
    description: 'Claude only',
  });
});

test('references bundled skills and MCP servers when present', async () => {
  const dir = await makePlugin(
    { codexPlugin: {} },
    { withSkills: true, withMcp: true },
  );

  await buildPlugin(dir);

  const manifest = await readJson(codexManifestPath(dir));

  assert.equal(manifest.skills, './skills/');
  assert.equal(manifest.mcpServers, './.mcp.json');
});

test('merges codexPlugin.manifest into the generated manifest', async () => {
  const dir = await makePlugin({
    codexPlugin: {
      interface: { displayName: 'Generated' },
      manifest: {
        experimental: { sandbox: 'workspace-write' },
        interface: { websiteURL: 'https://lynxjs.org' },
      },
    },
  });

  await buildPlugin(dir);

  const manifest = await readJson(codexManifestPath(dir));

  assert.deepEqual(manifest.experimental, { sandbox: 'workspace-write' });
  // manifest.interface is merged into, not replacing, the generated interface.
  assert.equal(manifest.interface.websiteURL, 'https://lynxjs.org');
  assert.equal(manifest.interface.displayName, 'Generated');
  assert.deepEqual(manifest.interface.capabilities, [
    'Interactive',
    'Read',
    'Write',
  ]);
});

test('falls back to the Claude category and capitalizes it', async () => {
  const dir = await makePlugin({
    claudePlugin: { category: 'development' },
    codexPlugin: {},
  });

  await buildPlugin(dir);

  const manifest = await readJson(codexManifestPath(dir));

  assert.equal(manifest.interface.category, 'Development');
});

test('writes manifests as pretty JSON with a trailing newline', async () => {
  const dir = await makePlugin({ codexPlugin: {} });

  await buildPlugin(dir);

  const raw = await readFile(codexManifestPath(dir), 'utf-8');

  assert.equal(raw.endsWith('}\n'), true);
  assert.equal(raw.includes('\n  "name": "lynx-demo",'), true);
});

test('rejects packages that are not plugins', async () => {
  const dir = await makePlugin({ name: '@lynx-js/skill-lynx-demo' });

  await assert.rejects(
    () => buildPlugin(dir),
    /Package is not a plugin/,
    'expected buildPlugin to reject a non-plugin package',
  );
  assert.equal(existsSync(codexManifestPath(dir)), false);
  assert.equal(existsSync(claudeManifestPath(dir)), false);
});
