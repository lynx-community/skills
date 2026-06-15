// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { discoverSkillSuites } from './discover_suites.mjs';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = resolve(args.repoRoot ?? process.cwd());
  const suites = args.all
    ? await discoverSkillSuites(repoRoot)
    : [buildSingleSuite(args)];

  const results = [];
  for (const suite of suites) {
    results.push(await validateSuite(suite));
  }

  const passed = results.filter((result) => result.pass).length;
  const total = results.length;
  const passRate = total === 0 ? 0 : passed / total;
  const report = {
    kind: 'skill_eval_definition',
    report_title: 'Skill Eval Definitions',
    summary: {
      passed,
      total,
      pass_rate: round(passRate),
      score: round(passRate * 100),
    },
    results,
  };

  if (args.jsonOutput) {
    const outputPath = resolve(repoRoot, args.jsonOutput);
    await mkdir(resolve(outputPath, '..'), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  printReport(report);
  if (total === 0 || passed !== total) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      continue;
    }
    if (arg === '--all') {
      args.all = true;
      continue;
    }
    if (arg === '--skill-path') {
      args.skillPath = argv[++index];
      continue;
    }
    if (arg === '--eval-path') {
      args.evalPath = argv[++index];
      continue;
    }
    if (arg === '--json-output') {
      args.jsonOutput = argv[++index];
      continue;
    }
    if (arg === '--repo-root') {
      args.repoRoot = argv[++index];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function buildSingleSuite(args) {
  if (!args.skillPath) {
    throw new Error('Pass --all or --skill-path <path>.');
  }
  const skillPath = resolve(args.skillPath);
  return {
    evalPath: args.evalPath ? resolve(args.evalPath) : join(skillPath, 'evals'),
    skillPath,
  };
}

async function validateSuite(suite) {
  const skillMdPath = join(suite.skillPath, 'SKILL.md');
  const result = {
    errors: [],
    eval_path: suite.evalPath,
    package_name: suite.packageName ?? null,
    pass: false,
    score: 0,
    skill_name: basename(suite.skillPath),
    skill_path: suite.skillPath,
    task_evals: 0,
    task_expectations: 0,
    trigger_evals: 0,
    trigger_negative: 0,
    trigger_positive: 0,
  };

  try {
    if (!existsSync(skillMdPath)) {
      throw new Error(`missing SKILL.md: ${skillMdPath}`);
    }
    const skill = parseSkillFrontmatter(await readFile(skillMdPath, 'utf8'));
    result.skill_name = skill.name;

    const task = await validateTaskEvals(
      skill.name,
      join(suite.evalPath, 'evals.json'),
    );
    result.task_evals = task.taskEvals;
    result.task_expectations = task.expectations;

    const trigger = await validateTriggerEvals(
      join(suite.evalPath, 'trigger_eval.json'),
    );
    result.trigger_evals = trigger.total;
    result.trigger_positive = trigger.positive;
    result.trigger_negative = trigger.negative;

    result.pass = true;
    result.score = 100;
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

function parseSkillFrontmatter(content) {
  const lines = content.split(/\r?\n/u);
  if (lines[0]?.trim() !== '---') {
    throw new Error('SKILL.md missing frontmatter');
  }

  const frontmatter = [];
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '---') break;
    frontmatter.push(line);
  }

  const nameLine = frontmatter.find((line) => line.startsWith('name:'));
  const name = nameLine
    ?.slice('name:'.length)
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (!name) {
    throw new Error('SKILL.md frontmatter missing name');
  }
  return { name };
}

async function validateTaskEvals(skillName, path) {
  const payload = await readJson(path);
  assertObject(payload, `${path} root`);
  if (payload.skill_name !== skillName) {
    throw new Error(
      `${path} skill_name must match SKILL.md name \`${skillName}\``,
    );
  }
  if (!Array.isArray(payload.evals) || payload.evals.length === 0) {
    throw new Error(`${path} evals must be a non-empty array`);
  }

  const ids = new Set();
  const names = new Set();
  let expectations = 0;
  for (const [index, item] of payload.evals.entries()) {
    assertObject(item, `${path} eval #${index + 1}`);
    const id = item.id;
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`${path} eval #${index + 1} has invalid id`);
    }
    if (ids.has(id)) {
      throw new Error(`${path} duplicate eval id ${id}`);
    }
    ids.add(id);

    if (typeof item.name !== 'string' || item.name.trim() === '') {
      throw new Error(`${path} eval id ${id} missing name`);
    }
    if (names.has(item.name)) {
      throw new Error(`${path} duplicate eval name ${item.name}`);
    }
    names.add(item.name);

    if (typeof item.prompt !== 'string' || item.prompt.trim().length < 20) {
      throw new Error(`${path} eval id ${id} prompt too short`);
    }
    if (
      typeof item.expected_output !== 'string' ||
      item.expected_output.trim().length < 10
    ) {
      throw new Error(`${path} eval id ${id} missing expected_output`);
    }
    if (
      !Array.isArray(item.files) ||
      item.files.some((file) => typeof file !== 'string')
    ) {
      throw new Error(
        `${path} eval id ${id} files must be an array of strings`,
      );
    }
    if (!Array.isArray(item.expectations) || item.expectations.length < 3) {
      throw new Error(
        `${path} eval id ${id} must have at least 3 expectations`,
      );
    }
    if (
      item.expectations.some(
        (expectation) =>
          typeof expectation !== 'string' || expectation.trim() === '',
      )
    ) {
      throw new Error(`${path} eval id ${id} has invalid expectation entries`);
    }
    expectations += item.expectations.length;
  }

  return {
    expectations,
    taskEvals: payload.evals.length,
  };
}

async function validateTriggerEvals(path) {
  const payload = await readJson(path);
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }

  let positive = 0;
  let negative = 0;
  for (const [index, item] of payload.entries()) {
    assertObject(item, `${path} item #${index + 1}`);
    if (typeof item.query !== 'string' || item.query.trim().length < 10) {
      throw new Error(`${path} item #${index + 1} query too short`);
    }
    if (typeof item.should_trigger !== 'boolean') {
      throw new Error(
        `${path} item #${index + 1} should_trigger must be boolean`,
      );
    }
    if (item.should_trigger) positive += 1;
    else negative += 1;
  }
  if (positive === 0 || negative === 0) {
    throw new Error(`${path} must contain both positive and negative cases`);
  }
  return {
    negative,
    positive,
    total: payload.length,
  };
}

async function readJson(path) {
  if (!existsSync(path)) {
    throw new Error(`missing eval file: ${path}`);
  }
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`invalid JSON in ${path}: ${message}`);
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function printReport(report) {
  const { summary } = report;
  console.info(
    `[skill-eval] definition_score=${summary.score.toFixed(1)} ` +
      `passed=${summary.passed}/${summary.total}`,
  );
  for (const result of report.results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    console.info(
      `[skill-eval] ${status} ${result.skill_name}: ` +
        `task_evals=${result.task_evals} ` +
        `expectations=${result.task_expectations} ` +
        `trigger_evals=${result.trigger_evals} ` +
        `score=${result.score.toFixed(1)}`,
    );
    for (const error of result.errors) {
      console.error(`[skill-eval] ERROR ${result.skill_name}: ${error}`);
    }
  }
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
