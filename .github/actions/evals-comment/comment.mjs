// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { appendFile, readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

const MAX_COMMENT_LENGTH = 64_000;

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const inputs = readInputs();
  const report = normalizeReport(await readResultPayload(inputs));
  const body = truncateComment(
    formatComment({
      marker: inputs.marker,
      report,
      title: inputs.title,
    }),
  );

  await writeOutput('body', body);

  if (inputs.dryRun) {
    console.info(body);
    return;
  }

  const event = await readEventPayload();
  const repository = parseRepository(process.env.GITHUB_REPOSITORY);
  const prNumber = inputs.prNumber ?? getPullRequestNumber(event);
  if (!prNumber) {
    throw new Error(
      'Unable to determine the pull request number. Run this action on a pull_request event or pass pr-number.',
    );
  }

  const token = inputs.githubToken || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'Missing github-token. Pass github-token or allow the action to use github.token.',
    );
  }

  const client = createGitHubClient(token);
  try {
    const existingComment = inputs.updateExisting
      ? await findExistingComment(client, repository, prNumber, inputs.marker)
      : undefined;
    const comment = existingComment
      ? await updateComment(client, repository, existingComment.id, body)
      : await createComment(client, repository, prNumber, body);

    await writeOutput('comment-id', String(comment.id ?? ''));
    await writeOutput('comment-url', String(comment.html_url ?? ''));
    console.info(
      existingComment
        ? `Updated skill evals comment: ${comment.html_url}`
        : `Created skill evals comment: ${comment.html_url}`,
    );
  } catch (error) {
    console.warn(
      `Unable to publish skill evals comment; scores remain available in the workflow summary. ${formatErrorMessage(error)}`,
    );
  }
}

function readInputs() {
  const resultFile = emptyToUndefined(process.env.INPUT_RESULT_FILE);
  const resultJson = emptyToUndefined(process.env.INPUT_RESULT_JSON);
  if (!resultFile && !resultJson) {
    throw new Error('Pass result-file or result-json to evals-comment.');
  }
  if (resultFile && resultJson) {
    throw new Error('Pass only one of result-file or result-json.');
  }

  return {
    dryRun: parseBoolean(process.env.INPUT_DRY_RUN, false),
    githubToken: emptyToUndefined(process.env.INPUT_GITHUB_TOKEN),
    marker: process.env.INPUT_MARKER?.trim() || '<!-- skill-evals-comment -->',
    prNumber: parseOptionalPositiveInteger(process.env.INPUT_PR_NUMBER),
    resultFile,
    resultJson,
    title: process.env.INPUT_TITLE?.trim() || 'Skill Evals',
    updateExisting: parseBoolean(process.env.INPUT_UPDATE_EXISTING, true),
  };
}

async function readResultPayload(inputs) {
  if (inputs.resultJson) {
    return parseJson(inputs.resultJson, 'result-json');
  }

  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const filePath = isAbsolute(inputs.resultFile)
    ? inputs.resultFile
    : resolve(workspace, inputs.resultFile);
  const content = await readFile(filePath, 'utf8');
  return parseJson(content, filePath);
}

