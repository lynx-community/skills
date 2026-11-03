// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { pluginLess } from '@rsbuild/plugin-less';
import { defineConfig } from '@rspress/core';

const require = createRequire(import.meta.url);

export default defineConfig({
  root: fileURLToPath(new URL('./content', import.meta.url)),
  outDir: 'dist/preview',
  title: 'agent-lynx',
  description: 'Lynx for your agent',
  lang: 'en',
  route: { exclude: ['_agent-lynx/**'] },
  builderConfig: {
    plugins: [pluginLess()],
    server: {
      publicDir: { name: fileURLToPath(new URL('./public', import.meta.url)) },
    },
    resolve: {
      alias: {
        // Match the website's React 18 Markdown renderer.
        '@rspress/core/_private/react': require.resolve(
          'react-render-to-markdown',
        ),
      },
    },
  },
  markdown: { link: { checkDeadLinks: true, checkAnchors: true } },
  llms: true,
  themeConfig: {
    editLink: {
      docRepoBaseUrl:
        'https://github.com/lynx-community/skills/edit/main/packages/agent-lynx-docs/content',
    },
    locales: [
      {
        lang: 'en',
        label: 'English',
        nav: [{ text: 'agent-lynx', link: '/ai/agent-lynx/' }],
      },
      {
        lang: 'zh',
        label: '简体中文',
        nav: [{ text: 'agent-lynx', link: '/zh/ai/agent-lynx/' }],
      },
    ],
  },
});
