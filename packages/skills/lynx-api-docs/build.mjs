// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const packageRoot = dirname(
  require.resolve('@lynx-js/lynx-api-docs/package.json'),
);
const sourceRoot = resolve(packageRoot, 'skills', 'using-lynx-api-docs');
const targetRoot = dirname(fileURLToPath(import.meta.url));
const packageManifest = JSON.parse(
  await readFile(resolve(targetRoot, 'package.json'), 'utf8'),
);
const protectedEntries = new Set([
  '.gitignore',
  'build.mjs',
  'package.json',
  'test.mjs',
  'turbo.json',
]);
if (
  !Array.isArray(packageManifest.files) ||
  packageManifest.files.some(
    (entry) =>
      typeof entry !== 'string' ||
      entry.length === 0 ||
      entry !== basename(entry) ||
      entry === '.' ||
      entry === '..' ||
      protectedEntries.has(entry),
  )
) {
  throw new Error(
    'Expected package.json files to contain safe generated top-level paths.',
  );
}
const generatedEntries = new Set(packageManifest.files);
const excludedEntries = new Set([
  'AGENTS.md',
  'AGENTS.public.md',
  'CHANGELOG.md',
  'README.md',
  'README.public.md',
]);
const sourceEntries = (await readdir(sourceRoot)).filter(
  (entry) => !excludedEntries.has(entry),
);

for (const entry of sourceEntries) {
  if (!generatedEntries.has(entry)) {
    throw new Error(
      `Upstream output "${entry}" is missing from package.json files.`,
    );
  }
}

const buildRoot = await mkdtemp(resolve(targetRoot, '.lynx-api-docs-build-'));
const nextRoot = resolve(buildRoot, 'next');
const previousRoot = resolve(buildRoot, 'previous');

try {
  await Promise.all([
    mkdir(nextRoot, { recursive: true }),
    mkdir(previousRoot, { recursive: true }),
  ]);
  await Promise.all(
    sourceEntries.map((entry) =>
      cp(resolve(sourceRoot, entry), resolve(nextRoot, entry), {
        recursive: true,
        force: true,
      }),
    ),
  );

  const skillPath = resolve(nextRoot, 'SKILL.md');
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

  const backedUpEntries = [];
  const installedEntries = [];
  try {
    for (const entry of generatedEntries) {
      try {
        await rename(resolve(targetRoot, entry), resolve(previousRoot, entry));
        backedUpEntries.push(entry);
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    for (const entry of sourceEntries) {
      await rename(resolve(nextRoot, entry), resolve(targetRoot, entry));
      installedEntries.push(entry);
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const entry of installedEntries.reverse()) {
      try {
        await rm(resolve(targetRoot, entry), { recursive: true, force: true });
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    for (const entry of backedUpEntries.reverse()) {
      try {
        await rename(resolve(previousRoot, entry), resolve(targetRoot, entry));
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        'Failed to install generated documentation and restore prior outputs.',
      );
    }
    throw error;
  }
} finally {
  await rm(buildRoot, { recursive: true, force: true });
}
