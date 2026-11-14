// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from 'node:assert/strict';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { validateTriggerEvalItem } from './check_evals.mjs';
import {
  buildSummaryMetrics,
  normalizeTriggerCase,
  runTriggerProbe,
  scoreCaseRuns,
} from './run_trigger_online.mjs';

test('runTriggerProbe installs co-installed and competing skills and restores backups', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'oss-trigger-eval-'));
  t.after(() => rm(root, { force: true, recursive: true }));

  const skillsDir = join(root, 'skills');
  const existingSibling = join(skillsDir, 'sibling-skill');
  await mkdir(existingSibling, { recursive: true });
  await writeFile(join(existingSibling, 'SKILL.md'), 'original-sibling');

  const fakeOpencode = join(root, 'fake-opencode.mjs');
  await writeFile(
    fakeOpencode,
    [
      '#!/usr/bin/env node',
      "import { readdirSync } from 'node:fs';",
      'const skillsDir = process.env.TEST_SKILLS_DIR;',
      'const names = readdirSync(skillsDir).filter((n) => !n.startsWith(".")).sort();',
      'if (JSON.stringify(names) !== JSON.stringify(["competing-skill", "sibling-skill", "target-skill"])) {',
      '  process.exit(2);',
      '}',
      'const query = process.argv[3];',
      'if (query === "multi") {',
      '  console.log(JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { input: { name: "target-skill" } } } }));',
      '  console.log(JSON.stringify({ type: "step_finish", part: { reason: "tool-calls" } }));',
      '  console.log(JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { input: { id: "sibling-skill" } } } }));',
      '  console.log(JSON.stringify({ type: "step_finish", part: { reason: "stop" } }));',
      '} else if (query === "conflict") {',
      '  console.log(JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { input: { name: "target-skill" } } } }));',
      '  console.log(JSON.stringify({ type: "tool_use", part: { tool: "skill", state: { input: { name: "competing-skill" } } } }));',
      '  console.log(JSON.stringify({ type: "step_finish", part: { reason: "stop" } }));',
      '}',
    ].join('\n'),
  );
  await chmod(fakeOpencode, 0o755);

  process.env.TEST_SKILLS_DIR = skillsDir;
  const extraSkills = [
    { description: 'Sibling skill.', name: 'sibling-skill', role: 'own' },
    {
      description: 'Competing skill.',
      name: 'competing-skill',
      role: 'similar',
    },
  ];

  const multiProbe = await runTriggerProbe({
    expectedSkills: ['target-skill', 'sibling-skill'],
    extraSkills,
    model: 'test-model',
    opencodeBin: fakeOpencode,
    query: 'multi',
    repoRoot: root,
    skill: { description: 'Target skill.', name: 'target-skill' },
    skillsDir,
    timeout: 5,
  });
  assert.deepEqual(multiProbe.triggered_skills, [
    'target-skill',
    'sibling-skill',
  ]);

  const conflictProbe = await runTriggerProbe({
    expectedSkills: ['target-skill'],
    extraSkills,
    model: 'test-model',
    opencodeBin: fakeOpencode,
    query: 'conflict',
    repoRoot: root,
    skill: { description: 'Target skill.', name: 'target-skill' },
    skillsDir,
    timeout: 5,
  });
  assert.deepEqual(conflictProbe.triggered_skills, [
    'target-skill',
    'competing-skill',
  ]);
  assert.equal(
    await readFile(join(existingSibling, 'SKILL.md'), 'utf8'),
    'original-sibling',
  );
});

