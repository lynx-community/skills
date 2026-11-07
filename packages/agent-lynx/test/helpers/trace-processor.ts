// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

// The real WASM engine is a development dependency. Seed task-local caches from
// it so tests exercise real SQL and cached module loading without a registry.
export async function installTraceProcessorFixture(
  directory: string,
): Promise<void> {
  const entry = fileURLToPath(import.meta.resolve('@lynx-js/trace-processor'));
  const processorRoot = path.resolve(path.dirname(entry), '..');
  const immerRoot = path.dirname(
    createRequire(entry).resolve('immer/package.json'),
  );
  for (
    const [name, source] of [
      ['@lynx-js/trace-processor', processorRoot],
      ['immer', immerRoot],
    ] as const
  ) {
    const destination = path.join(directory, 'node_modules', name);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.cp(source, destination, { recursive: true, dereference: true });
  }
}

export async function prepareTraceProcessorCache(
  root: string,
  registry?: string,
): Promise<NodeJS.ProcessEnv> {
  const env = { AGENT_LYNX_CACHE_DIR: root };
  const key = createHash('sha256').update(JSON.stringify({
    packages: [['@lynx-js/trace-processor', '0.0.1']],
    registry: registry ?? null,
    platform: process.platform,
    arch: process.arch,
    abi: process.versions.modules,
  })).digest('hex');
  const directory = path.join(root, 'npm', key);
  await installTraceProcessorFixture(directory);
  await fs.writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({
      private: true,
      dependencies: { '@lynx-js/trace-processor': '0.0.1' },
    }),
  );
  return { ...env, CODEX_SANDBOX_NETWORK_DISABLED: '1' };
}

export function useTraceProcessorFixture(registry?: string): void {
  let root: string;
  const original = process.env['AGENT_LYNX_CACHE_DIR'];
  before(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-lynx-processor-'));
    await prepareTraceProcessorCache(root, registry);
    process.env['AGENT_LYNX_CACHE_DIR'] = root;
  });
  after(async () => {
    if (original === undefined) {
      delete process.env['AGENT_LYNX_CACHE_DIR'];
    } else process.env['AGENT_LYNX_CACHE_DIR'] = original;
    if (root) await fs.rm(root, { recursive: true, force: true });
  });
}
