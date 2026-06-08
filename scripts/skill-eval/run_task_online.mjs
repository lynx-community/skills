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
  const evalFile = join(evalPath, 'evals.json');
  const repoRoot = resolve(args.repoRoot ?? process.cwd());

  if (!existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found: ${skillMdPath}`);
  }
  if (!existsSync(evalFile)) {
    throw new Error(`evals.json not found: ${evalFile}`);
  }

  const skillContent = await readFile(skillMdPath, 'utf8');
  const skill = parseSkillMd(skillContent);
  const evalPayload = JSON.parse(await readFile(evalFile, 'utf8'));
  let evals = evalPayload.evals;
  if (!Array.isArray(evals) || evals.length === 0) {
    throw new Error(`${evalFile} evals must be a non-empty array`);
  }

  if (args.evalIds) {
    const wanted = new Set(
      args.evalIds
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => Number.isInteger(id)),
    );
    evals = evals.filter((item) => wanted.has(item.id));
  }
  if (evals.length === 0) {
    throw new Error('No task evals selected.');
  }

  const model = args.model ?? 'codebase/gpt-5.2__dev';
  const graderModel = args.graderModel ?? model;
  const timeout = Number(args.timeout ?? 300);
  const minPassRate = Number(args.minPassRate ?? 0.85);
  const outputDir = resolve(
    args.outputDir ?? join(repoRoot, 'artifacts', skill.name, 'task-eval'),
  );
  await mkdir(outputDir, { recursive: true });

  const tempSkillName = `${skill.name}-task-eval-${randomUUID().slice(0, 8)}`;
  const results = [];
  const pooled = {
    with_skill: { passed: 0, total: 0 },
    without_skill: { passed: 0, total: 0 },
  };

  for (const evalItem of evals) {
    const evalDir = join(outputDir, `eval-${evalItem.id}-${evalItem.name}`);
    const files = (evalItem.files ?? []).map((file) => join(skillPath, file));
    const tempSkillDir = await installTempSkill(skillContent, tempSkillName);

    let withResult;
    let withoutResult;
    let withError;
    let withoutError;
    try {
      withResult = await runOpencode({
        files,
        model,
        prompt: buildExecutorPrompt(evalItem.prompt, tempSkillName),
        repoRoot,
        timeout,
      });
    } catch (error) {
      withError = error instanceof Error ? error.message : String(error);
      withResult = failedOpencodeResult(
        `[with_skill executor failed] ${withError}`,
      );
    } finally {
      await rm(tempSkillDir, { force: true, recursive: true });
    }

    try {
      withoutResult = await runOpencode({
        files,
        model,
        prompt: buildExecutorPrompt(evalItem.prompt, undefined),
        repoRoot,
        timeout,
      });
    } catch (error) {
      withoutError = error instanceof Error ? error.message : String(error);
      withoutResult = failedOpencodeResult(
        `[without_skill executor failed] ${withoutError}`,
      );
    }

    await writeText(
      join(evalDir, 'with_skill', 'answer.md'),
      `${withResult.text}\n`,
    );
    await writeText(
      join(evalDir, 'without_skill', 'answer.md'),
      `${withoutResult.text}\n`,
    );

    let grading;
    try {
      const graderResult = await runOpencode({
        model: graderModel,
        prompt: buildGraderPrompt(
          evalItem,
          withResult.text,
          withoutResult.text,
        ),
        repoRoot,
        timeout,
      });
      grading = normalizeGrading(extractJsonObject(graderResult.text));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      grading = {
        notes: [`grader failed: ${message}`],
        with_skill: failedSection(evalItem.expectations, message),
        without_skill: failedSection(evalItem.expectations, message),
      };
    }

    if (withError || withoutError) {
      grading.notes = [
        ...(grading.notes ?? []),
        ...(withError ? [`with_skill executor failed: ${withError}`] : []),
        ...(withoutError
          ? [`without_skill executor failed: ${withoutError}`]
          : []),
      ];
    }

    await writeText(
      join(evalDir, 'grading.json'),
      `${JSON.stringify(grading, null, 2)}\n`,
    );

    const skillInvoked = withResult.toolUses.some(
      (toolUse) =>
        toolUse.tool === 'skill' && toolUse.input?.name === tempSkillName,
    );
    for (const key of ['with_skill', 'without_skill']) {
      pooled[key].passed += grading[key].summary.passed;
      pooled[key].total += grading[key].summary.total;
    }

    results.push({
      eval_id: evalItem.id,
      eval_name: evalItem.name,
      notes: grading.notes ?? [],
      with_skill: {
        answer_path: join(evalDir, 'with_skill', 'answer.md'),
        expectations: grading.with_skill.expectations,
        skill_invoked: skillInvoked,
        summary: grading.with_skill.summary,
        tokens: withResult.tokens,
      },
      without_skill: {
        answer_path: join(evalDir, 'without_skill', 'answer.md'),
        expectations: grading.without_skill.expectations,
        summary: grading.without_skill.summary,
        tokens: withoutResult.tokens,
      },
    });

    await writeReport(
      outputDir,
      buildReport({
        graderModel,
        minPassRate,
        model,
        pooled,
        results,
        skillName: skill.name,
      }),
    );
  }

  const report = buildReport({
    graderModel,
    minPassRate,
    model,
    pooled,
    results,
    skillName: skill.name,
  });
  await writeReport(outputDir, report);
  console.info(JSON.stringify(report, null, 2));

  if (report.config_summary.with_skill.pass_rate < minPassRate) {
    process.exitCode = 1;
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
    else if (arg === '--grader-model') args.graderModel = argv[++index];
    else if (arg === '--timeout') args.timeout = argv[++index];
    else if (arg === '--min-pass-rate') args.minPassRate = argv[++index];
    else if (arg === '--eval-ids') args.evalIds = argv[++index];
    else if (arg === '--output-dir') args.outputDir = argv[++index];
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

function stripQuotes(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

async function installTempSkill(skillContent, tempSkillName) {
  const tempSkillDir = join(OPENCODE_SKILLS_DIR, tempSkillName);
  await mkdir(tempSkillDir, { recursive: true });
  await writeFile(
    join(tempSkillDir, 'SKILL.md'),
    rewriteSkillName(skillContent, tempSkillName),
  );
  return tempSkillDir;
}

function rewriteSkillName(content, newName) {
  const lines = content.split(/\r?\n/u);
  let inFrontmatter = false;
  let replaced = false;
  const nextLines = lines.map((line, index) => {
    if (index === 0 && line.trim() === '---') {
      inFrontmatter = true;
      return line;
    }
    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false;
      return line;
    }
    if (inFrontmatter && line.startsWith('name:')) {
      replaced = true;
      return `name: ${newName}`;
    }
    return line;
  });
  if (!replaced) throw new Error('SKILL.md frontmatter missing name');
  return `${nextLines.join('\n')}\n`;
}

function buildExecutorPrompt(taskPrompt, skillName) {
  if (skillName) {
    return [
      `Use the available skill named \`${skillName}\` before answering this task.`,
      'Do not mention the skill in the final answer. Do not ask follow-up questions.',
      'This is a pure answering task: do not inspect the repository, do not run shell commands, and do not use extra tools after loading the skill unless the task explicitly requires them.',
      'If the user asks for file contents or commands/code, include exact paths and full code blocks.',
      'Return only the final answer for the user.',
      '',
      `User task:\n${taskPrompt}`,
    ].join('\n');
  }

  return [
    'Answer this task directly from your own knowledge. Do not read local skill files or docs.',
    'Do not inspect the repository, do not run shell commands, and do not use tools.',
    'Do not ask follow-up questions. If the user asks for file contents or commands/code, include exact paths and full code blocks.',
    'Return only the final answer for the user.',
    '',
    `User task:\n${taskPrompt}`,
  ].join('\n');
}

