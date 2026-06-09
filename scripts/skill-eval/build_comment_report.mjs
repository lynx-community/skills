// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const definitionReportPath = resolveRequired(
    args.definitionReport,
    '--definition-report',
  );
  const outputPath = resolveRequired(args.output, '--output');
  const taskReportDir = resolve(args.taskReportDir ?? dirname(outputPath));

  const definitionReport = await readJson(definitionReportPath);
  if (definitionReport.kind !== 'skill_eval_definition') {
    throw new Error(
      `${definitionReportPath} must contain a skill_eval_definition report.`,
    );
  }

  const taskReports = await readTaskReports(taskReportDir);
  const taskReportsBySkill = new Map(
    taskReports.map((report) => [report.skill_name, report]),
  );
  const estimateReports = [];

  for (const result of definitionReport.results ?? []) {
    const skillName = stringValue(result.skill_name);
    if (!skillName || taskReportsBySkill.has(skillName)) continue;
    estimateReports.push(buildEstimateTaskReport(result));
  }

  const report = {
    reports: [definitionReport, ...taskReports, ...estimateReports],
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.info(
    `[skill-eval] comment_report=${outputPath} definition=1 task=${taskReports.length} estimate=${estimateReports.length}`,
  );
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--definition-report') {
      args.definitionReport = argv[++index];
      continue;
    }
    if (arg === '--task-report-dir') {
      args.taskReportDir = argv[++index];
      continue;
    }
    if (arg === '--output') {
      args.output = argv[++index];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function resolveRequired(value, name) {
  if (!value) throw new Error(`Missing required argument ${name}.`);
  return resolve(value);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readTaskReports(root) {
  if (!existsSync(root)) return [];

  const reports = [];
  for (const path of await findJsonFiles(root)) {
    if (basename(path) !== 'task-online-report.json') continue;
    const report = await readJson(path);
    if (report.kind === 'task_eval') {
      reports.push(report);
    }
  }
  return reports.sort((left, right) =>
    stringValue(left.skill_name).localeCompare(stringValue(right.skill_name)),
  );
}

async function findJsonFiles(root) {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(entry.parentPath, entry.name));
}

function buildEstimateTaskReport(result) {
  const skillName = stringValue(result.skill_name) || 'unknown';
  const total = Math.max(1, numericValue(result.task_expectations, 0));
  const withPassed = result.pass ? total : 0;
  const withoutPassed = 0;
  const withPassRate = withPassed / total;
  const withoutPassRate = withoutPassed / total;

  return {
    estimate: true,
    kind: 'task_eval',
    min_pass_rate: 0,
    model: 'ci-definition-estimate',
    report_title: `skills/${skillName} Task Eval Estimate`,
    results: [],
    skill_name: skillName,
    source: 'ci_definition_estimate',
    summary: {
      min_pass_rate: 0,
      pass_rate: round(withPassRate),
      passed: withPassed,
      total,
    },
    config_summary: {
      delta: { pass_rate: round(withPassRate - withoutPassRate) },
      with_skill: {
        pass_rate: round(withPassRate),
        passed: withPassed,
        total,
      },
      without_skill: {
        pass_rate: round(withoutPassRate),
        passed: withoutPassed,
        total,
      },
    },
  };
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function numericValue(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
