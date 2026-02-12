// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootPkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const skillDeps = Object.keys(rootPkg.dependencies || {}).filter((dep) =>
  dep.startsWith('@lynx-js/skill-'),
);

const allWorkspaces = JSON.parse(
  execSync('pnpm list --recursive --depth -1 --json', {
    encoding: 'utf-8',
  }),
);

const skills = allWorkspaces.filter((workspace) =>
  skillDeps.includes(workspace.name),
);

/**
 * @param {string} skillPath
 * @param {string} targetDir
 * @returns {Promise<void>}
 */
function runBuildPlugin(skillPath, targetDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        './packages/cmd/build-plugin/bin/build-plugin.js',
        '-C',
        skillPath,
        'export',
        '--skip-build',
        targetDir,
      ],
      { stdio: 'inherit' },
    );
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build-plugin exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

for (const skill of skills) {
  const { name, path: skillPath } = skill;
  const targetDir = resolve(
    process.cwd(),
    'skills',
    name.replace('@lynx-js/skill-', ''),
  );
  await runBuildPlugin(skillPath, targetDir);
  console.error(`Exported skill: ${name}`);
}
