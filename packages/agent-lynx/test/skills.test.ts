// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { type TestContext, test } from 'node:test';
import { Command } from 'commander';
import {
  discoverSkillDependencyNames,
  readSkillDocument,
  readSkillDocuments,
  registerSkillsCommand,
  renderAvailableSkills,
  renderSkillContent,
  resolveSkillRootsFromPackageRoot,
  scanSkillResources,
} from '../src/commands/skills.ts';

async function createFixture(t: TestContext): Promise<string> {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'agent-lynx-skill-'),
  );
  t.after(async () => {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });
  return path.join(temporaryDirectory, 'skill');
}

async function writeFile(
  skillRoot: string,
  relativePath: string,
  content = 'fixture',
): Promise<void> {
  const file = path.join(skillRoot, relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

async function writeSkill(
  skillRoot: string,
  options: { name?: string; description?: string; body?: string } = {},
): Promise<void> {
  await writeFile(
    skillRoot,
    'SKILL.md',
    `---\nname: ${options.name ?? 'fixture-skill'}\ndescription: ${
      options.description ?? 'Fixture description'
    }\n---\n\n${options.body ?? '# Fixture Skill\n\nFixture body.'}\n`,
  );
}

test('list is generated from SKILL.md metadata without XML escaping', async (t) => {
  const skillRoot = await createFixture(t);
  await writeSkill(skillRoot, {
    description: 'Inspect <Lynx> & act',
    body: '# Changed body',
  });

  const skill = await readSkillDocument(skillRoot);
  assert.equal(
    renderAvailableSkills([skill]),
    `<available_skills>
  <skill>
    <name>fixture-skill</name>
    <description>Inspect <Lynx> & act</description>
    <location>${path.join(skillRoot, 'SKILL.md')}</location>
  </skill>
</available_skills>`,
  );

  await writeSkill(skillRoot, {
    name: 'renamed-skill',
    description: 'Changed at the source',
  });
  assert.match(
    renderAvailableSkills([await readSkillDocument(skillRoot)]),
    /<name>renamed-skill<\/name>/,
  );
  assert.match(
    renderAvailableSkills([await readSkillDocument(skillRoot)]),
    /Changed at the source/,
  );
});

test('get strips frontmatter and lists only sorted files from skill resource roots', async (t) => {
  const skillRoot = await createFixture(t);
  await writeSkill(skillRoot, { body: '# Fixture\n\nKeep <raw> & Markdown.' });
  await Promise.all([
    writeFile(skillRoot, 'scripts/run.mjs'),
    writeFile(skillRoot, 'references/nested/guide.md'),
    writeFile(skillRoot, 'assets/icon.svg'),
    writeFile(skillRoot, 'examples/a&b.md'),
    writeFile(skillRoot, 'dist/index.mjs'),
    writeFile(skillRoot, 'README.md'),
  ]);

  const skill = await readSkillDocument(skillRoot);
  const resources = await scanSkillResources(skillRoot);
  assert.deepEqual(resources, [
    'assets/icon.svg',
    'examples/a&b.md',
    'references/nested/guide.md',
    'scripts/run.mjs',
  ]);
  assert.equal(
    renderSkillContent(skill, resources),
    `<skill_content name="fixture-skill">
# Fixture

Keep <raw> & Markdown.

Skill directory: ${skillRoot}
Relative paths in this skill are relative to the skill directory.

<skill_resources>
  <file>assets/icon.svg</file>
  <file>examples/a&b.md</file>
  <file>references/nested/guide.md</file>
  <file>scripts/run.mjs</file>
</skill_resources>
</skill_content>`,
  );
});

test('resource scanning ignores absent roots and does not follow symlinks', async (t) => {
  const skillRoot = await createFixture(t);
  await writeSkill(skillRoot);
  await writeFile(skillRoot, 'references/real.md');

  const outsideDirectory = path.join(path.dirname(skillRoot), 'outside');
  await writeFile(outsideDirectory, 'secret.md');
  await fs.symlink(
    path.join(outsideDirectory, 'secret.md'),
    path.join(skillRoot, 'references', 'file-link.md'),
  );
  await fs.symlink(
    outsideDirectory,
    path.join(skillRoot, 'references', 'directory-link'),
  );
  await fs.symlink(outsideDirectory, path.join(skillRoot, 'examples'));

  assert.deepEqual(await scanSkillResources(skillRoot), ['references/real.md']);
});

test('list and get support multiple canonical package skills', async (t) => {
  const devtoolSkillRoot = await createFixture(t);
  const secondSkillRoot = await createFixture(t);
  await writeSkill(devtoolSkillRoot, {
    name: 'lynx-devtool',
    description: 'Debug Lynx',
  });
  await writeSkill(secondSkillRoot, {
    name: 'lynx-trace-analysis',
    description: 'Analyze a trace',
    body: '# Trace analysis',
  });
  await writeFile(secondSkillRoot, 'references/workflow.md');

  const skillRoots = [devtoolSkillRoot, secondSkillRoot];
  const skills = await readSkillDocuments(skillRoots);
  assert.deepEqual(
    skills.map((skill) => skill.name),
    ['lynx-devtool', 'lynx-trace-analysis'],
  );
  const renderedList = renderAvailableSkills(skills);
  assert.ok(
    renderedList.indexOf('<name>lynx-devtool</name>') <
      renderedList.indexOf('<name>lynx-trace-analysis</name>'),
  );

  const output: string[] = [];
  const errors: string[] = [];
  t.mock.method(console, 'log', (value: unknown) => output.push(String(value)));
  t.mock.method(console, 'error', (value: unknown) =>
    errors.push(String(value)),
  );
  const originalExitCode = process.exitCode;
  t.after(() => {
    process.exitCode = originalExitCode;
  });

  const canonicalProgram = new Command().exitOverride();
  registerSkillsCommand(canonicalProgram, { skillRoots });
  await canonicalProgram.parseAsync([
    'node',
    'agent-lynx',
    'skills',
    'get',
    'lynx-devtool',
  ]);
  assert.match(output.at(-1) ?? '', /^<skill_content name="lynx-devtool">/);

  const secondProgram = new Command().exitOverride();
  registerSkillsCommand(secondProgram, { skillRoots });
  await secondProgram.parseAsync([
    'node',
    'agent-lynx',
    'skills',
    'get',
    'lynx-trace-analysis',
  ]);
  assert.match(
    output.at(-1) ?? '',
    /^<skill_content name="lynx-trace-analysis">/,
  );
  assert.match(output.at(-1) ?? '', /<file>references\/workflow\.md<\/file>/);

  const program = new Command().exitOverride();
  registerSkillsCommand(program, { skillRoots });
  await program.parseAsync([
    'node',
    'agent-lynx',
    'skills',
    'get',
    'other-skill',
  ]);
  assert.equal(process.exitCode, 1);
  assert.deepEqual(errors, [
    'Unknown skill "other-skill". Available skills: lynx-devtool, lynx-trace-analysis.',
  ]);
});

test('default discovery includes every supported skill dependency without hardcoded package names', async (t) => {
  const packageRoot = await createFixture(t);
  await writeSkill(packageRoot, {
    name: 'root-skill',
    description: 'Root skill',
  });
  await writeFile(
    packageRoot,
    'package.json',
    JSON.stringify({
      name: '@example/root-skill',
      dependencies: {
        '@lynx-js/skill-beta': '1.0.0',
        '@other/skill-ignored': '1.0.0',
        '@lynx-js/devtool-connector': '1.0.0',
        '@lynx-js/skill-alpha': '1.0.0',
      },
      devDependencies: {
        '@lynx-js/skill-dev-only': '1.0.0',
      },
    }),
  );

  const alphaRoot = path.join(packageRoot, 'node_modules/@lynx-js/skill-alpha');
  const betaRoot = path.join(packageRoot, 'node_modules/@lynx-js/skill-beta');
  await Promise.all([
    writeFile(
      alphaRoot,
      'package.json',
      JSON.stringify({ name: '@lynx-js/skill-alpha' }),
    ),
    writeSkill(alphaRoot, { name: 'alpha', description: 'Alpha skill' }),
    writeFile(
      betaRoot,
      'package.json',
      JSON.stringify({ name: '@lynx-js/skill-beta' }),
    ),
    writeSkill(betaRoot, { name: 'beta', description: 'Beta skill' }),
  ]);
  const [resolvedAlphaRoot, resolvedBetaRoot] = await Promise.all([
    fs.realpath(alphaRoot),
    fs.realpath(betaRoot),
  ]);

  assert.deepEqual(discoverSkillDependencyNames(packageRoot), [
    '@lynx-js/skill-alpha',
    '@lynx-js/skill-beta',
  ]);
  assert.deepEqual(resolveSkillRootsFromPackageRoot(packageRoot), [
    packageRoot,
    resolvedAlphaRoot,
    resolvedBetaRoot,
  ]);
  assert.deepEqual(
    (
      await readSkillDocuments(resolveSkillRootsFromPackageRoot(packageRoot))
    ).map((skill) => skill.name),
    ['root-skill', 'alpha', 'beta'],
  );
});

test('declared skill dependencies must be installed and package-shaped', async (t) => {
  const packageRoot = await createFixture(t);
  await writeSkill(packageRoot);
  await writeFile(
    packageRoot,
    'package.json',
    JSON.stringify({ dependencies: { '@lynx-js/skill-missing': '1.0.0' } }),
  );

  assert.throws(
    () => resolveSkillRootsFromPackageRoot(packageRoot),
    /Cannot resolve declared skill dependency "@lynx-js\/skill-missing"/,
  );
});

test('duplicate canonical skill names fail with both source locations', async (t) => {
  const firstSkillRoot = await createFixture(t);
  const secondSkillRoot = await createFixture(t);
  await writeSkill(firstSkillRoot, { name: 'duplicate' });
  await writeSkill(secondSkillRoot, { name: 'duplicate' });

  await assert.rejects(
    readSkillDocuments([firstSkillRoot, secondSkillRoot]),
    new RegExp(
      `Duplicate skill name "duplicate" in ${path.join(firstSkillRoot, 'SKILL.md')} and ${path.join(
        secondSkillRoot,
        'SKILL.md',
      )}\\.`,
    ),
  );
});

test('invalid SKILL.md frontmatter fails with an actionable error', async (t) => {
  const skillRoot = await createFixture(t);
  await writeFile(skillRoot, 'SKILL.md', '# Missing frontmatter\n');
  await assert.rejects(
    readSkillDocument(skillRoot),
    /must start with YAML frontmatter/,
  );

  await writeFile(
    skillRoot,
    'SKILL.md',
    '---\nname: incomplete\n---\n\n# Missing description\n',
  );
  await assert.rejects(
    readSkillDocument(skillRoot),
    /must define a non-empty description/,
  );
});
