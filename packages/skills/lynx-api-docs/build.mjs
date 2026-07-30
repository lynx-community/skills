// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = dirname(
  require.resolve('@lynx-js/lynx-api-docs/package.json'),
);
const sourceRoot = resolve(packageRoot, 'skills', 'using-lynx-api-docs');
const targetRoot = dirname(fileURLToPath(import.meta.url));
const excludedEntries = new Set([
  'AGENTS.md',
  'AGENTS.public.md',
  'CHANGELOG.md',
  'README.md',
  'README.public.md',
]);

for (const entry of await readdir(sourceRoot)) {
  if (excludedEntries.has(entry)) {
    continue;
  }
  await cp(resolve(sourceRoot, entry), resolve(targetRoot, entry), {
    recursive: true,
    force: true,
  });
}

const skillPath = resolve(targetRoot, 'SKILL.md');
const skill = await readFile(skillPath, 'utf8');
const normalizedSkill = skill.replace(
  /^name: using-lynx-api-docs$/m,
  'name: lynx-api-docs',
);
if (normalizedSkill === skill) {
  throw new Error(
    'Expected the upstream skill name to be "using-lynx-api-docs".',
  );
}
await writeFile(skillPath, normalizedSkill);