function parseJson(content, source) {
  try {
    return JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${source} as JSON: ${message}`);
  }
}

function normalizeReport(payload) {
  const taskError =
    payload && typeof payload.task_error === 'string'
      ? payload.task_error.trim()
      : '';
  const taskSkip =
    payload && typeof payload.task_skip === 'string'
      ? payload.task_skip.trim()
      : '';
  const triggerError =
    payload && typeof payload.trigger_error === 'string'
      ? payload.trigger_error.trim()
      : '';
  const triggerSkip =
    payload && typeof payload.trigger_skip === 'string'
      ? payload.trigger_skip.trim()
      : '';
  const reports = normalizeReportList(payload);
  const rows = new Map();
  let definitionSummary;

  for (const report of reports) {
    if (report.kind === 'skill_eval_definition') {
      const normalized = normalizeDefinitionReport(report);
      definitionSummary = normalized.summary;
      for (const row of normalized.results) {
        rows.set(row.skillName, {
          ...(rows.get(row.skillName) ?? emptyRow(row.skillName)),
          ...row,
        });
      }
      continue;
    }

    if (report.kind === 'task_eval') {
      const row = normalizeTaskReport(report);
      rows.set(row.skillName, {
        ...(rows.get(row.skillName) ?? emptyRow(row.skillName)),
        ...row,
      });
      continue;
    }

    if (report.kind === 'trigger_eval') {
      const row = normalizeTriggerReport(report);
      rows.set(row.skillName, {
        ...(rows.get(row.skillName) ?? emptyRow(row.skillName)),
        ...row,
      });
      continue;
    }

    throw new Error(`Unsupported skill eval report kind: ${report.kind}`);
  }

  if (rows.size === 0) {
    throw new Error('Skill eval report did not contain any results.');
  }

  const results = Array.from(rows.values())
    .filter((result) => hasOnlineScore(result) || hasDefinitionError(result))
    .sort((left, right) => left.skillName.localeCompare(right.skillName));
  return {
    definitionSummary,
    results,
    taskError,
    taskSkip,
    taskSummary: buildTaskSummary(results),
    triggerError,
    triggerSkip,
    triggerSummary: buildTriggerSummary(results),
  };
}

function normalizeReportList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.reports)) {
    return payload.reports;
  }
  if (payload && typeof payload === 'object') {
    return [payload];
  }
  throw new Error('Skill eval report must be a JSON object or array.');
}

function normalizeDefinitionReport(report) {
  const results = Array.isArray(report.results) ? report.results : [];
  if (results.length === 0) {
    throw new Error(
      'Skill eval definition report did not contain any results.',
    );
  }

  const normalizedResults = results.map((result, index) =>
    normalizeDefinitionResult(result, index),
  );
  const passed = normalizedResults.filter(
    (result) => result.definitionPass,
  ).length;
  const total = normalizedResults.length;
  const score = numericValue(report.summary?.score, (passed / total) * 100);

  return {
    results: normalizedResults,
    summary: {
      passed: numericValue(report.summary?.passed, passed),
      score: Math.max(0, Math.min(100, score)),
      total: numericValue(report.summary?.total, total),
    },
  };
}

function normalizeDefinitionResult(result, index) {
  assertObject(result, `Skill eval definition result at index ${index}`);

  const definitionPass = Boolean(result.pass);
  return {
    errors: Array.isArray(result.errors)
      ? result.errors.map((error) => String(error)).filter(Boolean)
      : [],
    definitionPass,
    skillName: stringValue(result.skill_name) || `skill-${index + 1}`,
  };
}

function normalizeTaskReport(report) {
  assertObject(report, 'Skill task eval report');
  const config = report.config_summary ?? {};
  const withSkill = normalizeTaskSection(config.with_skill);
  const withoutSkill = normalizeTaskSection(config.without_skill);
  const delta = numericValue(
    config.delta?.pass_rate,
    withSkill.passRate - withoutSkill.passRate,
  );

  return {
    skillName: stringValue(report.skill_name) || 'unknown',
    taskDelta: delta * 100,
    withSkillPassed: withSkill.passed,
    withSkillScore: withSkill.passRate * 100,
    withSkillTotal: withSkill.total,
    withoutSkillPassed: withoutSkill.passed,
    withoutSkillScore: withoutSkill.passRate * 100,
    withoutSkillTotal: withoutSkill.total,
  };
}

function normalizeTriggerReport(report) {
  assertObject(report, 'Skill trigger eval report');
  const results = Array.isArray(report.results) ? report.results : [];
  const computed = computeTriggerSummary(results);
  const summary = report.summary ?? {};
  const passed = numericValue(summary.passed, computed.passed);
  const total = numericValue(summary.total, computed.total);
  const passRate = numericValue(
    summary.pass_rate,
    total === 0 ? 0 : passed / total,
  );

  return {
    skillName: stringValue(report.skill_name) || 'unknown',
    triggerNegativePassed: numericValue(
      summary.negative?.passed,
      computed.negative.passed,
    ),
    triggerNegativeTotal: numericValue(
      summary.negative?.total,
      computed.negative.total,
    ),
    triggerPassed: passed,
    triggerScore: passRate * 100,
    triggerTotal: total,
    triggerPositivePassed: numericValue(
      summary.positive?.passed,
      computed.positive.passed,
    ),
    triggerPositiveTotal: numericValue(
      summary.positive?.total,
      computed.positive.total,
    ),
  };
}

function normalizeTaskSection(section) {
  assertObject(section, 'Skill task eval section');
  return {
    passed: numericValue(section.passed, 0),
    passRate: numericValue(section.pass_rate, 0),
    total: numericValue(section.total, 0),
  };
}

function emptyRow(skillName) {
  return {
    errors: [],
    skillName,
    triggerNegativePassed: undefined,
    triggerNegativeTotal: undefined,
    triggerPositivePassed: undefined,
    triggerPositiveTotal: undefined,
    triggerPassed: undefined,
    triggerScore: undefined,
    triggerTotal: undefined,
  };
}

function buildTaskSummary(results) {
  const taskRows = results.filter(
    (result) =>
      Number.isFinite(result.withSkillScore) &&
      Number.isFinite(result.withoutSkillScore),
  );
  if (taskRows.length === 0) return undefined;

  const withSkill = average(taskRows.map((result) => result.withSkillScore));
  const withoutSkill = average(
    taskRows.map((result) => result.withoutSkillScore),
  );
  return {
    delta: withSkill - withoutSkill,
    skills: taskRows.length,
    withSkill,
    withoutSkill,
  };
}

function buildTriggerSummary(results) {
  const triggerRows = results.filter((result) =>
    Number.isFinite(result.triggerScore),
  );
  if (triggerRows.length === 0) return undefined;
  return {
    score: average(triggerRows.map((result) => result.triggerScore)),
    skills: triggerRows.length,
  };
}

function formatComment({ marker, report, title }) {
  const runLink = getRunLink();
  const failedCount = report.results.filter(
    (result) => !isPassing(result),
  ).length;
  const lines = [marker, `### ${escapeMarkdown(title)}`, ''];

  if (report.definitionSummary) {
    lines.push(
      `Eval definitions: **${report.definitionSummary.passed}/${report.definitionSummary.total} valid**.`,
    );
  }

  if (report.taskSummary) {
    lines.push(
      `Task eval score: **${formatScore(report.taskSummary.withSkill)} / 100 with skill** vs **${formatScore(report.taskSummary.withoutSkill)} / 100 without skill** (Δ ${formatSignedScore(report.taskSummary.delta)}) across ${report.taskSummary.skills} skill suite${report.taskSummary.skills === 1 ? '' : 's'}.`,
    );
    if (report.taskError) {
      lines.push(
        `Online task eval finished with errors after producing reports: ${escapeMarkdown(report.taskError)}`,
      );
    }
  } else if (report.taskError) {
    lines.push(
      `Task eval score: failed before producing online task reports. ${escapeMarkdown(report.taskError)}`,
    );
  } else if (report.taskSkip) {
    lines.push(`Task eval score: skipped. ${escapeMarkdown(report.taskSkip)}`);
  } else {
    lines.push(
      'Task eval score: not run in this report. Online task reports will fill `with_skill`, `without_skill`, and Δ.',
    );
  }

  if (report.triggerSummary) {
    lines.push(
      `Trigger eval score: **${formatScore(report.triggerSummary.score)} / 100** across ${report.triggerSummary.skills} skill suite${report.triggerSummary.skills === 1 ? '' : 's'}.`,
    );
    if (report.triggerError) {
      lines.push(
        `Online trigger eval finished with errors after producing reports: ${escapeMarkdown(report.triggerError)}`,
      );
    }
  } else if (report.triggerError) {
    lines.push(
      `Trigger eval score: failed before producing online trigger reports. ${escapeMarkdown(report.triggerError)}`,
    );
  } else if (report.triggerSkip) {
    lines.push(
      `Trigger eval score: skipped. ${escapeMarkdown(report.triggerSkip)}`,
    );
  }

  if (failedCount > 0) {
    lines.push(
      `${failedCount} skill suite${failedCount === 1 ? ' needs' : 's need'} attention.`,
    );
  }

  if (report.results.length > 0) {
    lines.push(
      '',
      '| Skill | With skill | Without skill | Δ | Trigger |',
      '| - | -: | -: | -: | -: |',
      ...report.results.map((result) => formatSuiteRow(result)),
    );
  }

  const details = report.results
    .filter((result) => result.errors.length > 0)
    .flatMap((result) => [
      `#### ${escapeMarkdown(result.skillName)}`,
      '',
      ...result.errors.map((error) => `- ${escapeMarkdown(error)}`),
      '',
    ]);

  if (details.length > 0) {
    lines.push(
      '',
      '<details>',
      '<summary>Validation errors</summary>',
      '',
      ...details,
      '</details>',
    );
  }

  if (runLink) {
    lines.push('', `[${runLink.label}](${runLink.url})`);
  }

  return lines.join('\n');
}

function formatSuiteRow(result) {
  return [
    escapeTableCell(result.skillName),
    formatTaskScore(
      result.withSkillScore,
      result.withSkillPassed,
      result.withSkillTotal,
    ),
    formatTaskScore(
      result.withoutSkillScore,
      result.withoutSkillPassed,
      result.withoutSkillTotal,
    ),
    formatOptionalSignedScore(result.taskDelta),
    formatTriggerScore(result),
  ]
    .join(' | ')
    .replace(/^/, '| ')
    .replace(/$/, ' |');
}

function isPassing(result) {
  return result.definitionPass !== false;
}

function hasOnlineScore(result) {
  return (
    Number.isFinite(result.withSkillScore) ||
    Number.isFinite(result.withoutSkillScore) ||
    Number.isFinite(result.triggerScore)
  );
}

function hasDefinitionError(result) {
  return result.definitionPass === false || result.errors.length > 0;
}

function getRunLink() {
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
  const repository = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (!repository || !runId) return undefined;
  return {
    label: 'Workflow run',
    url: `${serverUrl}/${repository}/actions/runs/${runId}`,
  };
}

async function readEventPayload() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path) return {};
  return parseJson(await readFile(path, 'utf8'), path);
}