function buildGraderPrompt(evalItem, withAnswer, withoutAnswer) {
  const expectations = evalItem.expectations
    .map((expectation) => `- ${expectation}`)
    .join('\n');
  return `
You are grading two candidate answers for the same skill eval.

Task prompt:
${evalItem.prompt}

Expected output:
${evalItem.expected_output}

Expectations:
${expectations}

Answer A (with_skill):
${withAnswer}

Answer B (without_skill):
${withoutAnswer}

Grade every expectation for both answers.

Rules:
- Exact package names, module specifiers, hook names, API names, CLI subcommands, and command flags matter.
- If a required detail is missing, ambiguous, or contradicted, mark it false.
- No partial credit.
- Evidence must quote or paraphrase concrete text from the answer.
- Return JSON only. No markdown fences.
- Do not use tools. Grade from the prompt and the two answers only.

Use exactly this schema:
{
  "with_skill": {
    "expectations": [
      {"text": "<expectation>", "passed": true, "evidence": "<evidence>"}
    ],
    "summary": {"passed": 0, "failed": 0, "total": 0, "pass_rate": 0.0}
  },
  "without_skill": {
    "expectations": [
      {"text": "<expectation>", "passed": true, "evidence": "<evidence>"}
    ],
    "summary": {"passed": 0, "failed": 0, "total": 0, "pass_rate": 0.0}
  },
  "notes": ["optional short notes"]
}
`.trim();
}

