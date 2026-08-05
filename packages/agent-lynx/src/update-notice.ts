// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const AGENT_LYNX_PACKAGE = 'agent-lynx';
const DEFAULT_REGISTRY = 'https://registry.npmjs.org';
const SUCCESS_CACHE_TTL_MS = 6 * 60 * 60 * 1_000;
const FAILURE_CACHE_TTL_MS = 10 * 60 * 1_000;
const DEFAULT_TIMEOUT_MS = 800;

interface CachedLatestVersion {
  checkedAt: number;
  expiresAt: number;
  latest: string | null;
}

interface ParsedSemver {
  core: readonly [bigint, bigint, bigint];
  prerelease: readonly string[];
}

interface OutputWriter {
  write(chunk: string | Uint8Array): boolean;
}

export interface UpdateNotice {
  current: string;
  latest: string;
  message: string;
}

export interface ResolveUpdateNoticeOptions {
  currentVersion: string;
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}

export interface WithUpdateNoticeOptions {
  argv: readonly string[];
  resolveNotice: () => Promise<UpdateNotice | null>;
  stderr?: OutputWriter;
}

function parseSemver(value: string): ParsedSemver | null {
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.exec(
      value,
    );
  if (!match) return null;

  const prerelease = match[4]?.split('.') ?? [];
  if (
    prerelease.some(
      (identifier) =>
        /^\d+$/u.test(identifier) &&
        identifier.length > 1 &&
        identifier.startsWith('0'),
    )
  ) {
    return null;
  }

  return {
    core: [BigInt(match[1]!), BigInt(match[2]!), BigInt(match[3]!)],
    prerelease,
  };
}

function comparePrerelease(
  left: readonly string[],
  right: readonly string[],
): number {
  if (left.length === 0 || right.length === 0) {
    if (left.length === right.length) return 0;
    return left.length === 0 ? 1 : -1;
  }

  const count = Math.max(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];
    if (leftIdentifier === undefined || rightIdentifier === undefined) {
      if (leftIdentifier === rightIdentifier) return 0;
      return leftIdentifier === undefined ? -1 : 1;
    }
    if (leftIdentifier === rightIdentifier) continue;

    const leftNumeric = /^\d+$/u.test(leftIdentifier);
    const rightNumeric = /^\d+$/u.test(rightIdentifier);
    if (leftNumeric && rightNumeric) {
      return BigInt(leftIdentifier) > BigInt(rightIdentifier) ? 1 : -1;
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftIdentifier > rightIdentifier ? 1 : -1;
  }
  return 0;
}

/** Compare strict SemVer values without treating a merely different tag as newer. */
export function isNewerVersion(latest: string, current: string): boolean {
  const left = parseSemver(latest);
  const right = parseSemver(current);
  if (!left || !right) return false;

  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] === right.core[index]) continue;
    return left.core[index]! > right.core[index]!;
  }
  return comparePrerelease(left.prerelease, right.prerelease) > 0;
}

function updateNotice(current: string, latest: string): UpdateNotice | null {
  if (!isNewerVersion(latest, current)) return null;
  return {
    current,
    latest,
    message: `agent-lynx ${latest} available, current ${current}`,
  };
}

function cacheFile(env: NodeJS.ProcessEnv): string {
  const cacheRoot =
    env['XDG_CACHE_HOME'] ||
    env['LOCALAPPDATA'] ||
    path.join(os.homedir(), '.cache');
  return path.join(cacheRoot, 'agent-lynx', 'update-check.json');
}

function isCachedLatestVersion(value: unknown): value is CachedLatestVersion {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record['checkedAt'] === 'number' &&
    Number.isFinite(record['checkedAt']) &&
    typeof record['expiresAt'] === 'number' &&
    Number.isFinite(record['expiresAt']) &&
    (record['latest'] === null || typeof record['latest'] === 'string')
  );
}

async function readCache(
  fileName: string,
): Promise<CachedLatestVersion | null> {
  try {
    const value: unknown = JSON.parse(await readFile(fileName, 'utf8'));
    return isCachedLatestVersion(value) ? value : null;
  } catch {
    return null;
  }
}