function parseRepository(value) {
  const [owner, repo] = String(value || '').split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY must be set to owner/repo.');
  }
  return { owner, repo };
}

function getPullRequestNumber(event) {
  return parseOptionalPositiveInteger(event?.pull_request?.number);
}

function createGitHubClient(token) {
  return {
    async request(method, path, body) {
      const response = await fetch(`https://api.github.com${path}`, {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        method,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `GitHub API ${method} ${path} failed: ${response.status} ${text}`,
        );
      }
      if (response.status === 204) return {};
      return response.json();
    },
  };
}

async function findExistingComment(client, repository, prNumber, marker) {
  for (let page = 1; page <= 10; page += 1) {
    const comments = await client.request(
      'GET',
      `/repos/${repository.owner}/${repository.repo}/issues/${prNumber}/comments?per_page=100&page=${page}`,
    );
    const match = comments.find(
      (comment) =>
        typeof comment.body === 'string' && comment.body.includes(marker),
    );
    if (match) return match;
    if (comments.length < 100) return undefined;
  }
  return undefined;
}

function createComment(client, repository, prNumber, body) {
  return client.request(
    'POST',
    `/repos/${repository.owner}/${repository.repo}/issues/${prNumber}/comments`,
    { body },
  );
}

function updateComment(client, repository, commentId, body) {
  return client.request(
    'PATCH',
    `/repos/${repository.owner}/${repository.repo}/issues/comments/${commentId}`,
    { body },
  );
}

