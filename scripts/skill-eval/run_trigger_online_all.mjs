// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

const SKILL_PACKAGE_PREFIX = '@lynx-js/skill-';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(args.repoRoot ?? process.cwd());
  const outputRoot = resolve(args.outputRoot ?? join(repoRoot, 'artifacts'));
  const skipSkills = parseList(args.skipSkills);
  const suites = await discoverSkillSuites(repoRoot);
  const failures = [];

  for (const suite of suites) {
    const slug = suiteSlug(suite);
    if (skipSkills.has(slug) || skipSkills.has(suite.packageName)) {
      console.info(`[skill-eval] trigger_online skip skill=${slug}`);
      continue;
    }

    const commandArgs = [
      join(repoRoot, 'scripts', 'skill-eval', 'run_trigger_online.mjs'),
      '--skill-path',
      suite.skillPath,
      '--eval-path',
      suite.evalPath,
      '--repo-root',
      repoRoot,
      '--model',
      args.model ?? 'opencode/gpt-5-nano',
      '--runs-per-query',
      String(args.runsPerQuery ?? 1),
      '--timeout',
      String(args.timeout ?? 90),
      '--trigger-threshold',
      String(args.triggerThreshold ?? 0.5),
      '--min-pass-rate',
      String(args.minPassRate ?? 0.75),
      '--output',
      join(outputRoot, slug, 'trigger-eval', 'trigger-online-report.json'),
    ];

    console.info(`[skill-eval] trigger_online skill=${slug}`);
    if (args.dryRun) {
      console.info(
        [process.execPath, ...commandArgs]
          .map((part) => JSON.stringify(part))
          .join(' '),
      );
      continue;
    }

    const exitCode = await spawnInherited(
      process.execPath,
      commandArgs,
      repoRoot,
    );
    if (exitCode !== 0) {
      failures.push({ exitCode, slug });
    }
  }

  if (failures.length > 0) {
    console.error(
      `[skill-eval] ${failures.length} trigger eval suite${failures.length === 1 ? '' : 's'} failed: ${failures
        .map((failure) => `${failure.slug}(${failure.exitCode})`)
        .join(', ')}`,
    );
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--repo-root') args.repoRoot = argv[++index];
    else if (arg === '--model') args.model = argv[++index];
    else if (arg === '--runs-per-query')
      args.runsPerQuery = Number(argv[++index]);
    else if (arg === '--timeout') args.timeout = Number(argv[++index]);
    else if (arg === '--trigger-threshold')
      args.triggerThreshold = Number(argv[++index]);
    else if (arg === '--min-pass-rate')
      args.minPassRate = Number(argv[++index]);
    else if (arg === '--skip-skills') args.skipSkills = argv[++index];
    else if (arg === '--output-root') args.outputRoot = argv[++index];
    else if (arg === '--dry-run') args.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function discoverSkillSuites(repoRoot) {
  const skillsRoot = join(repoRoot, 'packages/skills');
  if (!existsSync(skillsRoot)) {
    throw new Error(`skills directory not found: ${skillsRoot}`);
  }

  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const sourceSuites = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillPath = join(skillsRoot, entry.name);
      return {
        evalPath: join(skillPath, 'evals'),
        packageName: undefined,
        skillPath,
      };
    })
    .filter((suite) => existsSync(join(suite.skillPath, 'SKILL.md')))
    .sort((left, right) => left.skillPath.localeCompare(right.skillPath));

  const sourcePackages = await getSourcePackageMap(sourceSuites);
  const suitesBySkillPath = new Map(
    sourceSuites.map((suite) => [suite.skillPath, suite]),
  );

  for (const dependencyName of await getSkillDependencies(repoRoot)) {
    const sourceSuite = sourcePackages.get(dependencyName);
    if (sourceSuite) {
      sourceSuite.packageName = dependencyName;
      continue;
    }

    const skillSlug = dependencyName.slice(SKILL_PACKAGE_PREFIX.length);
    const skillPath = join(
      repoRoot,
      'node_modules',
      ...dependencyName.split('/'),
    );
    suitesBySkillPath.set(skillPath, {
      evalPath: join(repoRoot, 'evals', skillSlug),
      packageName: dependencyName,
      skillPath,
    });
  }

  return Array.from(suitesBySkillPath.values()).sort((left, right) =>
    String(left.packageName ?? left.skillPath).localeCompare(
      String(right.packageName ?? right.skillPath),
    ),
  );
}

async function getSourcePackageMap(sourceSuites) {
  const packages = new Map();
  for (const suite of sourceSuites) {
    const packageJsonPath = join(suite.skillPath, 'package.json');
    if (!existsSync(packageJsonPath)) continue;
    const packageJson = await readJson(packageJsonPath);
    if (typeof packageJson.name === 'string') {
      packages.set(packageJson.name, suite);
    }
  }
  return packages;
}

async function getSkillDependencies(repoRoot) {
  const packageJson = await readJson(join(repoRoot, 'package.json'));
  const dependencies = packageJson.dependencies ?? {};
  return Object.keys(dependencies)
    .filter((name) => name.startsWith(SKILL_PACKAGE_PREFIX))
    .sort();
}

function suiteSlug(suite) {
  if (suite.packageName?.startsWith(SKILL_PACKAGE_PREFIX)) {
    return suite.packageName.slice(SKILL_PACKAGE_PREFIX.length);
  }
  return basename(suite.skillPath);
}

function parseList(value) {
  return new Set(
    String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function spawnInherited(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise(code ?? 1));
  });
}
