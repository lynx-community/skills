// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

const SKILL_PACKAGE_PREFIX = '@lynx-js/skill-';

export async function discoverSkillSuites(repoRoot) {
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
    const packageEvalPath = join(skillPath, 'evals');
    suitesBySkillPath.set(skillPath, {
      evalPath: existsSync(packageEvalPath)
        ? packageEvalPath
        : join(repoRoot, 'evals', skillSlug),
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

export function suiteSlug(suite) {
  if (suite.packageName?.startsWith(SKILL_PACKAGE_PREFIX)) {
    return suite.packageName.slice(SKILL_PACKAGE_PREFIX.length);
  }
  return basename(suite.skillPath);
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

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}