async function writeOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const delimiter = `evals_comment_${name}_${Date.now()}`;
  await appendFile(
    outputPath,
    `${name}<<${delimiter}\n${value}\n${delimiter}\n`,
  );
}

function truncateComment(body) {
  if (body.length <= MAX_COMMENT_LENGTH) return body;
  return `${body.slice(0, MAX_COMMENT_LENGTH - 80)}\n\n_Comment truncated because it exceeded GitHub's length limit._`;
}

function emptyToUndefined(value) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parseOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got: ${value}`);
  }
  return parsed;
}

function numericValue(value, fallback) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeTriggerSummary(results) {
  const summary = {
    negative: { passed: 0, total: 0 },
    positive: { passed: 0, total: 0 },
    passed: 0,
    total: 0,
  };
  for (const result of results) {
    const shouldTrigger = result?.should_trigger === true;
    const pass = result?.pass === true;
    const bucket = shouldTrigger ? summary.positive : summary.negative;
    bucket.total += 1;
    if (pass) bucket.passed += 1;
    summary.total += 1;
    if (pass) summary.passed += 1;
  }
  return summary;
}

function formatScore(value) {
  return Number(value).toFixed(1);
}

function formatSignedScore(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatScore(value)}`;
}

function formatOptionalSignedScore(value) {
  return Number.isFinite(value) ? formatSignedScore(value) : '-';
}

function formatTaskScore(score, passed, total) {
  if (!Number.isFinite(score)) return '-';
  if (Number.isFinite(passed) && Number.isFinite(total) && total > 0) {
    return `${formatScore(score)} (${passed}/${total})`;
  }
  return formatScore(score);
}

function formatTriggerScore(result) {
  if (!Number.isFinite(result.triggerScore)) return '-';
  if (
    Number.isFinite(result.triggerPassed) &&
    Number.isFinite(result.triggerTotal)
  ) {
    return `${formatScore(result.triggerScore)} (${result.triggerPassed}/${result.triggerTotal})`;
  }
  return formatScore(result.triggerScore);
}

function escapeMarkdown(value) {
  return String(value).replaceAll('|', '\\|');
}

function escapeTableCell(value) {
  return escapeMarkdown(value).replaceAll('\n', '<br>');
}

function formatErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
