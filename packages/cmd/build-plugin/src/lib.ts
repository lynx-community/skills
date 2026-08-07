// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { default as packList } from 'npm-packlist';

const PLUGIN_PACKAGE_NAME_RE = /^@lynx-js\/ai-plugin-/;
const SKILL_PACKAGE_NAME_RE = /^@lynx-js\/skill-([^/]+)/;

type Author =
  | string
  | {
      name?: string;
      email?: string;
      url?: string;
    };

type NormalizedAuthor = {
  name: string;
  email?: string;
  url?: string;
};

/**
 * The `interface` block consumed by Codex when it renders a plugin.
 */
type CodexInterface = {
  displayName: string;
  shortDescription: string;
  longDescription: string;
  developerName: string;
  category: string;
  capabilities: string[];
  websiteURL?: string;
  privacyPolicyURL?: string;
  termsOfServiceURL?: string;
  defaultPrompt: string[];
  brandColor?: string;
  composerIcon?: string;
  logo?: string;
  logoDark?: string;
  screenshots?: string[];
};

/**
 * Free-form escape hatch merged into the generated Codex manifest. `interface`
 * is declared explicitly so that it is merged into, rather than replacing, the
 * generated interface block.
 */
type CodexManifestOverrides = {
  interface?: unknown;
  [key: string]: unknown;
};

type CodexPluginConfig = {
  category?: string;
  interface?: Partial<CodexInterface>;
  manifest?: CodexManifestOverrides;
};

type PackageJson = {
  name: string;
  version: string;
  description?: string;
  author?: Author;
  homepage?: string;
  repository?: unknown;
  license?: string;
  keywords?: string[];
  files?: unknown;
  dependencies?: Record<string, string>;
  claudePlugin?: { category?: string };
  codexPlugin?: CodexPluginConfig;
};

async function readPackageJson(pkgDir: string): Promise<PackageJson> {
  return JSON.parse(
    await readFile(resolve(pkgDir, 'package.json'), 'utf-8'),
  ) as PackageJson;
}

