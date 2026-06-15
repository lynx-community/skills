// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { discoverSkillSuites, suiteSlug } from './discover_suites.mjs';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(args.repoRoot ?? process.cwd());
  const outputRoot = resolve(args.outputRoot ?? join(repoRoot, 'artifacts'));
  const skipSkills = parseList(args.skipSkills);
  const suites = await discoverSkillSuites(repoRoot);
  const failures = [];

  for (const suite of suites) {
    const slug = suiteSlug(suite);
    if (skipSkills.has(slug) || skipSkills.has(suite.packageName)) {
      console.info(`[skill-eval] task_online skip skill=${slug}`);
      continue;
    }

    const evalIds = await resolveEvalIds(suite, args);
    const commandArgs = [
      join(repoRoot, 'scripts', 'skill-eval', 'run_task_online.mjs'),
      '--skill-path',
      suite.skillPath,
      '--eval-path',
      suite.evalPath,
      '--repo-root',
      repoRoot,
      '--model',
      args.model ?? 'opencode/gpt-5-nano',
      '--grader-model',
      args.graderModel ?? args.model ?? 'opencode/gpt-5-nano',
      '--timeout',
      String(args.timeout ?? 300),
      '--min-pass-rate',
      String(args.minPassRate ?? 0.85),
      '--output-dir',
      join(outputRoot, slug, 'task-eval'),
    ];
    if (evalIds.length > 0) {
      commandArgs.push('--eval-ids', evalIds.join(','));
    }

    console.info(
      `[skill-eval] task_online skill=${slug} eval_ids=${evalIds.join(',') || 'all'}`,
    );
    if (args.dryRun) {
      console.info(
        [process.execPath, ...commandArgs]
          .map((part) => JSON.stringify(part))
          .join(' '),
      );
      continue;
    }

    const exitCode = await spawnInherited(
      process.execPath,
      commandArgs,
      repoRoot,
    );
    if (exitCode !== 0) {
      failures.push({ exitCode, slug });
    }
  }

  if (failures.length > 0) {
    console.error(
      `[skill-eval] ${failures.length} task eval suite${failures.length === 1 ? '' : 's'} failed: ${failures
        .map((failure) => `${failure.slug}(${failure.exitCode})`)
        .join(', ')}`,
    );
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--repo-root') args.repoRoot = argv[++index];
    else if (arg === '--model') args.model = argv[++index];
    else if (arg === '--grader-model') args.graderModel = argv[++index];
    else if (arg === '--timeout') args.timeout = Number(argv[++index]);
    else if (arg === '--min-pass-rate')
      args.minPassRate = Number(argv[++index]);
    else if (arg === '--eval-ids') args.evalIds = argv[++index];
    else if (arg === '--max-evals-per-skill')
      args.maxEvalsPerSkill = Number(argv[++index]);
    else if (arg === '--skip-skills') args.skipSkills = argv[++index];
    else if (arg === '--output-root') args.outputRoot = argv[++index];
    else if (arg === '--dry-run') args.dryRun = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

async function resolveEvalIds(suite, args) {
  if (args.evalIds) {
    return args.evalIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id));
  }

  if (!Number.isInteger(args.maxEvalsPerSkill) || args.maxEvalsPerSkill <= 0) {
    return [];
  }

  const evals = (await readJson(join(suite.evalPath, 'evals.json'))).evals;
  if (!Array.isArray(evals)) return [];
  return evals
    .map((evalItem) => evalItem.id)
    .filter((id) => Number.isInteger(id))
    .slice(0, args.maxEvalsPerSkill);
}

function parseList(value) {
  return new Set(
    String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function spawnInherited(command, args, cwd) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => resolvePromise(code ?? 1));
  });
}
