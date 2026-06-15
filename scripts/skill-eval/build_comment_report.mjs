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
  const taskErrorFile = args.taskErrorFile
    ? resolve(args.taskErrorFile)
    : undefined;
  const taskSkipFile = args.taskSkipFile
    ? resolve(args.taskSkipFile)
    : undefined;
  const triggerErrorFile = args.triggerErrorFile
    ? resolve(args.triggerErrorFile)
    : undefined;
  const triggerSkipFile = args.triggerSkipFile
    ? resolve(args.triggerSkipFile)
    : undefined;

  const definitionReport = await readJson(definitionReportPath);
  if (definitionReport.kind !== 'skill_eval_definition') {
    throw new Error(
      `${definitionReportPath} must contain a skill_eval_definition report.`,
    );
  }

  const onlineReports = await readOnlineReports(taskReportDir);

  const report = {
    reports: [definitionReport, ...onlineReports],
    task_error:
      taskErrorFile && existsSync(taskErrorFile)
        ? (await readFile(taskErrorFile, 'utf8')).trim()
        : undefined,
    task_skip:
      taskSkipFile && existsSync(taskSkipFile)
        ? (await readFile(taskSkipFile, 'utf8')).trim()
        : undefined,
    trigger_error:
      triggerErrorFile && existsSync(triggerErrorFile)
        ? (await readFile(triggerErrorFile, 'utf8')).trim()
        : undefined,
    trigger_skip:
      triggerSkipFile && existsSync(triggerSkipFile)
        ? (await readFile(triggerSkipFile, 'utf8')).trim()
        : undefined,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.info(
    `[skill-eval] comment_report=${outputPath} definition=1 online=${onlineReports.length}`,
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
    if (arg === '--task-error-file') {
      args.taskErrorFile = argv[++index];
      continue;
    }
    if (arg === '--task-skip-file') {
      args.taskSkipFile = argv[++index];
      continue;
    }
    if (arg === '--trigger-error-file') {
      args.triggerErrorFile = argv[++index];
      continue;
    }
    if (arg === '--trigger-skip-file') {
      args.triggerSkipFile = argv[++index];
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

async function readOnlineReports(root) {
  if (!existsSync(root)) return [];

  const reports = [];
  for (const path of await findJsonFiles(root)) {
    if (
      basename(path) !== 'task-online-report.json' &&
      basename(path) !== 'trigger-online-report.json'
    ) {
      continue;
    }
    const report = await readJson(path);
    if (report.kind === 'task_eval' || report.kind === 'trigger_eval') {
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

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}
