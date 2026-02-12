// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const skills = JSON.parse(
  execFileSync('pnpm', ['list', '--recursive', '--depth', '-1', '--json'], {
    encoding: 'utf-8',
  }),
).filter((workspace) => workspace.name.startsWith('@lynx-js/skill-'));

for (const skill of skills) {
  const { name, path } = skill;
  execFileSync(
    './node_modules/.bin/build-plugin',
    [
      '-C',
      path,
      'export',
      '--skip-build',
      resolve(process.cwd(), 'skills', name.replace('@lynx-js/skill-', '')),
    ],
    {
      stdio: 'inherit',
    },
  );
  console.error(`Exported skill: ${name}`);
}
