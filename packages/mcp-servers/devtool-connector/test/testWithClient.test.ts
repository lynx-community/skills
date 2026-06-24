// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { test } from 'node:test';
import type { Client } from '../src/transport/transport.ts';
import {
  getTestingSession,
  selectTestingClient,
  TEST_PAGE_URL,
  type TestingTarget,
} from './testWithClient.ts';

test('selectTestingClient picks the target package', (t) => {
  const clients: Client[] = [
    {
      id: 'device:8901',
      info: {
        App: 'TikTok-M',
        AppProcessName: 'com.zhiliaoapp.musically',
      },
    },
    {
      id: 'device:8902',
      info: {
        App: 'LynxPlayground',
        AppProcessName: 'com.lynx.uiapp',
      },
    },
  ];
  const target: TestingTarget = {
    appPackageName: 'com.lynx.uiapp',
    pageUrl: TEST_PAGE_URL,
    openUrl: TEST_PAGE_URL,
  };

  const client = selectTestingClient(clients, target);

  t.assert.equal(client?.id, 'device:8902');
});

test('selectTestingClient returns undefined when no match', (t) => {
  const clients: Client[] = [
    {
      id: 'device:8901',
      info: {
        App: 'TikTok-M',
        AppProcessName: 'com.zhiliaoapp.musically',
      },
    },
  ];
  const target: TestingTarget = {
    appPackageName: 'com.lynx.uiapp',
    pageUrl: TEST_PAGE_URL,
    openUrl: TEST_PAGE_URL,
  };

  const client = selectTestingClient(clients, target);

  t.assert.equal(client, undefined);
});

test('getTestingSession returns the latest session', async (t) => {
  const connector = {
    async sendListSessionMessage() {
      return [
        { session_id: 1, url: 'https://example.com/a' },
        { session_id: 2, url: TEST_PAGE_URL },
      ];
    },
  };

  const session = await getTestingSession(connector, 'device:8901');

  t.assert.equal(session.session_id, 2);
});

test('getTestingSession throws when no sessions exist', async (t) => {
  const connector = {
    async sendListSessionMessage() {
      return [];
    },
  };

  await t.assert.rejects(() => getTestingSession(connector, 'device:8901'), {
    message: /No sessions found/,
  });
});
