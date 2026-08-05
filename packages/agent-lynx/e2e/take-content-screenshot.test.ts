// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  getTestingSession,
  TEST_APP_PACKAGE_NAME,
  testWithClient,
} from '@lynx-js/devtool-connector/test-with-client';
import { takeContentScreenshot } from '../src/commands/take-content-screenshot.ts';

const TEST_APP_PACKAGE_ENV = 'LYNX_DEVTOOL_MCP_TESTING_APP_PACKAGE';
const MISSING_SELECTOR = '#lynx-devtool-missing-content-screenshot-node';
const NON_SCROLL_SELECTOR = 'view';

const targetAppPackage =
  process.env[TEST_APP_PACKAGE_ENV]?.trim() || TEST_APP_PACKAGE_NAME;
const testWithAndroidLynxExample =
  targetAppPackage === TEST_APP_PACKAGE_NAME
    ? testWithClient
    : testWithClient.skip;

testWithAndroidLynxExample(
  'take-content-screenshot',
  async (suite, connector, client, target) => {
    const session = await getTestingSession(connector, client.id, target);

    await suite.test(
      'captures the full content of a scroll-view as PNG',
      async (t) => {
        const result = await takeContentScreenshot(
          connector,
          client.id,
          session.session_id,
          'scroll-view',
          {
            format: 'png',
            scale: 0.25,
            timeoutMs: 15_000,
          },
        );

        t.assert.ok(result.width > 0, 'Screenshot width must be positive');
        t.assert.ok(result.height > 0, 'Screenshot height must be positive');

        const match = /^data:image\/png;base64,(.+)$/s.exec(result.data);
        t.assert.ok(match?.[1], 'Screenshot must contain a PNG data URL');
        const png = Buffer.from(match[1], 'base64');
        t.assert.deepEqual(
          [...png.subarray(0, 8)],
          [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
          'Decoded content must have a PNG signature',
        );
        t.assert.equal(
          png.readUInt32BE(16),
          result.width,
          'PNG IHDR width must match the UI Method result',
        );
        t.assert.equal(
          png.readUInt32BE(20),
          result.height,
          'PNG IHDR height must match the UI Method result',
        );
      },
    );

    await suite.test(
      'reports a selector that does not match a node',
      async (t) => {
        await t.assert.rejects(
          () =>
            takeContentScreenshot(
              connector,
              client.id,
              session.session_id,
              MISSING_SELECTOR,
              { format: 'png', scale: 1, timeoutMs: 5_000 },
            ),
          {
            message: new RegExp(
              `takeContentScreenshot failed for selector ${JSON.stringify(MISSING_SELECTOR)}: ` +
                '\\[code 2 NODE_NOT_FOUND\\] No node matched the selector\\..*Runtime detail: no node found',
            ),
          },
        );
      },
    );

    await suite.test('reports a node that is not a scroll-view', async (t) => {
      await t.assert.rejects(
        () =>
          takeContentScreenshot(
            connector,
            client.id,
            session.session_id,
            NON_SCROLL_SELECTOR,
            { format: 'png', scale: 1, timeoutMs: 5_000 },
          ),
        {
          message: new RegExp(
            `takeContentScreenshot failed for selector ${JSON.stringify(NON_SCROLL_SELECTOR)}: ` +
              '\\[code 3 METHOD_NOT_FOUND\\].*does not support takeContentScreenshot.*targets a <scroll-view>',
          ),
        },
      );
    });
  },
);