test('scoreCaseRuns and buildSummaryMetrics cover own and similar skill scenarios', async () => {
  const repoRoot = process.cwd();
  const singleCase = await normalizeTriggerCase(
    {
      co_installed_skills: ['lynx-tasm-codec'],
      expected_skills: ['lynx-devtool'],
      forbidden_skills: ['lynx-tasm-codec'],
      query: 'Inspect DOM tree on connected Lynx device with DevTool only.',
      scenario: 'own_single_trigger',
      should_trigger: true,
    },
    'lynx-devtool',
    repoRoot,
  );
  const singlePass = scoreCaseRuns({
    errors: [],
    normalizedCase: singleCase,
    runsPerQuery: 1,
    skillName: 'lynx-devtool',
    triggerThreshold: 0.5,
    triggeredByRun: [['lynx-devtool']],
  });
  assert.equal(singlePass.pass, true);
  assert.equal(singlePass.conflict_rate, 0);

  const singleConflict = scoreCaseRuns({
    errors: [],
    normalizedCase: singleCase,
    runsPerQuery: 1,
    skillName: 'lynx-devtool',
    triggerThreshold: 0.5,
    triggeredByRun: [['lynx-devtool', 'lynx-tasm-codec']],
  });
  assert.equal(singleConflict.pass, false);
  assert.equal(singleConflict.conflict_rate, 1);

  const multiCase = await normalizeTriggerCase(
    {
      co_installed_skills: ['lynx-tasm-codec'],
      expected_skills: ['lynx-devtool', 'lynx-tasm-codec'],
      query: 'Encode JSON to tasm and then inspect the page with Lynx DevTool.',
      scenario: 'own_multi_trigger',
      should_trigger: true,
    },
    'lynx-devtool',
    repoRoot,
  );
  const multiPass = scoreCaseRuns({
    errors: [],
    normalizedCase: multiCase,
    runsPerQuery: 1,
    skillName: 'lynx-devtool',
    triggerThreshold: 0.5,
    triggeredByRun: [['lynx-devtool', 'lynx-tasm-codec']],
  });
  assert.equal(multiPass.pass, true);

  const similarPresentCase = await normalizeTriggerCase(
    {
      competing_skills: [
        {
          description: 'Debug Chrome browser tabs with CDP.',
          name: 'chrome-devtools',
        },
      ],
      expected_skills: ['lynx-devtool'],
      forbidden_skills: ['chrome-devtools'],
      query: 'Inspect Lynx DOM and console logs with Lynx DevTool.',
      scenario: 'similar_skill_present',
      should_trigger: true,
    },
    'lynx-devtool',
    repoRoot,
  );
  const similarPresentPass = scoreCaseRuns({
    errors: [],
    normalizedCase: similarPresentCase,
    runsPerQuery: 1,
    skillName: 'lynx-devtool',
    triggerThreshold: 0.5,
    triggeredByRun: [['lynx-devtool']],
  });
  assert.equal(similarPresentPass.pass, true);

  const similarRequestedCase = await normalizeTriggerCase(
    {
      competing_skills: [
        {
          description: 'Debug Chrome browser tabs with CDP.',
          name: 'chrome-devtools',
        },
      ],
      expected_skills: ['chrome-devtools'],
      forbidden_skills: ['lynx-devtool'],
      query: 'Use chrome-devtools to inspect a desktop Chrome web page.',
      scenario: 'similar_skill_requested',
      should_trigger: false,
    },
    'lynx-devtool',
    repoRoot,
  );
  const similarRequestedPass = scoreCaseRuns({
    errors: [],
    normalizedCase: similarRequestedCase,
    runsPerQuery: 1,
    skillName: 'lynx-devtool',
    triggerThreshold: 0.5,
    triggeredByRun: [['chrome-devtools']],
  });
  assert.equal(similarRequestedPass.pass, true);

  const summary = buildSummaryMetrics(
    [singlePass, multiPass, similarPresentPass, similarRequestedPass],
    0.75,
  );
  assert.equal(summary.pass_rate, 1);
  assert.equal(summary.multi_skill.own_skills.pass_rate, 1);
  assert.equal(summary.multi_skill.similar_skills.our_skill_trigger_rate, 1);
  assert.equal(
    summary.multi_skill.similar_skills.other_skill_non_trigger_rate,
    1,
  );
  assert.equal(
    summary.multi_skill.similar_skills.other_skill_requested
      .other_skill_trigger_rate,
    1,
  );
});

test('validateTriggerEvalItem rejects inconsistent multi-skill definitions', () => {
  assert.throws(
    () =>
      validateTriggerEvalItem(
        {
          co_installed_skills: ['lynx-tasm-codec'],
          expected_skills: ['lynx-tasm-codec'],
          query: 'Should trigger is true but target skill is omitted.',
          should_trigger: true,
        },
        1,
        'trigger_eval.json',
        'lynx-devtool',
      ),
    /missing from expected_skills/u,
  );
});
