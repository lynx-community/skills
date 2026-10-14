// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse } from 'yaml';

const exec = promisify(execFile);
const workflow = parse(
  await readFile(
    new URL('../.github/workflows/pkg-pr-new.yml', import.meta.url),
    'utf8',
  ),
);
const collection = workflow.jobs.publish.steps.find(
  (step) => step.id === 'changeset',
).run;
const changesetCli = fileURLToPath(
  new URL('../node_modules/@changesets/cli/bin.js', import.meta.url),
);
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const record = '---\n"@lynx-js/preview-fixture": patch\n---\nFixture update.\n';

async function fixture(t, { existingRecord = false } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'package-preview-'));
  t.after(() => rm(directory, { recursive: true, force: true }));

  async function write(path, content) {
    const target = join(directory, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }

  async function git(...args) {
    return exec('git', args, { cwd: directory });
  }

  async function commit() {
    await git('add', '-A');
    await git(
      '-c',
      'user.name=Preview Fixture',
      '-c',
      'user.email=preview@example.com',
      'commit',
      '-qm',
      'Fixture update',
    );
  }

  await write(
    'package.json',
    JSON.stringify({
      name: 'preview-test',
      version: '1.0.0',
      private: true,
      packageManager: packageJson.packageManager,
      scripts: {
        changeset: `${JSON.stringify(process.execPath)} ${
          JSON.stringify(changesetCli)
        }`,
      },
    }),
  );
  await write('pnpm-workspace.yaml', 'packages:\n  - packages/*\n');
  await write(
    'packages/public/package.json',
    JSON.stringify({
      name: '@lynx-js/preview-fixture',
      version: '1.0.0',
    }),
  );
  await write('packages/public/index.js', 'export const fixture = true;\n');
  await write(
    '.changeset/config.json',
    JSON.stringify({
      changelog: false,
      commit: false,
      fixed: [],
      linked: [],
      access: 'public',
      baseBranch: 'main',
      updateInternalDependencies: 'patch',
      ignore: [],
    }),
  );
  await write('.changeset/README.md', 'Release metadata.\n');
  await write('.github/scripts/.gitkeep', '');
  await copyFile(
    new URL('../.github/scripts/list-changeset-packages.mjs', import.meta.url),
    join(directory, '.github/scripts/list-changeset-packages.mjs'),
  );
  if (existingRecord) await write('.changeset/existing.md', record);
  await git('init', '-q', '--initial-branch=main');
  await commit();
  const base = (await git('rev-parse', 'HEAD')).stdout.trim();
  const output = join(directory, 'github-output');

  return {
    directory,
    output,
    write,
    commit,
    run: (baseSha = base) =>
      exec('bash', ['-e', '-c', collection], {
        cwd: directory,
        env: {
          ...process.env,
          CHANGESET_BASE_SHA: baseSha,
          GITHUB_OUTPUT: output,
        },
      }),
  };
}

async function assertSkipped(f) {
  const result = await f.run();
  assert.equal(await readFile(f.output, 'utf8'), 'skip=true\n');
  assert.match(result.stdout, /skipping pkg\.pr\.new publish/);
}

test('skips package changes without new changesets, even with pending records', async (t) => {
  const f = await fixture(t, { existingRecord: true });
  await f.write('packages/public/index.js', 'export const updated = true;\n');
  await f.commit();
  await assertSkipped(f);
  assert.equal(existsSync(join(f.directory, '.changeset-status.json')), false);
});

test('skips changeset README, configuration and nested documentation changes', async (t) => {
  const f = await fixture(t);
  await f.write('.changeset/README.md', 'Updated release documentation.\n');
  await f.write(
    '.changeset/docs/example.md',
    'Example, not a release record.\n',
  );
  await f.write(
    '.changeset/config.json',
    `${await readFile(join(f.directory, '.changeset/config.json'), 'utf8')}\n`,
  );
  await f.commit();
  await assertSkipped(f);
});

test('skips removed changesets', async (t) => {
  const f = await fixture(t, { existingRecord: true });
  await rm(join(f.directory, '.changeset/existing.md'));
  await f.commit();
  await assertSkipped(f);
});

test('selects public packages from a new valid changeset', async (t) => {
  const f = await fixture(t);
  await f.write('.changeset/new.md', record);
  await f.commit();
  await f.run();
  assert.match(
    await readFile(f.output, 'utf8'),
    /skip=false\npackage-dirs<<EOF\n\.\/packages\/public/,
  );
});

test('validates and selects packages from modified changesets', async (t) => {
  const f = await fixture(t, { existingRecord: true });
  await f.write('.changeset/existing.md', record.replace('patch', 'minor'));
  await f.commit();
  await f.run();
  assert.match(await readFile(f.output, 'utf8'), /skip=false/);
});

test('does not bypass validation for renamed changesets', async (t) => {
  const f = await fixture(t, { existingRecord: true });
  await rename(
    join(f.directory, '.changeset/existing.md'),
    join(f.directory, '.changeset/renamed.md'),
  );
  await f.commit();
  await f.run();
  assert.match(await readFile(f.output, 'utf8'), /skip=false/);
});

test('skips preview publishing for an empty changeset', async (t) => {
  const f = await fixture(t);
  await f.write('.changeset/empty.md', '---\n---\nNo release needed.\n');
  await f.write('packages/public/index.js', 'export const updated = true;\n');
  await f.commit();
  await assertSkipped(f);
  assert.equal(existsSync(join(f.directory, '.changeset-status.json')), true);
});

test('fails for a changeset naming an unknown package', async (t) => {
  const f = await fixture(t);
  await f.write(
    '.changeset/invalid.md',
    record.replace('@lynx-js/preview-fixture', '@lynx-js/missing'),
  );
  await f.commit();
  await assert.rejects(f.run(), { code: 1, stderr: /@lynx-js\/missing/ });
  assert.equal(existsSync(f.output), false);
});

test('fails for malformed changeset metadata', async (t) => {
  const f = await fixture(t);
  await f.write(
    '.changeset/invalid.md',
    '---\n"@lynx-js/preview-fixture": [\n---\nMalformed YAML.\n',
  );
  await f.commit();
  await assert.rejects(f.run(), { code: 1 });
  assert.equal(existsSync(f.output), false);
});

test('does not treat an invalid Git base as missing release intent', async (t) => {
  const f = await fixture(t);
  await assert.rejects(f.run('missing-base'), { code: 128 });
  assert.equal(existsSync(f.output), false);
});
