// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  buildExecutorPrompt,
  buildGraderPrompt,
  installTempSkill,
} from './run_task_online.mjs';

test('installTempSkill copies skill resources but excludes evals', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'task-eval-skill-'));
  t.after(() => rm(root, { force: true, recursive: true }));

  const skillPath = join(root, 'source');
  const skillsDir = join(root, 'installed');
  const skillContent = [
    '---',
    'name: example-skill',
    'description: Example skill.',
    '---',
    '',
    '# Example',
    '',
  ].join('\n');

  for (const directory of [
    'references',
    'scripts',
    'examples',
    'assets',
    'evals',
  ]) {
    await mkdir(join(skillPath, directory), { recursive: true });
    await writeFile(join(skillPath, directory, 'resource.txt'), directory);
  }
  await writeFile(join(skillPath, 'SKILL.md'), skillContent);

  const installed = await installTempSkill(
    skillPath,
    skillContent,
    'temporary-skill',
    skillsDir,
  );

  const installedSkill = await readFile(join(installed, 'SKILL.md'), 'utf8');
  assert.match(installedSkill, /^name: temporary-skill$/mu);

  for (const directory of ['references', 'scripts', 'examples', 'assets']) {
    assert.equal(
      await readFile(join(installed, directory, 'resource.txt'), 'utf8'),
      directory,
    );
  }
  await assert.rejects(access(join(installed, 'evals', 'resource.txt')));
});

test('with-skill prompt allows only directed skill resource reads', () => {
  const prompt = buildExecutorPrompt('Complete the task.', 'temporary-skill');

  assert.match(prompt, /files inside that skill directory/u);
  assert.match(prompt, /Do not read evals, grading artifacts/u);
  assert.match(prompt, /do not inspect the repository or run shell commands/u);
  assert.match(prompt, /identify the specific official source/u);
  assert.match(prompt, /relevant local skill reference/u);
  assert.doesNotMatch(
    prompt,
    /do not use extra tools after loading the skill/u,
  );
});

test('without-skill prompt still prohibits tools and local docs', () => {
  const prompt = buildExecutorPrompt('Complete the task.', undefined);

  assert.match(prompt, /Do not read local skill files or docs/u);
  assert.match(prompt, /do not use tools/u);
});

test('grader prompt prohibits unstated requirements and external facts', () => {
  const prompt = buildGraderPrompt(
    {
      expectations: ['Uses the official package.'],
      expected_output: 'An official-package example.',
      prompt: 'Show the official approach.',
    },
    "import { Button } from '@lynx-js/lynx-ui';",
    'No package example.',
  );

  assert.match(prompt, /Do not introduce additional requirements/u);
  assert.match(prompt, /Do not use unprovided external knowledge/u);
  assert.match(
    prompt,
    /candidate answer itself provides conflicting evidence/u,
  );
});
