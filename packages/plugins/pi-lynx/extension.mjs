// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import {
  createLynxStartupReminder,
  readLynxPluginManifest,
} from '@lynx-js/ai-plugin-lynx/startup-reminder';

const require = createRequire(import.meta.url);
const lynxPluginRoot = dirname(
  require.resolve('@lynx-js/ai-plugin-lynx/package.json'),
);
const lynxSkillsPath = resolve(lynxPluginRoot, 'skills');
const baselineManifest = readLynxPluginManifest(lynxPluginRoot);
const piManifest = {
  skills: [...baselineManifest.skills].sort(),
  mcpServers: [],
};

function appendReminder(systemPrompt) {
  const reminder = createLynxStartupReminder({
    llmsUrl: process.env.LYNX_LLMS_URL,
    manifest: piManifest,
  });
  if (systemPrompt.includes(reminder)) {
    return systemPrompt;
  }
  const basePrompt = systemPrompt.trimEnd();
  return basePrompt ? `${basePrompt}\n\n${reminder}` : reminder;
}

export default function lynxPiPlugin(pi) {
  pi.on('resources_discover', () => ({
    skillPaths: [lynxSkillsPath],
  }));
  pi.on('before_agent_start', (event) => ({
    systemPrompt: appendReminder(event.systemPrompt),
  }));
}
