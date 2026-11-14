// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { discoverSkillSuites } from './discover_suites.mjs';
import { VALID_SCENARIOS } from './run_trigger_online.mjs';

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

export async function validateSuite(suite) {
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
    trigger_multi_skill: 0,
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
      skill.name,
    );
    result.trigger_evals = trigger.total;
    result.trigger_positive = trigger.positive;
    result.trigger_negative = trigger.negative;
    result.trigger_multi_skill = trigger.multiSkill;

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
      typeof item.expected_output !== 'string'
      || item.expected_output.trim().length < 10
    ) {
      throw new Error(`${path} eval id ${id} missing expected_output`);
    }
    if (
      !Array.isArray(item.files)
      || item.files.some((file) => typeof file !== 'string')
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

function extractSkillEntryName(entry, path, index, field) {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) {
      throw new Error(`${path} item #${index} ${field} has empty skill name`);
    }
    return trimmed;
  }
  assertObject(entry, `${path} item #${index} ${field} entry`);
  const name = typeof entry.name === 'string' ? entry.name.trim() : '';
  const desc = typeof entry.description === 'string'
    ? entry.description.trim()
    : '';
  const skillPath = typeof entry.skill_path === 'string'
    ? entry.skill_path.trim()
    : '';
  if (!name) {
    throw new Error(
      `${path} item #${index} ${field} entry missing valid \`name\``,
    );
  }
  if (desc.length < 10 && !skillPath) {
    throw new Error(
      `${path} item #${index} ${field} entry \`${name}\` missing valid \`description\``,
    );
  }
  return name;
}

export function validateTriggerEvalItem(item, index, path, skillName) {
  assertObject(item, `${path} item #${index}`);
  if (typeof item.query !== 'string' || item.query.trim().length < 10) {
    throw new Error(`${path} item #${index} query too short`);
  }
  if (typeof item.should_trigger !== 'boolean') {
    throw new Error(
      `${path} item #${index} should_trigger must be boolean`,
    );
  }

  const scenario = item.scenario;
  if (
    scenario !== undefined
    && (typeof scenario !== 'string' || !VALID_SCENARIOS.has(scenario))
  ) {
    throw new Error(
      `${path} item #${index} has invalid scenario \`${scenario}\``,
    );
  }

  const coNames = [];
  if (item.co_installed_skills !== undefined) {
    if (
      !Array.isArray(item.co_installed_skills)
      || item.co_installed_skills.length === 0
    ) {
      throw new Error(
        `${path} item #${index} co_installed_skills must be a non-empty array`,
      );
    }
    for (const entry of item.co_installed_skills) {
      const name = extractSkillEntryName(
        entry,
        path,
        index,
        'co_installed_skills',
      );
      if (skillName && name === skillName) {
        throw new Error(
          `${path} item #${index} co_installed_skills must not duplicate target skill \`${skillName}\``,
        );
      }
      if (coNames.includes(name)) {
        throw new Error(
          `${path} item #${index} duplicate skill \`${name}\` in co_installed_skills`,
        );
      }
      coNames.push(name);
    }
  }

  const competingNames = [];
  if (item.competing_skills !== undefined) {
    if (
      !Array.isArray(item.competing_skills)
      || item.competing_skills.length === 0
    ) {
      throw new Error(
        `${path} item #${index} competing_skills must be a non-empty array`,
      );
    }
    for (const entry of item.competing_skills) {
      const name = extractSkillEntryName(
        entry,
        path,
        index,
        'competing_skills',
      );
      if (skillName && name === skillName) {
        throw new Error(
          `${path} item #${index} competing_skills must not duplicate target skill \`${skillName}\``,
        );
      }
      if (coNames.includes(name) || competingNames.includes(name)) {
        throw new Error(
          `${path} item #${index} duplicate skill \`${name}\` in competing_skills`,
        );
      }
      competingNames.push(name);
    }
  }

  const installedSet = new Set([...coNames, ...competingNames]);
  if (skillName) installedSet.add(skillName);

  let expectedList = [];
  if (item.expected_skills !== undefined) {
    if (
      !Array.isArray(item.expected_skills)
      || item.expected_skills.some(
        (entry) => typeof entry !== 'string' || !entry.trim(),
      )
    ) {
      throw new Error(
        `${path} item #${index} expected_skills must be an array of strings`,
      );
    }
    expectedList = item.expected_skills.map((entry) => entry.trim());
    if (skillName) {
      if (item.should_trigger && !expectedList.includes(skillName)) {
        throw new Error(
          `${path} item #${index} has should_trigger=true but target \`${skillName}\` is missing from expected_skills`,
        );
      }
      if (!item.should_trigger && expectedList.includes(skillName)) {
        throw new Error(
          `${path} item #${index} has should_trigger=false but target \`${skillName}\` is in expected_skills`,
        );
      }
      const unknownExpected = expectedList.filter(
        (name) => !installedSet.has(name),
      );
      if (unknownExpected.length > 0) {
        throw new Error(
          `${path} item #${index} expected_skills references uninstalled skill(s): ${
            unknownExpected.join(', ')
          }`,
        );
      }
    }
  }

  if (item.forbidden_skills !== undefined) {
    if (
      !Array.isArray(item.forbidden_skills)
      || item.forbidden_skills.some(
        (entry) => typeof entry !== 'string' || !entry.trim(),
      )
    ) {
      throw new Error(
        `${path} item #${index} forbidden_skills must be an array of strings`,
      );
    }
    const forbiddenList = item.forbidden_skills.map((entry) => entry.trim());
    const overlap = expectedList.filter((name) => forbiddenList.includes(name));
    if (overlap.length > 0) {
      throw new Error(
        `${path} item #${index} has overlapping expected_skills and forbidden_skills: ${
          overlap.join(', ')
        }`,
      );
    }
    if (skillName && item.should_trigger && forbiddenList.includes(skillName)) {
      throw new Error(
        `${path} item #${index} has should_trigger=true but target \`${skillName}\` is in forbidden_skills`,
      );
    }
    if (skillName) {
      const unknownForbidden = forbiddenList.filter(
        (name) => !installedSet.has(name),
      );
      if (unknownForbidden.length > 0) {
        throw new Error(
          `${path} item #${index} forbidden_skills references uninstalled skill(s): ${
            unknownForbidden.join(', ')
          }`,
        );
      }
    }
  }

  if (scenario === 'own_multi_trigger') {
    if (coNames.length === 0) {
      throw new Error(
        `${path} item #${index} scenario \`own_multi_trigger\` requires co_installed_skills`,
      );
    }
    if (expectedList.length < 2) {
      throw new Error(
        `${path} item #${index} scenario \`own_multi_trigger\` requires at least 2 expected_skills`,
      );
    }
  } else if (scenario === 'own_single_trigger') {
    if (coNames.length === 0) {
      throw new Error(
        `${path} item #${index} scenario \`own_single_trigger\` requires co_installed_skills`,
      );
    }
  } else if (scenario === 'similar_skill_present') {
    if (competingNames.length === 0) {
      throw new Error(
        `${path} item #${index} scenario \`similar_skill_present\` requires competing_skills`,
      );
    }
  } else if (scenario === 'similar_skill_requested') {
    if (competingNames.length === 0 && coNames.length === 0) {
      throw new Error(
        `${path} item #${index} scenario \`similar_skill_requested\` requires competing_skills or co_installed_skills`,
      );
    }
    if (item.should_trigger) {
      throw new Error(
        `${path} item #${index} scenario \`similar_skill_requested\` must have should_trigger=false`,
      );
    }
    if (expectedList.length === 0) {
      throw new Error(
        `${path} item #${index} scenario \`similar_skill_requested\` requires non-empty expected_skills`,
      );
    }
  }

  const isMultiSkill = coNames.length > 0
    || competingNames.length > 0
    || expectedList.length > 1;
  return {
    isMultiSkill,
    shouldTrigger: item.should_trigger,
  };
}

