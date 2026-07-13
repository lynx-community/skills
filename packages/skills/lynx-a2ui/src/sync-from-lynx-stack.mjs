// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_REPO = 'https://github.com/lynx-family/lynx-stack.git';
const DEFAULT_REF = 'main';
const DEFAULT_SOURCE_PATH =
  'packages/genui/a2ui/skills/lynx-a2ui/SKILL.md';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');

function parseArgs(argv) {
  const options = {
    repo: process.env.LYNX_STACK_REPO ?? DEFAULT_REPO,
    ref: process.env.LYNX_STACK_REF ?? DEFAULT_REF,
    sourcePath: process.env.LYNX_STACK_SKILL_PATH ?? DEFAULT_SOURCE_PATH,
    out: resolve(packageDir, 'SKILL.md'),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case '--repo':
        if (next == null) throw new Error('--repo requires a value');
        options.repo = next;
        i += 1;
        break;
      case '--ref':
        if (next == null) throw new Error('--ref requires a value');
        options.ref = next;
        i += 1;
        break;
      case '--source-path':
        if (next == null) throw new Error('--source-path requires a value');
        options.sourcePath = next;
        i += 1;
        break;
      case '--out':
        if (next == null) throw new Error('--out requires a value');
        options.out = resolve(process.cwd(), next);
        i += 1;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node src/sync-from-lynx-stack.mjs [options]

Options:
  --repo <url>          Lynx Stack git repository
  --ref <ref>           Commit, branch, tag, or pull ref to fetch
  --source-path <path>  Skill path inside Lynx Stack
  --out <path>          Output SKILL.md path

Environment:
  LYNX_STACK_REPO
  LYNX_STACK_REF
  LYNX_STACK_SKILL_PATH`);
}

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  }).trim();
}

async function readSkillFromGit(options) {
  const tempDir = await mkdtemp(resolve(tmpdir(), 'lynx-a2ui-skill-'));

  try {
    git(['init', '--quiet'], tempDir);
    git(['remote', 'add', 'origin', options.repo], tempDir);
    git(['fetch', '--depth=1', 'origin', options.ref], tempDir);

    return git(['show', `FETCH_HEAD:${options.sourcePath}`], tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function validateSkill(content, options) {
  if (!content.trim()) {
    throw new Error(
      `Fetched empty skill from ${options.repo} ${options.ref}:${options.sourcePath}`,
    );
  }

  if (!content.startsWith('---\n')) {
    throw new Error('Fetched skill must start with frontmatter');
  }

  if (!/^name:\s*lynx-a2ui$/m.test(content)) {
    throw new Error('Fetched skill frontmatter must include name: lynx-a2ui');
  }
}

const options = parseArgs(process.argv.slice(2));
const skill = `${await readSkillFromGit(options)}\n`;
validateSkill(skill, options);

await writeFile(options.out, skill);

const written = await readFile(options.out, 'utf8');
validateSkill(written, options);

console.error(
  `Synced lynx-a2ui skill from ${options.repo} ${options.ref}:${options.sourcePath}`,
);
