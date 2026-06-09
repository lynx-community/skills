// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const OPENCODE_SKILLS_DIR = join(process.env.HOME ?? '', '.agents', 'skills');

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skillPath = resolveRequired(args.skillPath, '--skill-path');
  const evalPath = resolve(args.evalPath ?? join(skillPath, 'evals'));
  const skillMdPath = join(skillPath, 'SKILL.md');
  const evalFile = join(evalPath, 'trigger_eval.json');
  const repoRoot = resolve(args.repoRoot ?? process.cwd());

  if (!existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found: ${skillMdPath}`);
  }
  if (!existsSync(evalFile)) {
    throw new Error(`trigger_eval.json not found: ${evalFile}`);
  }

  const skill = parseSkillMd(await readFile(skillMdPath, 'utf8'));
  const evals = JSON.parse(await readFile(evalFile, 'utf8'));
  if (!Array.isArray(evals) || evals.length === 0) {
    throw new Error(`${evalFile} must contain a non-empty array`);
  }

  const model = args.model ?? 'opencode/gpt-5-nano';
  const runsPerQuery = Number(args.runsPerQuery ?? 1);
  const timeout = Number(args.timeout ?? 90);
  const triggerThreshold = Number(args.triggerThreshold ?? 0.5);
  const minPassRate = Number(args.minPassRate ?? 0.75);
  const outputPath = args.output ? resolve(args.output) : undefined;

  const results = [];
  const summary = {
    negative: { passed: 0, total: 0 },
    positive: { passed: 0, total: 0 },
    passed: 0,
    total: 0,
  };

  for (const [index, evalItem] of evals.entries()) {
    const query = stringRequired(
      evalItem.query,
      `trigger eval #${index + 1} query`,
    );
    const shouldTrigger = booleanRequired(
      evalItem.should_trigger,
      `trigger eval #${index + 1} should_trigger`,
    );
    let triggers = 0;
    const errors = [];

    for (let run = 0; run < runsPerQuery; run += 1) {
      try {
        if (
          await runTriggerProbe({
            model,
            query,
            repoRoot,
            skill,
            timeout,
          })
        ) {
          triggers += 1;
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    const triggerRate = runsPerQuery === 0 ? 0 : triggers / runsPerQuery;
    const pass = shouldTrigger
      ? triggerRate >= triggerThreshold
      : triggerRate < triggerThreshold;
    const bucket = shouldTrigger ? summary.positive : summary.negative;
    bucket.total += 1;
    if (pass) bucket.passed += 1;
    summary.total += 1;
    if (pass) summary.passed += 1;

    results.push({
      errors,
      pass,
      query,
      runs: runsPerQuery,
      should_trigger: shouldTrigger,
      trigger_rate: round(triggerRate),
      triggers,
    });
  }

  const report = {
    kind: 'trigger_eval',
    min_pass_rate: minPassRate,
    model,
    report_title: `skills/${skill.name} Trigger Eval`,
    results,
    runs_per_query: runsPerQuery,
    skill_name: skill.name,
    summary: {
      min_pass_rate: minPassRate,
      negative: withRate(summary.negative),
      passed: summary.passed,
      pass_rate: round(
        summary.total === 0 ? 0 : summary.passed / summary.total,
      ),
      positive: withRate(summary.positive),
      total: summary.total,
    },
    trigger_threshold: triggerThreshold,
  };

  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  console.info(JSON.stringify(report, null, 2));

  if (report.summary.pass_rate < minPassRate) {
    process.exitCode = 1;
  }
}

async function runTriggerProbe({ model, query, repoRoot, skill, timeout }) {
  const tempSkillName = `${skill.name}-trigger-eval-${randomUUID().slice(0, 8)}`;
  const tempSkillDir = join(OPENCODE_SKILLS_DIR, tempSkillName);
  await mkdir(tempSkillDir, { recursive: true });
  await writeFile(
    join(tempSkillDir, 'SKILL.md'),
    buildTriggerSkillMd(tempSkillName, skill.description),
  );
  try {
    return await runOpencodeForTrigger({
      model,
      prompt: query,
      repoRoot,
      skillName: tempSkillName,
      timeout,
    });
  } finally {
    await rm(tempSkillDir, { force: true, recursive: true });
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--skill-path') args.skillPath = argv[++index];
    else if (arg === '--eval-path') args.evalPath = argv[++index];
    else if (arg === '--repo-root') args.repoRoot = argv[++index];
    else if (arg === '--model') args.model = argv[++index];
    else if (arg === '--runs-per-query') args.runsPerQuery = argv[++index];
    else if (arg === '--timeout') args.timeout = argv[++index];
    else if (arg === '--trigger-threshold')
      args.triggerThreshold = argv[++index];
    else if (arg === '--min-pass-rate') args.minPassRate = argv[++index];
    else if (arg === '--output') args.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function resolveRequired(value, name) {
  if (!value) throw new Error(`Missing required argument ${name}.`);
  return resolve(value);
}

function parseSkillMd(content) {
  const lines = content.split(/\r?\n/u);
  if (lines[0]?.trim() !== '---') {
    throw new Error('SKILL.md missing frontmatter');
  }

  let name = '';
  let description = '';
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '---') break;
    if (line.startsWith('name:')) {
      name = stripQuotes(line.slice('name:'.length).trim());
    }
    if (line.startsWith('description:')) {
      const value = line.slice('description:'.length).trim();
      if (['|', '>', '|-', '>-'].includes(value)) {
        const chunks = [];
        for (let next = index + 1; next < lines.length; next += 1) {
          if (!lines[next].startsWith('  ') && !lines[next].startsWith('\t')) {
            break;
          }
          chunks.push(lines[next].trim());
          index = next;
        }
        description = chunks.join(' ');
      } else {
        description = stripQuotes(value);
      }
    }
  }
  if (!name || !description) {
    throw new Error('SKILL.md frontmatter missing name or description');
  }
  return { description, name };
}

function buildTriggerSkillMd(name, description) {
  const descriptionLines = description
    .split(/\r?\n/u)
    .map((line) => `  ${line}`)
    .join('\n');
  return [
    '---',
    `name: ${name}`,
    'description: |',
    descriptionLines,
    '---',
    '',
    `# ${name}`,
    '',
  ].join('\n');
}

function runOpencodeForTrigger({
  model,
  prompt,
  repoRoot,
  skillName,
  timeout,
}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'opencode',
      ['run', prompt, '--format', 'json', '--pure', '--model', model],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let settled = false;
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      finish(new Error(`opencode timed out after ${timeout}s`));
    }, timeout * 1000);

    function finish(value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (child.exitCode === null) {
        child.kill('SIGKILL');
      }
      if (value instanceof Error) {
        reject(value);
      } else {
        resolvePromise(value);
      }
    }

    function parseLine(line) {
      if (!line.trim() || settled) return;
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        return;
      }
      if (event.type === 'error') {
        const message =
          event.error?.data?.message ?? event.error?.message ?? 'unknown error';
        finish(new Error(`opencode error: ${message}`));
        return;
      }
      if (event.type === 'tool_use') {
        const invoked = event.part?.state?.input?.name;
        if (event.part?.tool === 'skill') {
          finish(invoked === skillName);
        }
        return;
      }
      if (event.type === 'step_finish' && event.part?.reason === 'stop') {
        finish(false);
      }
    }

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      const lines = stdout.split(/\r?\n/u);
      stdout = lines.pop() ?? '';
      for (const line of lines) {
        parseLine(line);
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', finish);
    child.on('close', (code) => {
      if (settled) return;
      if (stdout) parseLine(stdout);
      if (settled) return;
      if (code === 0) {
        finish(false);
      } else {
        finish(new Error(`opencode exited with ${code}: ${stderr}`));
      }
    });
  });
}

function stringRequired(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function booleanRequired(value, name) {
  if (typeof value !== 'boolean') {
    throw new Error(`${name} must be boolean`);
  }
  return value;
}

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function withRate(summary) {
  return {
    passed: summary.passed,
    pass_rate: round(summary.total === 0 ? 0 : summary.passed / summary.total),
    total: summary.total,
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