export async function validateTriggerEvals(path, skillName) {
  const payload = await readJson(path);
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }

  const items = [...payload];
  const sidecars = [join(resolve(path, '..'), 'trigger_multi_eval.json')];
  if (skillName) {
    let dir = resolve(path, '..');
    while (true) {
      const candidate = join(
        dir,
        'evals',
        skillName,
        'trigger_multi_eval.json',
      );
      if (existsSync(candidate)) {
        sidecars.push(candidate);
        break;
      }
      const parent = resolve(dir, '..');
      if (parent === dir) break;
      dir = parent;
    }
  }
  const seenSidecars = new Set();
  for (const sidecarPath of sidecars) {
    const resolvedSidecar = resolve(sidecarPath);
    if (seenSidecars.has(resolvedSidecar) || !existsSync(resolvedSidecar)) {
      continue;
    }
    seenSidecars.add(resolvedSidecar);
    const sidecarPayload = await readJson(resolvedSidecar);
    if (!Array.isArray(sidecarPayload) || sidecarPayload.length === 0) {
      throw new Error(`${resolvedSidecar} must be a non-empty array`);
    }
    items.push(...sidecarPayload);
  }

  let positive = 0;
  let negative = 0;
  let multiSkill = 0;
  for (const [index, item] of items.entries()) {
    const validated = validateTriggerEvalItem(
      item,
      index + 1,
      path,
      skillName,
    );
    if (validated.shouldTrigger) positive += 1;
    else negative += 1;
    if (validated.isMultiSkill) multiSkill += 1;
  }
  if (positive === 0 || negative === 0) {
    throw new Error(`${path} must contain both positive and negative cases`);
  }
  return {
    multiSkill,
    negative,
    positive,
    total: items.length,
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
    throw new Error(`invalid JSON in ${path}: ${message}`, { cause: error });
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
    `[skill-eval] definition_score=${summary.score.toFixed(1)} `
      + `passed=${summary.passed}/${summary.total}`,
  );
  for (const result of report.results) {
    const status = result.pass ? 'PASS' : 'FAIL';
    console.info(
      `[skill-eval] ${status} ${result.skill_name}: `
        + `task_evals=${result.task_evals} `
        + `expectations=${result.task_expectations} `
        + `trigger_evals=${result.trigger_evals} `
        + `multi_skill=${result.trigger_multi_skill ?? 0} `
        + `score=${result.score.toFixed(1)}`,
    );
    for (const error of result.errors) {
      console.error(`[skill-eval] ERROR ${result.skill_name}: ${error}`);
    }
  }
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

if (
  process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
