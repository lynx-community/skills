// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

function main() {
  const statusFile = process.argv[2] || '.changeset-status.json';
  const status = JSON.parse(readFileSync(statusFile, 'utf8'));
  const releases = Array.isArray(status.releases) ? status.releases : [];
  const affectedPackages = new Set(
    releases
      .filter((release) => release?.type && release.type !== 'none')
      .map((release) => release.name)
      .filter((name) => name?.startsWith('@lynx-js/')),
  );

  if (affectedPackages.size === 0) {
    return;
  }

  const workspacePackages = JSON.parse(
    execFileSync('pnpm', ['m', 'ls', '--json', '--depth=-1'], {
      encoding: 'utf8',
    }),
  );

  for (const pkg of workspacePackages) {
    if (!pkg.name || pkg.private || !affectedPackages.has(pkg.name)) {
      continue;
    }

    process.stdout.write(`./${relative(process.cwd(), pkg.path)}\n`);
  }
}

main();
