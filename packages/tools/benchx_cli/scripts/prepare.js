// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createWriteStream } from 'node:fs';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import * as tar from 'tar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgRoot = join(__dirname, '..');

// Pin to a known-good version to avoid upstream instability.
const BENCHX_VERSION = 'benchx_cli-202602132156';
const REPO = 'lynx-community/benchx_cli';

function platformAsset() {
  if (process.platform === 'linux' && process.arch === 'x64') {
    return { dir: 'linux-x64', asset: 'benchx_cli_Linux_x86_64.tar.gz' };
  }
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return { dir: 'darwin-arm64', asset: 'benchx_cli_Darwin_arm64.tar.gz' };
  }
  return null;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, outPath) {
  const res = await fetch(url, {
    headers: {
      // allow GitHub to apply proper content-type; keep it minimal
      'User-Agent': '@lynx-js/benchx-cli prepare',
    },
  });
  if (!res.ok)
    throw new Error(
      `Failed to download ${url}: ${res.status} ${res.statusText}`,
    );
  await pipeline(res.body, createWriteStream(outPath));
}

async function main() {
  const info = platformAsset();
  if (!info) {
    console.log(
      `[@lynx-js/benchx-cli] skip: unsupported platform ${process.platform}/${process.arch}`,
    );
    return;
  }

  const vendorDir = join(pkgRoot, 'vendor', info.dir);
  const binPath = join(vendorDir, 'benchx_cli');
  const stampPath = join(vendorDir, `.stamp-${BENCHX_VERSION}`);

  await mkdir(vendorDir, { recursive: true });

  if ((await exists(binPath)) && (await exists(stampPath))) {
    console.log(`[@lynx-js/benchx-cli] cached: ${binPath}`);
    return;
  }

  const url = `https://github.com/${REPO}/releases/download/${BENCHX_VERSION}/${info.asset}`;
  const tgzPath = join(vendorDir, info.asset);

  console.log(`[@lynx-js/benchx-cli] downloading ${url}`);
  await download(url, tgzPath);

  // Extract into vendorDir. The binary may be at root or inside folders.
  await tar.x({ file: tgzPath, cwd: vendorDir });

  // Find extracted benchx_cli
  const { default: fs } = await import('node:fs');
  const found = [];
  /** @param {string} dir */
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && ent.name === 'benchx_cli') found.push(p);
    }
  }
  walk(vendorDir);

  const extracted = found[0];
  if (!extracted)
    throw new Error(`benchx_cli not found after extracting ${tgzPath}`);

  if (extracted !== binPath) {
    fs.copyFileSync(extracted, binPath);
  }
  fs.chmodSync(binPath, 0o755);

  await writeFile(stampPath, new Date().toISOString());
  console.log(`[@lynx-js/benchx-cli] ready: ${binPath}`);
}

await main();
