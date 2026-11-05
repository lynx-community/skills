// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

export interface TasmPackage {
  name: string;
  version: string;
  registry: string;
  integrity: string;
}

export const PUBLIC_TASM_PACKAGE: Readonly<TasmPackage> = {
  name: '@lynx-js/tasm',
  version: '0.0.53',
  registry: 'https://registry.npmjs.org',
  integrity:
    'sha512-P4b16NDniUC5IQ5lHxXvXFb+rK9nQtFMBNUXV2UQydIJlxun1XKWZk6Rm/GoKTiQ01rBvxctoxyKu7sLPo0BOw==',
};

export interface TasmRuntimeOptions {
  package?: Readonly<TasmPackage>;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
}

const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const MAX_TAR_BYTES = 128 * 1024 * 1024;

export function validateTasmVersion(version: string): string {
  if (
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\da-zA-Z]+(?:[.-][\da-zA-Z]+)*)?$/u
      .test(version)
  ) {
    throw new Error(
      'TASM codec version must be an exact version, such as 0.0.53; tags, ranges and URLs are not supported.',
    );
  }
  return version;
}

function verifyIntegrity(archive: Buffer, integrity: string): void {
  const actual = `sha512-${
    createHash('sha512').update(archive).digest('base64')
  }`;
  if (actual !== integrity) {
    throw new Error('TASM package SHA-512 integrity mismatch.');
  }
}

async function readIfPresent(file: string): Promise<Buffer | undefined> {
  try {
    return await fs.readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function atomicWrite(file: string, content: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { flag: 'wx', mode: 0o600 });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function download(
  url: string,
  limit: number,
  options: TasmRuntimeOptions,
): Promise<Buffer> {
  if ((options.env ?? process.env)['CODEX_SANDBOX_NETWORK_DISABLED'] === '1') {
    throw new Error(
      'TASM codec is not cached and network access is disabled. Populate the codec cache with network access first.',
    );
  }
  const response = await (options.fetchImpl ?? fetch)(url, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok || !response.body) {
    await response.body?.cancel();
    throw new Error(
      `Cannot download TASM package: HTTP ${response.status} (${url}).`,
    );
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        throw new Error('TASM download exceeds the size limit.');
      }
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

// Only read these two regular files. No archive path is ever used as a disk path,
// and no package scripts, native addons or transitive dependencies are installed.
function unpackCodec(archive: Buffer, pkg: TasmPackage): Buffer {
  const tar = gunzipSync(archive, { maxOutputLength: MAX_TAR_BYTES });
  const files = new Map<string, Buffer>();
  for (let offset = 0; offset < tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.length !== 512) throw new Error('Truncated TASM tar header.');
    if (header.every(byte => byte === 0)) break;
    const field = (start: number, end: number): string =>
      header.subarray(start, end).toString('utf8').replace(/\0.*$/su, '');
    const prefix = field(345, 500);
    const name = `${prefix ? `${prefix}/` : ''}${field(0, 100)}`;
    const sizeField = field(124, 136).trim();
    if (!/^[0-7]+$/u.test(sizeField)) {
      throw new Error('Invalid TASM tar entry size.');
    }
    const size = Number.parseInt(sizeField, 8);
    const end = offset + 512 + size;
    if (!Number.isSafeInteger(size) || end > tar.length) {
      throw new Error('Truncated TASM tar entry.');
    }
    if (name === 'package/lepus.js' || name === 'package/package.json') {
      if ((header[156] !== 0 && header[156] !== 48) || files.has(name)) {
        throw new Error(`Invalid or duplicate TASM package file: ${name}.`);
      }
      files.set(name, tar.subarray(offset + 512, end));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  const manifest = JSON.parse(
    files.get('package/package.json')?.toString('utf8') ?? 'null',
  ) as TasmPackage | null;
  const codec = files.get('package/lepus.js');
  if (
    manifest?.name !== pkg.name || manifest.version !== pkg.version
    || !codec?.length
  ) {
    throw new Error(
      `Expected ${pkg.name}@${pkg.version} with a self-contained lepus.js codec.`,
    );
  }
  return codec;
}

export async function resolveTasmModule(
  options: TasmRuntimeOptions = {},
  requestedVersion?: string,
): Promise<{ file: string; package: Readonly<TasmPackage>; }> {
  const defaults = options.package ?? PUBLIC_TASM_PACKAGE;
  const version = validateTasmVersion(requestedVersion ?? defaults.version);
  const env = options.env ?? process.env;
  const cacheRoot = path.resolve(
    env['AGENT_LYNX_TASM_CACHE_DIR']
      || path.join(
        env['XDG_CACHE_HOME'] || path.join(os.homedir(), '.cache'),
        'agent-lynx',
        'tasm',
      ),
  );
  const key = createHash('sha256').update(
    `${defaults.registry}/${defaults.name}@${version}`,
  ).digest('hex');
  const directory = path.join(cacheRoot, key);
  let pkg = defaults;
  if (version !== defaults.version) {
    const metadataPath = path.join(directory, 'metadata.json');
    const cached = await readIfPresent(metadataPath);
    const metadata = cached ?? await download(
      `${defaults.registry}/${defaults.name}/${version}`,
      1024 * 1024,
      options,
    );
    const record = JSON.parse(metadata.toString('utf8')) as {
      name?: string;
      version?: string;
      dist?: { integrity?: string; };
    };
    if (
      record?.name !== defaults.name || record.version !== version
      || !/^sha512-[A-Za-z0-9+/]{86}==$/u.test(record.dist?.integrity ?? '')
    ) {
      throw new Error(
        `Invalid registry metadata for ${defaults.name}@${version}: exact identity and SHA-512 are required.`,
      );
    }
    pkg = { ...defaults, version, integrity: record.dist!.integrity! };
    if (!cached) await atomicWrite(metadataPath, metadata);
  }
  const archivePath = path.join(directory, 'package.tgz');
  let archive = await readIfPresent(archivePath);
  if (archive) {
    try {
      verifyIntegrity(archive, pkg.integrity);
    } catch {
      archive = undefined;
    }
  }
  if (!archive) {
    archive = await download(
      `${pkg.registry}/${pkg.name}/-/tasm-${version}.tgz`,
      MAX_ARCHIVE_BYTES,
      options,
    );
    verifyIntegrity(archive, pkg.integrity);
    // Validate package identity and archive structure before publishing the cache.
    unpackCodec(archive, pkg);
    await atomicWrite(archivePath, archive);
  }
  const codec = unpackCodec(archive, pkg);
  const digest = createHash('sha256').update(codec).digest('hex');
  const file = path.join(directory, `${digest}.cjs`);
  const existing = await readIfPresent(file);
  if (!existing?.equals(codec)) await atomicWrite(file, codec);
  return { file, package: pkg };
}
