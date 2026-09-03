// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { exportPlugin } from 'build-plugin';
import { Command } from 'commander';

const MARKETPLACE_PACKAGE_NAME_RE = /^@lynx-js\/marketplace-/;
const PLUGIN_PACKAGE_NAME_PREFIX = '@lynx-js/ai-plugin-';

type PackageJson = {
  name: string;
  version: string;
  description?: string;
  author?: unknown;
  dependencies?: Record<string, string>;
  codexMarketplace?: {
    interface?: {
      displayName?: string;
    };
  };
};

type PluginPackageJson = {
  description?: string;
  claudePlugin?: {
    category?: string;
    [key: string]: unknown;
  };
  codexPlugin?: {
    category?: string;
    policy?: Partial<CodexMarketplacePlugin['policy']>;
  };
};

type LegacyMarketplacePlugin = {
  name: string;
  description?: string | undefined;
  source: string;
  [key: string]: unknown;
};

type CodexMarketplacePlugin = {
  name: string;
  description?: string | undefined;
  source: {
    source: 'local';
    path: string;
  };
  policy: {
    installation: 'NOT_AVAILABLE' | 'AVAILABLE' | 'INSTALLED_BY_DEFAULT';
    authentication: 'ON_INSTALL' | 'ON_USE';
  };
  category: string;
};

async function writeJsonFile(filePath: string, value: unknown) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeCategory(category: unknown) {
  if (typeof category !== 'string' || category.trim() === '') {
    return 'Development';
  }
  return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
}

function normalizeCodexPolicy(
  policy: Partial<CodexMarketplacePlugin['policy']> | undefined,
): CodexMarketplacePlugin['policy'] {
  const installation =
    policy?.installation === 'NOT_AVAILABLE' ||
    policy?.installation === 'INSTALLED_BY_DEFAULT'
      ? policy.installation
      : 'AVAILABLE';
  const authentication =
    policy?.authentication === 'ON_USE' ? policy.authentication : 'ON_INSTALL';

  return {
    installation,
    authentication,
  };
}

async function buildMarketplace(pkgDir: string) {
  const pkgPath = `${pkgDir}/package.json`;

  // Read package.json to get the marketplace name
  const { default: pkg } = (await import(`file://${pkgPath}`, {
    with: { type: 'json' },
  })) as { default: PackageJson };

  if (!pkg.name.match(MARKETPLACE_PACKAGE_NAME_RE)) {
    throw new Error('Package is not a marketplace. Aborting...');
  }

  const { dependencies = {} } = pkg;

  const plugins: LegacyMarketplacePlugin[] = [];
  const codexPlugins: CodexMarketplacePlugin[] = [];

  // Clean plugins output directories before rebuilding
  await rm(resolve(pkgDir, 'plugins'), { recursive: true, force: true });
  await rm(resolve(pkgDir, '.agents', 'plugins'), {
    recursive: true,
    force: true,
  });

  // PLUGINS
  for (const dep in dependencies) {
    if (dep.startsWith(PLUGIN_PACKAGE_NAME_PREFIX)) {
      const name = dep.slice(PLUGIN_PACKAGE_NAME_PREFIX.length);
      const source = resolve(pkgDir, 'node_modules', dep);
      const target = resolve(pkgDir, 'plugins', name);

      await exportPlugin(source, target);

      const pluginMeta = JSON.parse(
        readFileSync(`${source}/package.json`, 'utf-8'),
      ) as PluginPackageJson;

      plugins.push({
        name,
        description: pluginMeta.description,
        source: `./plugins/${name}`,
        // for category or other fields
        ...(pluginMeta.claudePlugin ?? {}),
      });

      // Codex only picks up plugins that shipped a Codex manifest.
      if (existsSync(resolve(target, '.codex-plugin', 'plugin.json'))) {
        codexPlugins.push({
          name,
          description: pluginMeta.description,
          source: {
            source: 'local',
            path: `./plugins/${name}`,
          },
          policy: normalizeCodexPolicy(pluginMeta.codexPlugin?.policy),
          category: normalizeCategory(
            pluginMeta.codexPlugin?.category ??
              pluginMeta.claudePlugin?.category,
          ),
        });
      }
    }
  }

  // metadata files
  const name = pkg.name.replace(MARKETPLACE_PACKAGE_NAME_RE, '');

  // .claude-plugin/marketplace.json
  await writeJsonFile(resolve(pkgDir, '.claude-plugin', 'marketplace.json'), {
    name,
    version: pkg.version,
    description: pkg.description || 'A marketplace',
    owner: pkg.author || { name: 'lynx' },
    plugins,
  });

  // .agents/plugins/marketplace.json
  await writeJsonFile(
    resolve(pkgDir, '.agents', 'plugins', 'marketplace.json'),
    {
      name,
      interface: {
        displayName:
          pkg.codexMarketplace?.interface?.displayName ??
          pkg.description ??
          name,
      },
      plugins: codexPlugins,
    },
  );
}

const program = new Command();

program
  .name('plugin-marketplace')
  .description('A helper script for build your claude plugin marketplace')
  .option('-C, --cwd <cwd>', 'Set current working directory', process.cwd());

program.action(async () => {
  const { cwd } = program.opts<{ cwd: string }>();
  const pkgDir = resolve(process.cwd(), cwd);
  await buildMarketplace(pkgDir);
});

program
  .command('export')
  .description('Build and export your claude plugin marketplace')
  .argument('<targetDir>')
  .action(async (targetDir: string, options: { skipBuild: boolean }) => {
    const { cwd } = program.opts<{ cwd: string }>();
    const pkgDir = resolve(process.cwd(), cwd);
    if (!options.skipBuild) {
      await buildMarketplace(pkgDir);
    }
    await exportPlugin(pkgDir, resolve(process.cwd(), targetDir));
  });

await program.parseAsync(process.argv);
