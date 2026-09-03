// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { createLynxStartupReminder } from '@lynx-js/ai-plugin-lynx/startup-reminder';

const require = createRequire(import.meta.url);
const lynxPluginRoot = dirname(
  require.resolve('@lynx-js/ai-plugin-lynx/package.json'),
);
const skillsPath = resolve(lynxPluginRoot, 'skills');
const mcpConfigPath = resolve(lynxPluginRoot, '.mcp.json');

function readMcpConfig() {
  try {
    return JSON.parse(readFileSync(mcpConfigPath, 'utf8'));
  } catch {
    return {};
  }
}

function toOpenCodeMcpServers(config) {
  const result = {};

  for (const [name, server] of Object.entries(config?.mcpServers ?? {})) {
    if (typeof server.command === 'string') {
      const localServer = {
        type: 'local',
        command: [server.command, ...(server.args ?? [])],
      };
      if (server.cwd != null) {
        localServer.cwd = server.cwd;
      }
      const environment = server.environment ?? server.env;
      if (environment != null) {
        localServer.environment = environment;
      }
      if (server.timeout != null) {
        localServer.timeout = server.timeout;
      }
      result[name] = localServer;
      continue;
    }

    if (typeof server.url === 'string') {
      const remoteServer = {
        type: 'remote',
        url: server.url,
      };
      if (server.headers != null) {
        remoteServer.headers = server.headers;
      }
      if (server.oauth != null) {
        remoteServer.oauth = server.oauth;
      }
      if (server.timeout != null) {
        remoteServer.timeout = server.timeout;
      }
      result[name] = remoteServer;
    }
  }

  return result;
}

const mcpServers = toOpenCodeMcpServers(readMcpConfig());

function appendUnique(target, values) {
  const next = Array.isArray(target) ? target : [];
  for (const value of values) {
    if (!next.includes(value)) {
      next.push(value);
    }
  }
  return next;
}

function addSkillPath(config, skillPath) {
  if (Array.isArray(config.skills)) {
    config.skills = appendUnique(config.skills, [skillPath]);
    return;
  }

  config.skills ??= {};
  config.skills.paths = appendUnique(config.skills.paths, [skillPath]);
}

function addMcpServers(config, servers) {
  if (Object.keys(servers).length === 0) {
    return;
  }

  config.mcp ??= {};
  const target =
    config.mcp.servers && typeof config.mcp.servers === 'object'
      ? config.mcp.servers
      : config.mcp;

  for (const [name, server] of Object.entries(servers)) {
    target[name] ??= server;
  }
}

export default {
  id: 'lynx',
  server: async () => ({
    config: async (config) => {
      addSkillPath(config, skillsPath);
      addMcpServers(config, mcpServers);
    },
    'experimental.chat.system.transform': async (_input, output) => {
      output.system = appendUnique(output.system, [
        createLynxStartupReminder({
          llmsUrl: process.env.LYNX_LLMS_URL,
          pluginRoot: lynxPluginRoot,
        }),
      ]);
    },
  }),
};
