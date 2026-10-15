// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { captureScreenshotFrame } from '@lynx-js/devtool-connector/command';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clientId, screenshotMode, sessionId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const TakeScreenshot = /*#__PURE__*/ defineTool({
  name: 'Page_takeScreenshot',
  description: 'Take a screenshot of the current page.',
  schema: {
    clientId,
    sessionId,
    screenshotMode: screenshotMode.optional(),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params, extra }, response, context) {
    const connector = context.connector();
    const { data } = await captureScreenshotFrame(
      connector,
      params.clientId,
      params.sessionId,
      {
        fullscreen: params.screenshotMode === 'fullscreen',
        ...(extra.signal ? { signal: extra.signal } : {}),
      },
    );

    response.attachImage({
      data,
      mimeType: 'image/jpeg',
    });

    const tmp = await fs.mkdtemp(path.join(tmpdir(), 'lynx-devtool-mcp-'));
    const fileName = `screenshot-Lynx_getScreenshot.jpeg`;
    await fs.writeFile(
      path.join(tmp, fileName),
      Buffer.from(data, 'base64'),
    );
    response.appendLines(`Screenshot saved to ${tmp}/${fileName}`);
  },
});
