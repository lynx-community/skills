// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';

export const DEFAULT_CLI_PLACEHOLDER = 'agent-lynx';

function nonBlank(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

/** Resolve the user-facing invocation string supplied by an external CLI host. */
export function resolveCliPlaceholder(
  explicitPlaceholder: string | undefined,
  env: NodeJS.ProcessEnv,
): string {
  return nonBlank(explicitPlaceholder)
    ?? nonBlank(env['AGENT_LYNX_INVOKED_AS'])
    ?? nonBlank(env['AGENT_LYNX_CLI_PLACEHOLDER'])
    ?? DEFAULT_CLI_PLACEHOLDER;
}

export function cliPlaceholder(context: { cliPlaceholder?: string; }): string {
  return nonBlank(context.cliPlaceholder) ?? DEFAULT_CLI_PLACEHOLDER;
}

const CLI_PLACEHOLDER_PATTERN = /(?<![\w@/-])agent-lynx(?![\w-])/gu;

/** Replace canonical executable references in user-facing CLI guidance. */
export function replaceCliPlaceholder(
  value: string,
  resolvedPlaceholder: string,
): string {
  return value.replace(CLI_PLACEHOLDER_PATTERN, () => resolvedPlaceholder);
}

function setErrorText(
  error: Error,
  property: 'message' | 'stack',
  value: string,
): void {
  if (Reflect.set(error, property, value)) return;
  Reflect.defineProperty(error, property, {
    configurable: true,
    value,
    writable: true,
  });
}

/** Rewrite a surfaced error while retaining its type, cause, and stack. */
export function replaceCliPlaceholderInError(
  error: unknown,
  resolvedPlaceholder: string,
): unknown {
  if (!(error instanceof Error)) return error;
  const originalMessage = error.message;
  const originalStack = error.stack;
  const message = replaceCliPlaceholder(originalMessage, resolvedPlaceholder);
  const stack = typeof originalStack === 'string'
    ? replaceCliPlaceholder(originalStack, resolvedPlaceholder)
    : undefined;
  if (message !== originalMessage) setErrorText(error, 'message', message);
  if (stack !== undefined && stack !== originalStack) {
    setErrorText(error, 'stack', stack);
  }
  return error;
}

function forceJsonEnabled(env: NodeJS.ProcessEnv): boolean {
  const value = env['AGENT_LYNX_FORCE_JSON'];
  return value === '1' || value === 'true';
}

function ancestorJsonEnabled(command: Command): boolean {
  let current = command.parent;
  while (current) {
    if (current.getOptionValue('json') === true) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Apply root or host JSON preference only to a leaf which declares `--json`.
 * A CLI-sourced leaf value is left untouched so explicit input wins.
 */
export function applyHostJsonPreference(
  command: Command,
  env: NodeJS.ProcessEnv,
): void {
  if (!command.options.some(option => option.long === '--json')) return;
  if (command.getOptionValueSource('json') === 'cli') return;

  if (ancestorJsonEnabled(command)) {
    command.setOptionValueWithSource('json', true, 'implied');
  } else if (forceJsonEnabled(env)) {
    command.setOptionValueWithSource('json', true, 'env');
  }
}
