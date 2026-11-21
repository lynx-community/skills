// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OPENCODE_SKILLS_DIR = join(process.env.HOME ?? '', '.agents', 'skills');

export const VALID_SCENARIOS = new Set([
  'single_skill',
  'own_single_trigger',
  'own_multi_trigger',
  'similar_skill_present',
  'similar_skill_requested',
]);

export const KNOWN_CATALOG_SKILLS = {
  'habitat-usage':
    'Guidance on using Habitat to manage multi-repo source and asset dependencies via .habitat/DEPS and hab sync, plus troubleshooting common sync failures.',
  'lynx-a2ui':
    'Generate or update Lynx A2UI v0.9 JSON messages (createSurface, updateDataModel, updateComponents) using the supplied catalog and user actions.',
  'lynx-api-docs':
    'Official Lynx element, CSS, layout, configuration, and Lynx-vs-Web API documentation lookup for authoring or reviewing Lynx and ReactLynx pages.',
  'lynx-check-css-support':
    'Query @lynx-js/css-defines compat_data to check Lynx CSS property and nested feature/value support by rendering backend and Lynx version, or check whether a newer dataset version exists.',
  'lynx-debug-info-remapping':
    'Remap the function_id:pc_index to the original source code position by provided debug info json file.',
  'lynx-devtool':
    'Use when working with Lynx DevTool or debugging a Lynx app, page, or device, especially when the task mentions clients or sessions, CDP or App commands, DOM/CSS inspection, runtime or console logs, evaluating JavaScript on a device, screenshots, heap snapshots, performance traces, Page.reload or App.openPage, global switches, interactive snapshot refs, or ReactLynx component tree inspection.',
  'lynx-openui':
    'Generate or update Lynx OpenUI Lang v0.5 DSL programs and minimal statement patches for OpenUiRenderer using the supplied component catalog and Query/Mutation tools.',
  'lynx-recorder':
    'Record Lynx page interactions into a TestBench replay file using agent-lynx. Use when asked to start or stop a recording, capture page interactions for replay, or troubleshoot recording capture. For inspecting or editing an existing fixture, use lynx-recorder-fixture.',
  'lynx-recorder-fixture':
    'Inspect, decode, edit, and re-encode existing Lynx Recorder / TestBench fixtures. Use to analyze recordings, change mock responses, Action List, Callback, or Config, and troubleshoot replay inputs. Use lynx-recorder to create a new recording.',
  'lynx-tasm-codec':
    '通过 `agent-lynx tasm` 在模板 JSON 与 tasm 二进制之间进行转换（编码、解码）。',
  'lynx-trace-analysis':
    'Analyze existing Lynx .pftrace performance traces to diagnose FCP/FMP bottlenecks, scroll jank, main-thread vs background-thread stalls, diffVdom regressions, and NativeModule latency.',
  'lynx-trace-record':
    'Record, download, and validate Lynx performance traces (.pftrace) with the agent-lynx CLI. Owns trace collection and capture-quality evidence; use lynx-trace-analysis for deep diagnosis of an existing trace.',
  'lynx-typescript':
    'This Skill summarizes common TypeScript issues and their solutions in Lynx development, mainly covering environment configuration, type extending, event handling, components, and ReactLynx advanced usages.',
  'lynx-ui':
    'Guide usage of @lynx-js/lynx-ui components (Swiper, ScrollView, Sheet, Dialog, Popover, FeedList, Tabs, etc.), component selection, props, and imperative ref APIs.',
  'reactlynx-best-practices':
    'Reviews, writes, and refactors ReactLynx code and component libraries for Lynx dual-thread best practices (background-only, useLayoutEffect, bindtap/catchtap, main-thread:*, runOnMainThread/runOnBackground, lazy/Suspense, globalPropsMode).',
  'rspeedy-bundle-size':
    'Analyze and reduce the bundle size of rspeedy/Lynx (ReactLynx) apps (.lynx.bundle and main-thread.js) via __BACKGROUND__ / background-only gating, media optimization, i18n deduplication, mangle fixes, and dynamic component splitting.',
  'vanilla-lynx':
    'Author, review, or explain Vanilla Lynx source that directly uses Element PAPI, delivered as a build-free .lynxml artifact or an Rspeedy project, including related build and serving workflows.',
};

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
  const evals = await loadTriggerEvalItems(evalPath, repoRoot, skill.name);
  if (!Array.isArray(evals) || evals.length === 0) {
    throw new Error(`${evalFile} must contain a non-empty array`);
  }

  const model = args.model ?? 'opencode/gpt-5-nano';
  const runsPerQuery = Number(args.runsPerQuery ?? 1);
  const timeout = Number(args.timeout ?? 90);
  const triggerThreshold = Number(args.triggerThreshold ?? 0.5);
  const minPassRate = Number(args.minPassRate ?? 0.75);
  const globalCoInstalled = String(args.coInstallSkills ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const outputPath = args.output ? resolve(args.output) : undefined;

  const results = [];
  for (const [index, evalItem] of evals.entries()) {
    const normalizedCase = await normalizeTriggerCase(
      evalItem,
      skill.name,
      repoRoot,
      globalCoInstalled,
      index + 1,
    );
    const triggeredByRun = [];
    const errors = [];

    for (let run = 0; run < runsPerQuery; run += 1) {
      try {
        const probe = await runTriggerProbe({
          expectedSkills: normalizedCase.expected_skills,
          extraSkills: normalizedCase.extra_skills,
          model,
          query: normalizedCase.query,
          repoRoot,
          skill,
          timeout,
        });
        triggeredByRun.push(probe.triggered_skills);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    results.push(
      scoreCaseRuns({
        errors,
        normalizedCase,
        runsPerQuery,
        skillName: skill.name,
        triggerThreshold,
        triggeredByRun,
      }),
    );
  }

  const summary = buildSummaryMetrics(results, minPassRate);
  const report = {
    kind: 'trigger_eval',
    min_pass_rate: minPassRate,
    model,
    report_title: `skills/${skill.name} Trigger Eval`,
    results,
    runs_per_query: runsPerQuery,
    skill_name: skill.name,
    summary,
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

export async function loadTriggerEvalItems(evalPath, repoRoot, skillName) {
  const evalFile = join(evalPath, 'trigger_eval.json');
  const items = JSON.parse(await readFile(evalFile, 'utf8'));
  if (!Array.isArray(items)) {
    throw new Error(`${evalFile} must contain an array`);
  }
  const merged = [...items];
  const sidecars = [
    join(evalPath, 'trigger_multi_eval.json'),
    join(repoRoot, 'evals', skillName, 'trigger_multi_eval.json'),
  ];
  const seen = new Set();
  for (const sidecar of sidecars) {
    const resolvedPath = resolve(sidecar);
    if (seen.has(resolvedPath) || !existsSync(resolvedPath)) continue;
    seen.add(resolvedPath);
    const extra = JSON.parse(await readFile(resolvedPath, 'utf8'));
    if (Array.isArray(extra)) {
      merged.push(...extra);
    }
  }
  return merged;
}

export async function resolveSkillDefinition(
  entry,
  repoRoot,
  role = 'own',
) {
  if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
    if (typeof entry.skill_path === 'string' && entry.skill_path.trim()) {
      const candidate = resolve(repoRoot, entry.skill_path.trim());
      const skillMdPath = candidate.endsWith('SKILL.md')
        ? candidate
        : join(candidate, 'SKILL.md');
      const parsed = parseSkillMd(await readFile(skillMdPath, 'utf8'));
      return {
        description: String(entry.description ?? parsed.description).trim(),
        name: String(entry.name ?? parsed.name).trim(),
        role: String(entry.role ?? role),
      };
    }
    const name = String(entry.name ?? '').trim();
    const description = String(entry.description ?? '').trim();
    if (!name || !description) {
      throw new Error(
        `Skill entry object must contain non-empty name and description: ${
          JSON.stringify(entry)
        }`,
      );
    }
    return {
      description,
      name,
      role: String(entry.role ?? role),
    };
  }

  if (typeof entry !== 'string' || !entry.trim()) {
    throw new Error(`Invalid skill reference: ${JSON.stringify(entry)}`);
  }

  const skillId = entry.trim();
  const roots = [repoRoot];
  if (basename(repoRoot) === 'oss') {
    roots.push(dirname(repoRoot));
  }

  const candidates = [];
  for (const root of roots) {
    candidates.push(
      join(root, 'packages', 'skills', skillId, 'SKILL.md'),
      join(root, 'oss', 'packages', 'skills', skillId, 'SKILL.md'),
      join(root, 'skills', skillId, 'SKILL.md'),
      join(root, 'node_modules', '@lynx-js', `skill-${skillId}`, 'SKILL.md'),
      join(root, 'node_modules', '@byted-lynx', `skill-${skillId}`, 'SKILL.md'),
    );
  }

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const parsed = parseSkillMd(await readFile(candidate, 'utf8'));
      return {
        description: parsed.description,
        name: parsed.name,
        role,
      };
    }
  }

  if (KNOWN_CATALOG_SKILLS[skillId]) {
    return {
      description: KNOWN_CATALOG_SKILLS[skillId],
      name: skillId,
      role,
    };
  }

  throw new Error(`Unable to resolve skill definition for \`${skillId}\``);
}

export async function normalizeTriggerCase(
  evalItem,
  skillName,
  repoRoot,
  globalCoInstalled = [],
  index = 1,
) {
  const query = stringRequired(
    evalItem.query,
    `trigger eval #${index} query`,
  );
  const shouldTrigger = booleanRequired(
    evalItem.should_trigger,
    `trigger eval #${index} should_trigger`,
  );

  const rawCoInstalled = [
    ...(Array.isArray(evalItem.co_installed_skills)
      ? evalItem.co_installed_skills
      : []),
  ];
  for (const extra of globalCoInstalled) {
    if (extra !== skillName && !rawCoInstalled.includes(extra)) {
      rawCoInstalled.push(extra);
    }
  }
  const rawCompeting = Array.isArray(evalItem.competing_skills)
    ? evalItem.competing_skills
    : [];

  const seenNames = new Set([skillName]);
  const coInstalledDefs = [];
  for (const entry of rawCoInstalled) {
    const resolved = await resolveSkillDefinition(entry, repoRoot, 'own');
    if (!seenNames.has(resolved.name)) {
      seenNames.add(resolved.name);
      coInstalledDefs.push(resolved);
    }
  }

  const competingDefs = [];
  for (const entry of rawCompeting) {
    const resolved = await resolveSkillDefinition(entry, repoRoot, 'similar');
    if (!seenNames.has(resolved.name)) {
      seenNames.add(resolved.name);
      competingDefs.push(resolved);
    }
  }

  const extraSkills = [...coInstalledDefs, ...competingDefs];
  const installedSkills = [skillName, ...extraSkills.map((item) => item.name)];

  const expectedSkills = Array.isArray(evalItem.expected_skills)
    ? Array.from(new Set(evalItem.expected_skills.map((item) => String(item))))
    : shouldTrigger
    ? [skillName]
    : [];

  const allowedSkills = new Set(
    Array.isArray(evalItem.allowed_skills)
      ? evalItem.allowed_skills.map((item) => String(item))
      : [],
  );
  const explicitForbidden = Array.isArray(evalItem.forbidden_skills)
    ? evalItem.forbidden_skills.map((item) => String(item))
    : [];
  const inferredForbidden = installedSkills.filter(
    (name) => !expectedSkills.includes(name) && !allowedSkills.has(name),
  );
  const forbiddenSkills = Array.from(
    new Set([...explicitForbidden, ...inferredForbidden]),
  );

  let scenario = evalItem.scenario;
  if (typeof scenario !== 'string' || !VALID_SCENARIOS.has(scenario)) {
    if (coInstalledDefs.length === 0 && competingDefs.length === 0) {
      scenario = 'single_skill';
    } else if (competingDefs.length > 0) {
      scenario = !shouldTrigger && expectedSkills.length > 0
        ? 'similar_skill_requested'
        : 'similar_skill_present';
    } else {
      scenario = expectedSkills.length > 1
        ? 'own_multi_trigger'
        : 'own_single_trigger';
    }
  }

  return {
    co_installed_skills: coInstalledDefs,
    competing_skills: competingDefs,
    expected_skills: expectedSkills,
    extra_skills: extraSkills,
    forbidden_skills: forbiddenSkills,
    installed_skills: installedSkills,
    query,
    scenario,
    should_trigger: shouldTrigger,
  };
}

export async function runTriggerProbe({
  expectedSkills,
  extraSkills = [],
  model,
  opencodeBin = 'opencode',
  query,
  repoRoot,
  skill,
  skillsDir = OPENCODE_SKILLS_DIR,
  timeout,
}) {
  const allSkills = [skill, ...extraSkills];
  const deduped = [];
  const seen = new Set();
  for (const entry of allSkills) {
    if (!seen.has(entry.name)) {
      seen.add(entry.name);
      deduped.push(entry);
    }
  }

  const targetExpected = expectedSkills ?? [skill.name];
  const multiSkillHint = targetExpected.length > 1;
  const maxSteps = Math.min(Math.max(1, targetExpected.length), 3);

  const createdDirs = [];
  const backups = [];

  await mkdir(skillsDir, { recursive: true });
  try {
    for (const entry of deduped) {
      const skillDir = join(skillsDir, entry.name);
      if (existsSync(skillDir)) {
        const backupDir = join(
          skillsDir,
          `.${entry.name}.eval-backup-${randomUUID().slice(0, 8)}`,
        );
        await rename(skillDir, backupDir);
        backups.push({ backupDir, skillDir });
      }
      await mkdir(skillDir, { recursive: true });
      createdDirs.push(skillDir);
      await writeFile(
        join(skillDir, 'SKILL.md'),
        buildTriggerSkillMd(entry.name, entry.description, multiSkillHint),
      );
    }

    const triggeredSkills = await runOpencodeForTrigger({
      expectedSkills: targetExpected,
      hasExtraSkills: extraSkills.length > 0,
      maxSteps,
      model,
      opencodeBin,
      prompt: query,
      repoRoot,
      timeout,
    });
    return {
      triggered: triggeredSkills.includes(skill.name),
      triggered_skills: triggeredSkills,
    };
  } finally {
    for (const dir of [...createdDirs].reverse()) {
      await rm(dir, { force: true, recursive: true });
    }
    for (const { backupDir, skillDir } of [...backups].reverse()) {
      if (existsSync(backupDir)) {
        await rename(backupDir, skillDir);
      }
    }
  }
}

export function scoreCaseRuns({
  errors,
  normalizedCase,
  runsPerQuery,
  skillName,
  triggerThreshold,
  triggeredByRun,
}) {
  const {
    co_installed_skills: coInstalled,
    competing_skills: competing,
    expected_skills: expectedSkills,
    forbidden_skills: forbiddenSkills,
    installed_skills: installedSkills,
    query,
    scenario,
    should_trigger: shouldTrigger,
  } = normalizedCase;

  const isMultiSkill = installedSkills.length > 1
    || expectedSkills.some((name) => name !== skillName);

  const triggers =
    triggeredByRun.filter((run) => run.includes(skillName)).length;
  const triggerRate = runsPerQuery === 0 ? 0 : triggers / runsPerQuery;

  const skillCounts = Object.fromEntries(
    installedSkills.map((name) => [
      name,
      triggeredByRun.filter((run) => run.includes(name)).length,
    ]),
  );
  for (const run of triggeredByRun) {
    for (const name of run) {
      if (!(name in skillCounts)) {
        skillCounts[name] =
          triggeredByRun.filter((r) => r.includes(name)).length;
      }
    }
  }
  const skillRates = Object.fromEntries(
    Object.entries(skillCounts).map(([name, count]) => [
      name,
      round(runsPerQuery === 0 ? 0 : count / runsPerQuery),
    ]),
  );

  let matchedRuns = 0;
  let conflictRuns = 0;
  let otherTriggerRuns = 0;
  let unexpectedOtherRuns = 0;
  let expectedAllRuns = 0;

  for (const run of triggeredByRun) {
    const runSet = new Set(run);
    const targetOkRun = runSet.has(skillName) === shouldTrigger;
    const expectedOkRun = expectedSkills.every((req) => runSet.has(req));
    const forbiddenTriggered = forbiddenSkills.filter((forb) =>
      runSet.has(forb)
    );
    const forbiddenOther = forbiddenTriggered.filter(
      (forb) => forb !== skillName,
    );
    const otherTriggered = run.filter((name) => name !== skillName);

    if (expectedOkRun) expectedAllRuns += 1;
    if (otherTriggered.length > 0) otherTriggerRuns += 1;
    if (forbiddenOther.length > 0) unexpectedOtherRuns += 1;
    if (
      forbiddenOther.length > 0
      || (scenario !== 'single_skill' && forbiddenTriggered.length > 0)
    ) {
      conflictRuns += 1;
    }
    if (targetOkRun && expectedOkRun && forbiddenTriggered.length === 0) {
      matchedRuns += 1;
    }
  }

  const targetOk = shouldTrigger
    ? triggerRate >= triggerThreshold
    : triggerRate < triggerThreshold;

  let pass;
  if (!isMultiSkill) {
    pass = errors.length === 0 && targetOk;
  } else {
    const expectedOk = expectedSkills.every(
      (req) =>
        (runsPerQuery === 0 ? 0 : (skillCounts[req] ?? 0) / runsPerQuery)
        >= triggerThreshold,
    );
    const forbiddenOk = forbiddenSkills.every(
      (forb) =>
        (runsPerQuery === 0 ? 0 : (skillCounts[forb] ?? 0) / runsPerQuery)
        < triggerThreshold,
    );
    const matchRateVal = runsPerQuery === 0 ? 0 : matchedRuns / runsPerQuery;
    const matchOk = shouldTrigger || expectedSkills.length > 0
      ? matchRateVal >= triggerThreshold
      : matchRateVal > 1 - triggerThreshold;
    pass = errors.length === 0
      && targetOk
      && expectedOk
      && forbiddenOk
      && matchOk;
  }

  const row = {
    errors,
    pass,
    query,
    runs: runsPerQuery,
    scenario,
    should_trigger: shouldTrigger,
    trigger_rate: round(triggerRate),
    triggers,
  };

  if (isMultiSkill) {
    const otherRate = runsPerQuery === 0 ? 0 : otherTriggerRuns / runsPerQuery;
    const unexpectedOtherRate = runsPerQuery === 0
      ? 0
      : unexpectedOtherRuns / runsPerQuery;
    Object.assign(row, {
      conflict_rate: round(
        runsPerQuery === 0 ? 0 : conflictRuns / runsPerQuery,
      ),
      expected_all_trigger_rate: round(
        runsPerQuery === 0 ? 0 : expectedAllRuns / runsPerQuery,
      ),
      expected_skills: expectedSkills,
      forbidden_skills: forbiddenSkills,
      installed_skills: installedSkills,
      match_rate: round(runsPerQuery === 0 ? 0 : matchedRuns / runsPerQuery),
      other_skill_non_trigger_rate: round(1 - unexpectedOtherRate),
      other_skill_trigger_rate: round(otherRate),
      skill_trigger_rates: skillRates,
      triggered_skills_by_run: triggeredByRun,
    });
    if (coInstalled.length > 0) {
      row.co_installed_skills = coInstalled.map((item) => item.name);
    }
    if (competing.length > 0) {
      row.competing_skills = competing.map((item) => item.name);
    }
  }

  return row;
}

export function buildSummaryMetrics(results, minPassRate) {
  const total = results.length;
  const passed = results.filter((row) => row.pass).length;
  const errorCount = results.reduce(
    (sum, row) => sum + (Array.isArray(row.errors) ? row.errors.length : 0),
    0,
  );
  const positives = results.filter((row) => row.should_trigger);
  const negatives = results.filter((row) => !row.should_trigger);

  const ownSingle = results.filter(
    (row) => row.scenario === 'own_single_trigger',
  );
  const ownMulti = results.filter(
    (row) => row.scenario === 'own_multi_trigger',
  );
  const ownAll = [...ownSingle, ...ownMulti];

  const simPresent = results.filter(
    (row) => row.scenario === 'similar_skill_present',
  );
  const simRequested = results.filter(
    (row) => row.scenario === 'similar_skill_requested',
  );
  const simAll = [...simPresent, ...simRequested];

  const summary = {
    error_count: errorCount,
    min_pass_rate: minPassRate,
    negative: bucketSummary(negatives),
    pass_rate: round(total === 0 ? 0 : passed / total),
    passed,
    positive: bucketSummary(positives),
    total,
  };

  if (ownAll.length > 0 || simAll.length > 0) {
    summary.multi_skill = {
      own_skills: {
        ...bucketSummary(ownAll),
        conflict_rate: avg(ownAll.map((row) => Number(row.conflict_rate ?? 0))),
        multi_trigger: {
          ...bucketSummary(ownMulti),
          co_trigger_rate: avg(
            ownMulti.map((row) => Number(row.expected_all_trigger_rate ?? 0)),
          ),
          conflict_rate: avg(
            ownMulti.map((row) => Number(row.conflict_rate ?? 0)),
          ),
        },
        single_trigger: {
          ...bucketSummary(ownSingle),
          conflict_rate: avg(
            ownSingle.map((row) => Number(row.conflict_rate ?? 0)),
          ),
        },
      },
      similar_skills: {
        ...bucketSummary(simAll),
        other_skill_non_trigger_rate: avg(
          simPresent.map((row) =>
            Number(row.other_skill_non_trigger_rate ?? 1)
          ),
        ),
        other_skill_requested: {
          ...bucketSummary(simRequested),
          other_skill_trigger_rate: avg(
            simRequested.map((row) =>
              Number(row.expected_all_trigger_rate ?? 0)
            ),
          ),
          our_skill_non_trigger_rate: avg(
            simRequested.map((row) => 1 - Number(row.trigger_rate ?? 0)),
          ),
          our_skill_trigger_rate: avg(
            simRequested.map((row) => Number(row.trigger_rate ?? 0)),
          ),
        },
        other_skill_trigger_rate: avg(
          simPresent.map((row) => Number(row.other_skill_trigger_rate ?? 0)),
        ),
        our_skill_trigger_rate: avg(
          simPresent
            .filter((row) => row.should_trigger)
            .map((row) => Number(row.trigger_rate ?? 0)),
        ),
        target_should_trigger: {
          ...bucketSummary(simPresent),
          other_skill_non_trigger_rate: avg(
            simPresent.map((row) =>
              Number(row.other_skill_non_trigger_rate ?? 1)
            ),
          ),
          other_skill_trigger_rate: avg(
            simPresent.map((row) => Number(row.other_skill_trigger_rate ?? 0)),
          ),
          our_skill_trigger_rate: avg(
            simPresent
              .filter((row) => row.should_trigger)
              .map((row) => Number(row.trigger_rate ?? 0)),
          ),
        },
      },
    };
  }

  return summary;
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
    else if (arg === '--trigger-threshold') {
      args.triggerThreshold = argv[++index];
    } else if (arg === '--min-pass-rate') args.minPassRate = argv[++index];
    else if (arg === '--co-install-skills') {
      args.coInstallSkills = argv[++index];
    } else if (arg === '--output') args.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function resolveRequired(value, name) {
  if (!value) throw new Error(`Missing required argument ${name}.`);
  return resolve(value);
}

export function parseSkillMd(content) {
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

export function buildTriggerSkillMd(
  name,
  description,
  multiSkillHint = false,
) {
  const descriptionLines = description
    .split(/\r?\n/u)
    .map((line) => `  ${line}`)
    .join('\n');
  const lines = [
    '---',
    `name: ${name}`,
    'description: |',
    descriptionLines,
    '---',
    '',
    `# ${name}`,
    '',
  ];
  if (multiSkillHint) {
    lines.push(
      `This skill covers: ${description}`,
      "If the user's request also requires capabilities owned by another installed skill, invoke that skill tool next before answering.",
      '',
    );
  }
  return lines.join('\n');
}

function runOpencodeForTrigger({
  expectedSkills = [],
  hasExtraSkills = false,
  maxSteps = 1,
  model,
  opencodeBin = 'opencode',
  prompt,
  repoRoot,
  timeout,
}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      opencodeBin,
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
    const triggeredSkills = [];
    let stepSkillCalls = 0;
    let stepOtherToolCalls = 0;
    let stepsCompleted = 0;

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
        const message = event.error?.data?.message ?? event.error?.message
          ?? 'unknown error';
        finish(new Error(`opencode error: ${message}`));
        return;
      }
      if (event.type === 'tool_use') {
        if (event.part?.tool === 'skill') {
          const invoked = event.part?.state?.input?.id
            ?? event.part?.state?.input?.name
            ?? '';
          if (invoked && !triggeredSkills.includes(invoked)) {
            triggeredSkills.push(invoked);
          }
          stepSkillCalls += 1;
          if (!hasExtraSkills && maxSteps === 1) {
            finish(triggeredSkills);
          }
        } else {
          stepOtherToolCalls += 1;
        }
        return;
      }
      if (event.type === 'step_finish') {
        stepsCompleted += 1;
        const reason = event.part?.reason ?? '';
        const allExpectedDone = expectedSkills.length > 0
          && expectedSkills.every((req) => triggeredSkills.includes(req));
        if (
          reason === 'stop'
          || stepsCompleted >= maxSteps
          || stepSkillCalls === 0
          || stepOtherToolCalls > 0
          || allExpectedDone
        ) {
          finish(triggeredSkills);
          return;
        }
        stepSkillCalls = 0;
        stepOtherToolCalls = 0;
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
        finish(triggeredSkills);
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

function bucketSummary(rows) {
  const total = rows.length;
  const passed = rows.filter((row) => row.pass).length;
  return {
    pass_rate: round(total === 0 ? 0 : passed / total),
    passed,
    total,
  };
}

function avg(values) {
  if (values.length === 0) return 0;
  return round(
    values.reduce((sum, item) => sum + item, 0) / values.length,
  );
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
