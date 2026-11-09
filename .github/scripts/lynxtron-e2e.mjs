// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.env.LYNXTRON_ROOT;
if (!root) throw new Error('LYNXTRON_ROOT is required');
const require = createRequire(path.join(root, 'package.json'));
const { app, devtool, LynxWindow } = await import(
  pathToFileURL(require.resolve('@lynx-js/lynxtron')).href
);

const initialUrl = process.env.LYNXTRON_PAGE_URL;

app.setName('Lynxtron');
app.on('window-all-closed', () => {});

void app.whenReady().then(() => {
  if (!initialUrl) {
    throw new Error('LYNXTRON_PAGE_URL is required');
  }

  devtool.setDevToolEnabled(true);
  devtool.setLogboxEnabled(false);

  const window = new LynxWindow({
    width: 800,
    height: 600,
    windowless: true,
  });
  if (!window.loadURL(initialUrl)) {
    throw new Error(`Lynxtron rejected the page URL: ${initialUrl}`);
  }
}).catch(error => {
  console.error(error);
  app.quit();
});