async function runOpencode({ files, model, prompt, repoRoot, timeout }) {
  const args = [
    'run',
    prompt,
    '--format',
    'json',
    '--dangerously-skip-permissions',
    '--pure',
    '--model',
    model,
  ];
  for (const file of files ?? []) {
    args.push('--file', file);
  }

  const stdout = await spawnWithTimeout('opencode', args, repoRoot, timeout);
  const textParts = [];
  const toolUses = [];
  let tokens = null;

  for (const line of stdout.split(/\r?\n/u)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (event.type === 'error') {
      const message =
        event.error?.data?.message ?? event.error?.message ?? 'unknown error';
      throw new Error(`opencode error: ${message}`);
    }
    if (event.type === 'text' && typeof event.part?.text === 'string') {
      textParts.push(event.part.text);
    }
    if (event.type === 'tool_use') {
      toolUses.push({
        input: event.part?.state?.input ?? {},
        tool: event.part?.tool,
      });
    }
    if (event.type === 'step_finish') {
      tokens = event.part?.tokens?.total ?? tokens;
    }
  }

  return {
    text: textParts.join('').trim(),
    tokens,
    toolUses,
  };
}

function spawnWithTimeout(command, args, cwd, timeoutSeconds) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${command} timed out after ${timeoutSeconds}s`));
    }, timeoutSeconds * 1000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolvePromise(stdout);
      } else {
        reject(new Error(`${command} exited with ${code}: ${stderr}`));
      }
    });
  });
}

function failedOpencodeResult(text) {
  return {
    text,
    tokens: null,
    toolUses: [],
  };
}

function extractJsonObject(text) {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Continue with fenced/raw object extraction.
  }

  const fenced = /```(?:json)?\s*(\{[\s\S]*\})\s*```/u.exec(trimmed);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error('could not locate JSON object in grader output');
}

function normalizeGrading(grading) {
  for (const key of ['with_skill', 'without_skill']) {
    const section = grading[key];
    if (!section || typeof section !== 'object') {
      throw new Error(`grader missing section: ${key}`);
    }
    if (!Array.isArray(section.expectations)) {
      throw new Error(`grader section ${key} missing expectations`);
    }
    const passed = section.expectations.filter(
      (item) => item?.passed === true,
    ).length;
    const total = section.expectations.length;
    section.summary = {
      failed: total - passed,
      passed,
      pass_rate: total === 0 ? 0 : round(passed / total),
      total,
    };
  }
  if (!Array.isArray(grading.notes)) {
    grading.notes = [];
  }
  return grading;
}

function failedSection(expectations, message) {
  const total = expectations.length;
  return {
    expectations: expectations.map((expectation) => ({
      evidence: message,
      passed: false,
      text: expectation,
    })),
    summary: {
      failed: total,
      passed: 0,
      pass_rate: 0,
      total,
    },
  };
}

function buildReport({
  graderModel,
  minPassRate,
  model,
  pooled,
  results,
  skillName,
}) {
  const withPassRate = passRate(pooled.with_skill);
  const withoutPassRate = passRate(pooled.without_skill);
  return {
    config_summary: {
      delta: { pass_rate: round(withPassRate - withoutPassRate) },
      with_skill: {
        passed: pooled.with_skill.passed,
        pass_rate: round(withPassRate),
        total: pooled.with_skill.total,
      },
      without_skill: {
        passed: pooled.without_skill.passed,
        pass_rate: round(withoutPassRate),
        total: pooled.without_skill.total,
      },
    },
    grader_model: graderModel,
    kind: 'task_eval',
    min_pass_rate: minPassRate,
    model,
    report_title: `skills/${skillName} Task Eval`,
    results,
    skill_name: skillName,
    summary: {
      min_pass_rate: minPassRate,
      passed: pooled.with_skill.passed,
      pass_rate: round(withPassRate),
      total: pooled.with_skill.total,
    },
  };
}

function passRate(section) {
  return section.total === 0 ? 0 : section.passed / section.total;
}

async function writeReport(outputDir, report) {
  await writeText(
    join(outputDir, 'task-online-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await writeText(join(outputDir, 'benchmark.md'), renderBenchmark(report));
}

function renderBenchmark(report) {
  const { config_summary: configSummary } = report;
  return `${[
    `# ${report.report_title}`,
    '',
    `- model: \`${report.model}\``,
    `- grader_model: \`${report.grader_model}\``,
    `- with_skill: \`${configSummary.with_skill.passed}/${configSummary.with_skill.total}\` (${formatPercent(configSummary.with_skill.pass_rate)})`,
    `- without_skill: \`${configSummary.without_skill.passed}/${configSummary.without_skill.total}\` (${formatPercent(configSummary.without_skill.pass_rate)})`,
    `- delta: \`${formatSignedPercent(configSummary.delta.pass_rate)}\``,
    '',
    '| id | name | with_skill | without_skill | skill_invoked |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.results.map(
      (item) =>
        `| ${item.eval_id} | ${item.eval_name} | ${item.with_skill.summary.passed}/${item.with_skill.summary.total} | ${item.without_skill.summary.passed}/${item.without_skill.summary.total} | ${item.with_skill.skill_invoked} |`,
    ),
    '',
  ].join('\n')}\n`;
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatPercent(value)}`;
}
