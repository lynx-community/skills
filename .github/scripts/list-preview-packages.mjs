// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';

function main() {
  const base = process.argv[2];
  if (!base) throw new Error('A Git base revision is required.');

  const workspacePackages = JSON.parse(
    execFileSync('pnpm', [
      '--filter',
      `...[${base}]`,
      'list',
      '--json',
      '--depth=-1',
    ], {
      encoding: 'utf8',
    }),
  );

  for (const pkg of workspacePackages) {
    if (
      pkg.private
      || !(pkg.name?.startsWith('@lynx-js/') || pkg.name === 'agent-lynx')
    ) {
      continue;
    }

    process.stdout.write(`./${relative(process.cwd(), pkg.path)}\n`);
  }
}

main();