function normalizePackageFilePath(file: string) {
  return file.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function packageFilesIncludes(pkg: PackageJson, target: string) {
  return (
    Array.isArray(pkg.files) &&
    pkg.files.some(
      (file) =>
        typeof file === 'string' &&
        normalizePackageFilePath(file) === normalizePackageFilePath(target),
    )
  );
}

async function packageFilesIncludesPackageJSON(pkgDir: string) {
  return packageFilesIncludes(await readPackageJson(pkgDir), 'package.json');
}

async function pathExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function writeJsonFile(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function getPluginName(pkgName: string) {
  return pkgName.replace(PLUGIN_PACKAGE_NAME_RE, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAuthor(author: Author | undefined): NormalizedAuthor {
  if (typeof author === 'string' && author.trim() !== '') {
    return { name: author };
  }

  if (author != null && typeof author === 'object') {
    const normalized: NormalizedAuthor = { name: author.name || 'lynx' };
    if (author.email != null) {
      normalized.email = author.email;
    }
    if (author.url != null) {
      normalized.url = author.url;
    }
    return normalized;
  }

  return { name: 'lynx' };
}

function titleCasePluginName(pluginName: string) {
  return pluginName
    .split('-')
    .map((part) => {
      if (part === 'lynx') {
        return 'Lynx';
      }
      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join(' ');
}

function normalizeCategory(category: unknown) {
  if (typeof category !== 'string' || category.trim() === '') {
    return 'Development';
  }
  return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

function getCodexInterface(
  pkg: PackageJson,
  pluginName: string,
): CodexInterface {
  const displayName = titleCasePluginName(pluginName);
  const author = normalizeAuthor(pkg.author);

  return {
    displayName,
    shortDescription: pkg.description || `${displayName} plugin`,
    longDescription:
      pkg.description ||
      `${displayName} plugin with bundled skills and tool integrations.`,
    developerName: author.name,
    category: normalizeCategory(
      pkg.codexPlugin?.category ?? pkg.claudePlugin?.category,
    ),
    capabilities: ['Interactive', 'Read', 'Write'],
    defaultPrompt: [
      `Help me build a ${displayName} feature.`,
      `Review this ${displayName} change.`,
      `Debug this ${displayName} issue.`,
    ],
    ...(pkg.codexPlugin?.interface ?? {}),
  };
}

async function writeClaudePluginMetadata(
  pkgDir: string,
  pkg: PackageJson,
  pluginName: string,
) {
  await writeJsonFile(resolve(pkgDir, '.claude-plugin', 'plugin.json'), {
    name: pluginName,
    version: pkg.version,
    description: pkg.description || '',
  });
}

/**
 * Writes `.codex-plugin/plugin.json` for packages that opt in, either by
 * listing `.codex-plugin` in `files` or by declaring a `codexPlugin` config.
 */
async function writeCodexPluginManifest(
  pkgDir: string,
  pkg: PackageJson,
  pluginName: string,
) {
  if (!packageFilesIncludes(pkg, '.codex-plugin') && pkg.codexPlugin == null) {
    return;
  }

  const manifestOverrides = pkg.codexPlugin?.manifest ?? {};
  const manifestInterfaceOverrides = isRecord(manifestOverrides.interface)
    ? manifestOverrides.interface
    : {};
  const hasSkills = await pathExists(resolve(pkgDir, 'skills'));
  const hasMcpServers = await pathExists(resolve(pkgDir, '.mcp.json'));

  await writeJsonFile(resolve(pkgDir, '.codex-plugin', 'plugin.json'), {
    ...manifestOverrides,
    name: pluginName,
    version: pkg.version,
    description: pkg.description || '',
    author: normalizeAuthor(pkg.author),
    keywords: pkg.keywords ?? ['lynx', 'reactlynx', 'lynx-js'],
    interface: {
      ...getCodexInterface(pkg, pluginName),
      ...manifestInterfaceOverrides,
    },
    ...(hasSkills ? { skills: './skills/' } : {}),
    ...(hasMcpServers ? { mcpServers: './.mcp.json' } : {}),
    ...(pkg.homepage != null ? { homepage: pkg.homepage } : {}),
    ...(pkg.repository != null ? { repository: pkg.repository } : {}),
    ...(pkg.license != null ? { license: pkg.license } : {}),
  });
}

/**
 * Copy files in a package (defined by package.json `files`)
 * to target dir, should mirror the behavior of `npm pack`.
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
  const files = await packList({ path: pkgDir });
  const skipImplicitPackageJSON =
    skipPackageJSON && !(await packageFilesIncludesPackageJSON(pkgDir));

  for (const file of files) {
    if (skipImplicitPackageJSON && file === 'package.json') {
      continue;
    }
    const sourcePath = resolve(pkgDir, file);
    const targetPath = resolve(targetDir, file);
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
  }
}

export async function buildPlugin(pkgDir: string) {
  const pkg = await readPackageJson(pkgDir);

  if (!pkg.name.match(PLUGIN_PACKAGE_NAME_RE)) {
    throw new Error('Package is not a plugin. Aborting...');
  }

  const pluginName = getPluginName(pkg.name);
  const { dependencies = {} } = pkg;

  // SKILLS
  for (const dep in dependencies) {
    const m = dep.match(SKILL_PACKAGE_NAME_RE);
    if (m != null) {
      const [, skillName] = m as [string, string];
      const source = resolve(pkgDir, 'node_modules', dep);
      const target = resolve(pkgDir, 'skills', skillName);
      await copyPackageFiles(source, target, true);
    }
  }

  // metadata files
  await writeClaudePluginMetadata(pkgDir, pkg, pluginName);
  await writeCodexPluginManifest(pkgDir, pkg, pluginName);
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
    if ((error as { code?: string }).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function exportPlugin(pkgDir: string, targetDir: string) {
  await validateDirForCopying(pkgDir, targetDir);
  await copyPackageFiles(pkgDir, targetDir, true);
}
