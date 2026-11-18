// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_LYNX_LLMS_URL = 'https://lynxjs.org/llms.txt';

export interface LynxStartupReminderOptions {
  llmsUrl?: string;
  pluginRoot?: string;
  manifest?: LynxPluginManifest;
}

export interface LynxPluginManifest {
  skills: readonly string[];
  mcpServers: readonly string[];
}

function getDefaultPluginRoot() {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return basename(moduleDir) === 'scripts' ? dirname(moduleDir) : moduleDir;
}

function readSkillNames(pluginRoot: string) {
  const skillsDir = resolve(pluginRoot, 'skills');
  if (!existsSync(skillsDir)) {
    return [];
  }

  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(resolve(skillsDir, name, 'SKILL.md')))
    .sort();
}

function formatMcpServer(name: string, server: unknown) {
  if (server == null || typeof server !== 'object') {
    return name;
  }

  const args = 'args' in server ? server.args : undefined;
  if (!Array.isArray(args)) {
    return name;
  }

  const packageArg = args.find(
    (arg): arg is string =>
      typeof arg === 'string' && arg.startsWith('@') && arg.includes('/'),
  );

  return packageArg ? `${name} -> ${packageArg}` : name;
}

function readMcpServerNames(pluginRoot: string) {
  const mcpConfigPath = resolve(pluginRoot, '.mcp.json');
  if (!existsSync(mcpConfigPath)) {
    return [];
  }

  try {
    const config = JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
    return Object.entries(config?.mcpServers ?? {})
      .map(([name, server]) => formatMcpServer(name, server))
      .sort();
  } catch {
    return [];
  }
}

export function readLynxPluginManifest(pluginRoot = getDefaultPluginRoot()) {
  return {
    skills: readSkillNames(pluginRoot),
    mcpServers: readMcpServerNames(pluginRoot),
  } satisfies LynxPluginManifest;
}

function formatManifestList(items: readonly string[]) {
  return items.length > 0 ? items.join(', ') : 'none';
}

export function createLynxStartupReminder(
  options: LynxStartupReminderOptions = {},
) {
  const llmsUrl = options.llmsUrl ?? DEFAULT_LYNX_LLMS_URL;
  const manifest =
    options.manifest ?? readLynxPluginManifest(options.pluginRoot);

  return [
    'Lynx development reminder:',
    'If the task involves a Lynx or ReactLynx project, switch out of the default Web/React-DOM mental model. Lynx uses Web-like syntax to author cross-platform UI, but it is a native rendering engine, not a browser or WebView.',
    "Key guardrails: there is no DOM/window/document; built-in elements such as view/text/image map to native controls; text must live in text elements. Layout is not CSS layout parity: elements are block-like by default, box-sizing is border-box, margin collapse is absent, inline/block toggles do not exist, scrolling uses scroll-view rather than overflow: scroll, and display modes include linear/flex/grid/relative with Lynx-specific behavior. CSS inheritance, events, refs, and JS/runtime APIs can also differ from the Web. ReactLynx runs with a main/background thread model, so use 'background only', 'main thread', and Lynx selector/ref APIs when the docs require them.",
    'Plugin scope manifest:',
    '- Startup context: injects this reminder and the Lynx llms.txt URL.',
    `- Skills: ${formatManifestList(manifest.skills)}.`,
    `- MCP servers: ${formatManifestList(manifest.mcpServers)}.`,
    'Before changing Lynx code, prefer Lynx docs and bundled skills over generic Web assumptions.',
    `Lynx llms.txt: ${llmsUrl}`,
  ].join('\n');
}
