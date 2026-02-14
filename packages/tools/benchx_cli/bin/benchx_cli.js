#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function platformDir() {
  if (process.platform === 'linux' && process.arch === 'x64')
    return 'linux-x64';
  if (process.platform === 'darwin' && process.arch === 'arm64')
    return 'darwin-arm64';
  return null;
}

const plat = platformDir();
if (!plat) {
  console.error(
    `benchx_cli is not supported on ${process.platform}/${process.arch}`,
  );
  process.exit(1);
}

const bin = join(__dirname, '..', 'vendor', plat, 'benchx_cli');
if (!existsSync(bin)) {
  console.error(
    `benchx_cli binary not found at ${bin}. Did you run pnpm install (prepare scripts enabled)?`,
  );
  process.exit(1);
}

const child = spawn(bin, process.argv.slice(2), { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
