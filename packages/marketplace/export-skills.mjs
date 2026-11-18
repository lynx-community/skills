// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

import { exportPlugin } from 'build-plugin';

const require = createRequire(import.meta.url);

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const skillDeps = Object.keys(pkg.dependencies || {}).filter((dep) =>
  dep.startsWith('@lynx-js/skill-')
);

const allWorkspaces = JSON.parse(
  execSync('pnpm list --recursive --depth -1 --json', {
    encoding: 'utf-8',
  }),
);

const skills = skillDeps
  .map((name) => {
    const workspace = allWorkspaces.find((ws) => ws.name === name);
    if (workspace) {
      return { name, path: workspace.path };
    }

    try {
      const pkgJsonPath = require.resolve(`${name}/package.json`);
      return { name, path: dirname(pkgJsonPath) };
    } catch {
      console.warn(`Warning: Could not resolve package path for ${name}`);
      return null;
    }
  })
  .filter(Boolean);

const skillsOutputDir = resolve(process.argv[2] ?? '.', 'skills');
await rm(skillsOutputDir, { recursive: true, force: true });

for (const skill of skills) {
  const { name, path: skillPath } = skill;
  const targetDir = resolve(
    skillsOutputDir,
    name.replace('@lynx-js/skill-', ''),
  );
  await exportPlugin(skillPath, targetDir);
  console.error(`Exported skill: ${name}`);
}