async function writeCache(
  fileName: string,
  value: CachedLatestVersion,
): Promise<void> {
  const temporaryFile = `${fileName}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(fileName), { recursive: true });
    await writeFile(temporaryFile, `${JSON.stringify(value)}\n`, 'utf8');
    await rename(temporaryFile, fileName);
  } catch {
    // A version check must never affect the command it accompanies.
  } finally {
    await rm(temporaryFile, { force: true }).catch(() => void 0);
  }
}

function registryUrl(env: NodeJS.ProcessEnv): URL {
  const registry =
    env['AGENT_LYNX_UPDATE_REGISTRY'] ||
    env['npm_config_registry'] ||
    env['NPM_CONFIG_REGISTRY'] ||
    DEFAULT_REGISTRY;
  const base = registry.endsWith('/') ? registry : `${registry}/`;
  return new URL(
    `-/package/${encodeURIComponent(AGENT_LYNX_PACKAGE)}/dist-tags`,
    base,
  );
}

function updateChecksDisabled(env: NodeJS.ProcessEnv): boolean {
  return [
    env['AGENT_LYNX_DISABLE_UPDATE_NOTICE'],
    env['CODEX_SANDBOX_NETWORK_DISABLED'],
    env['npm_config_offline'],
    env['NPM_CONFIG_OFFLINE'],
  ].some((value) => /^(?:1|true)$/iu.test(value ?? ''));
}

/** Resolve a cached, best-effort update notice from the package registry. */
export async function resolveUpdateNotice(
  options: ResolveUpdateNoticeOptions,
): Promise<UpdateNotice | null> {
  const env = options.env ?? process.env;
  if (updateChecksDisabled(env) || !parseSemver(options.currentVersion))
    return null;

  const now = options.now ?? Date.now;
  const checkedAt = now();
  const fileName = cacheFile(env);
  const cached = await readCache(fileName);
  if (cached && cached.expiresAt > checkedAt) {
    return cached.latest
      ? updateNotice(options.currentVersion, cached.latest)
      : null;
  }

  let latest: string | null = null;
  let cacheTtl = FAILURE_CACHE_TTL_MS;
  try {
    const response = await (options.fetchImpl ?? fetch)(registryUrl(env), {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    if (!response.ok)
      throw new Error(`Registry returned HTTP ${response.status}.`);
    const metadata = (await response.json()) as { latest?: unknown };
    if (typeof metadata.latest !== 'string' || !parseSemver(metadata.latest)) {
      throw new Error('Registry returned an invalid latest version.');
    }
    latest = metadata.latest;
    cacheTtl = SUCCESS_CACHE_TTL_MS;
  } catch {
    latest = cached?.latest ?? null;
  }

  await writeCache(fileName, {
    checkedAt,
    expiresAt: checkedAt + cacheTtl,
    latest,
  });
  return latest ? updateNotice(options.currentVersion, latest) : null;
}

function isEarlyExitInvocation(argv: readonly string[]): boolean {
  return (
    argv.includes('--help') ||
    argv.includes('-h') ||
    argv.includes('--version') ||
    argv.includes('-V') ||
    argv[0] === 'help'
  );
}

function writeTextNotice(stderr: OutputWriter, notice: UpdateNotice): void {
  stderr.write(`${notice.message}\n`);
}

/**
 * Add one best-effort update notice to stderr without observing or modifying
 * the command's stdout protocol.
 */
export async function withUpdateNotice<T>(
  options: WithUpdateNoticeOptions,
  run: () => Promise<T>,
): Promise<T> {
  const stderr = options.stderr ?? process.stderr;
  const noticePromise = options.resolveNotice().catch(() => null);

  // Commander exits the process directly for help and version. Resolve before
  // parsing so the notice is not lost to that early exit.
  if (isEarlyExitInvocation(options.argv)) {
    const notice = await noticePromise;
    if (notice) writeTextNotice(stderr, notice);
    return await run();
  }

  try {
    return await run();
  } finally {
    const notice = await noticePromise;
    if (notice) writeTextNotice(stderr, notice);
  }
}
