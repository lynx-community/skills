// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  copyFile,
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { default as packList } from 'npm-packlist';

const SKILL_PACKAGE_NAME_RE = /^@lynx-js\/skill-([^/]+)$/;
// Root-level files that npm-packlist force-includes regardless of `files`,
// which should not be copied into exported plugin or skill payloads.
const COPY_EXCLUDED_ROOT_FILES = new Set(['readme.md', 'changelog.md']);

type PackageJson = {
  name?: string;
  files?: unknown;
};

function normalizePackageFilePath(file: string) {
  return file.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function isExcludedRootDocFile(file: string) {
  const normalized = normalizePackageFilePath(file);
  return (
    !normalized.includes('/')
    && COPY_EXCLUDED_ROOT_FILES.has(normalized.toLowerCase())
  );
}

function isSkillEvalFile(file: string) {
  const normalized = normalizePackageFilePath(file);
  return normalized === 'evals' || normalized.startsWith('evals/');
}

async function readPackageJson(pkgDir: string): Promise<PackageJson> {
  return JSON.parse(
    await readFile(resolve(pkgDir, 'package.json'), 'utf-8'),
  ) as PackageJson;
}

function packageFilesIncludesPackageJSON(pkg: PackageJson) {
  return (
    Array.isArray(pkg.files)
    && pkg.files.some(
      (file) =>
        typeof file === 'string'
        && normalizePackageFilePath(file) === 'package.json',
    )
  );
}

/**
 * Copy files in a package (defined by package.json `files`)
 * to target dir, mirroring `npm pack` while omitting root docs/evals from
 * exported payloads when `skipPackageJSON` is true.
 * When skipPackageJSON is true, package.json is copied only if `files`
 * explicitly includes package.json.
 * @param pkgDir path of dir of the package
 * @param targetDir copy to
 */
export async function copyPackageFiles(
  pkgDir: string,
  targetDir: string,
  skipPackageJSON: boolean = false,
) {
  const [pkg, rawFiles] = await Promise.all([
    readPackageJson(pkgDir),
    packList({ path: pkgDir }),
  ]);
  const files = rawFiles.map(normalizePackageFilePath);
  const skipImplicitPackageJSON = skipPackageJSON
    && !packageFilesIncludesPackageJSON(pkg);
  const skipSkillEvals = skipPackageJSON
    && typeof pkg.name === 'string'
    && SKILL_PACKAGE_NAME_RE.test(pkg.name);

  for (const file of files) {
    if (skipImplicitPackageJSON && file === 'package.json') {
      continue;
    }
    if (skipPackageJSON && isExcludedRootDocFile(file)) {
      continue;
    }
    if (skipSkillEvals && isSkillEvalFile(file)) {
      continue;
    }
    const sourcePath = resolve(pkgDir, file);
    const targetPath = resolve(targetDir, file);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
}

export async function buildPlugin(pkgDir: string) {
  const pkgPath = `${pkgDir}/package.json`;

  // Read package.json to get the plugin name
  const { default: pkg } = await import(`file://${pkgPath}`, {
    with: { type: 'json' },
  });

  if (!pkg.name.match(/^@lynx-js\/ai-plugin-/)) {
    throw new Error('Package is not a plugin. Aborting...');
  }

  const { dependencies = {} } = pkg;

  // SKILLS
  for (const dep in dependencies) {
    const m = dep.match(SKILL_PACKAGE_NAME_RE);
    if (m != null) {
      const [, skillName] = m as [string, string];
      const source = resolve(pkgDir, 'node_modules', dep);
      const target = resolve(pkgDir, 'skills', skillName);
      await rm(target, { recursive: true, force: true });
      await copyPackageFiles(source, target, true);
    }
  }

  // metadata files
  const metadataContent = `${
    JSON.stringify(
      {
        name: pkg.name.replace(/^@lynx-js\/ai-plugin-/, ''),
        version: pkg.version,
        description: pkg.description || '',
      },
      null,
      2,
    )
  }\n`;

  // .claude-plugin
  const claudePluginDir = resolve(pkgDir, '.claude-plugin');
  await mkdir(claudePluginDir, { recursive: true });
  await writeFile(resolve(claudePluginDir, 'plugin.json'), metadataContent);
}

/**
 * Validates the export target directory.
 * @param sourceDir - The absolute path to the target directory.
 * @param targetDir - The absolute path to the target directory.
 */
export async function validateDirForCopying(
  sourceDir: string,
  targetDir: string,
): Promise<void> {
  if (sourceDir === targetDir) {
    throw new Error(
      'Target directory cannot be the same as the package directory.',
    );
  }

  try {
    const stats = await stat(targetDir);
    if (!stats.isDirectory()) {
      throw new Error(
        `Target path '${targetDir}' exists but is not a directory.`,
      );
    }
  } catch (error) {
    if ((error as { code?: string; }).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function exportPlugin(pkgDir: string, targetDir: string) {
  await validateDirForCopying(pkgDir, targetDir);
  const pkg = await readPackageJson(pkgDir);
  if (typeof pkg.name === 'string' && SKILL_PACKAGE_NAME_RE.test(pkg.name)) {
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(targetDir, { recursive: true });
  }
  await copyPackageFiles(pkgDir, targetDir, true);
}
