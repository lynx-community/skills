// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { ReadableStream } from 'node:stream/web';
import type { TestContext } from 'node:test';
import { ClientId, type Connector, type GlobalKeys } from '../src/index.ts';
import { getTestingSession, testWithClient } from '../test/testWithClient.ts';

const GLOBAL_SWITCH_READY_TIMEOUT_MS = 5_000;
const GLOBAL_SWITCH_READY_POLL_INTERVAL_MS = 250;

async function waitForGlobalSwitch(
  t: TestContext,
  connector: Connector,
  clientId: string,
  key: GlobalKeys,
  expected: boolean,
  message: string,
): Promise<void> {
  const { setTimeout } = await import('node:timers/promises');
  const deadline = Date.now() + GLOBAL_SWITCH_READY_TIMEOUT_MS;
  let lastValue: boolean | undefined;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      lastValue = await connector.getGlobalSwitch(clientId, key);
      if (lastValue === expected) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await setTimeout(GLOBAL_SWITCH_READY_POLL_INTERVAL_MS);
  }

  const lastErrorMessage =
    lastError instanceof Error ? lastError.message : String(lastError);
  t.assert.fail(
    `${message}; expected ${key}=${expected}, last value: ${lastValue ?? 'unavailable'}, last error: ${
      lastError === undefined ? 'none' : lastErrorMessage
    }`,
  );
}

testWithClient('Connector', async (t, connector, client, testingTarget) => {
  const clientId = client.id;

  await t.test('sendMessage', async (t) => {
    await t.test('ListSession', async (t: TestContext) => {
      await getTestingSession(connector, clientId);

      const response = await connector.sendListSessionMessage(clientId);

      t.assert.ok(Array.isArray(response));
      t.assert.ok(response.length > 0);
    });

    await t.test('listClients', async (t) => {
      const clients = await connector.listClients();
      t.assert.equal(Array.isArray(clients), true);
      t.assert.equal(
        clients.every((client) => ClientId.deserialize(client.id) !== null),
        true,
      );
      t.assert.equal(
        clients.some(({ id }) => id === clientId),
        true,
      );
    });

    await t.test('listClients should enable devtool', async (t) => {
      await connector.setGlobalSwitch(clientId, 'enable_devtool', false);
      await waitForGlobalSwitch(
        t,
        connector,
        clientId,
        'enable_devtool',
        false,
        'setGlobalSwitch should disable devtool before listClients setup',
      );

      await connector.listClients();

      await waitForGlobalSwitch(
        t,
        connector,
        clientId,
        'enable_devtool',
        true,
        'listClients should enable devtool',
      );
    });
  });

  await t.test(
    'sendAppMessage',
    {
      skip:
        testingTarget.appPackageName === 'com.lynx.explorer'
          ? false
          : 'The host app may not expose `App.*` methods',
    },
    async (t) => {
      await t.test(
        'App.openPage and App.closePage round-trip',
        {
          skip:
            testingTarget.appPackageName === 'com.lynx.explorer'
              ? 'App keeps the Lynx session alive after App.closePage'
              : false,
        },
        async (t) => {
          const initialSessions =
            await connector.sendListSessionMessage(clientId);

          await connector.sendAppMessage(clientId, 'App.openPage', {
            url: testingTarget.openUrl,
          });

          const { setTimeout } = await import('node:timers/promises');
          let sessions = await connector.sendListSessionMessage(clientId);
          for (
            let i = 0;
            i < 10 && sessions.length <= initialSessions.length;
            i++
          ) {
            await setTimeout(500);
            sessions = await connector.sendListSessionMessage(clientId);
          }

          t.assert.ok(
            sessions.length > initialSessions.length,
            `App.openPage should create a new session (before: ${initialSessions.length}, after: ${sessions.length})`,
          );

          for (let i = 0; i < sessions.length; i++) {
            await connector.sendAppMessage(clientId, 'App.closePage', {});
          }

          await setTimeout(1000);

          const afterClose = await connector.sendListSessionMessage(clientId);
          t.assert.equal(
            afterClose.length,
            0,
            'App.closePage should remove all sessions',
          );

          await connector.sendAppMessage(clientId, 'App.openPage', {
            url: testingTarget.openUrl,
          });
          await setTimeout(1000);
        },
      );

      // TODO(Android): need restart App
      await t.test('App.setBOE on', { skip: true }, async (t: TestContext) => {
        await connector.sendAppMessage(clientId, 'App.setBOE', {
          value: 'prod',
          switch: true,
        });
        const result = await connector.sendAppMessage<{
          switch: string;
          value: string;
        }>(clientId, 'App.getBOE');

        t.assert.equal(result.value, 'prod');
        t.assert.ok(
          /**Android */ result.switch === 'true' ||
            /** iOS */ result.switch === '1',
        );
      });

      // TODO(Android): need restart App
      await t.test('App.setBOE off', { skip: true }, async (t: TestContext) => {
        await connector.sendAppMessage(clientId, 'App.setBOE', {
          switch: false,
        });

        const result = await connector.sendAppMessage<{
          switch: string;
          value: string;
        }>(clientId, 'App.getBOE');
        t.assert.ok(
          /**Android */ result.switch === 'false' ||
            /** iOS */ result.switch === '0',
        );
      });

      await t.test('non exist method without params', async (t) => {
        await t.assert.rejects(
          () => connector.sendAppMessage(clientId, 'App.fooBar'),
          {
            name: 'Error',
            message: 'App request App.fooBar error: not implemented',
          },
        );
      });

      await t.test('non exist method', async (t) => {
        await t.assert.rejects(
          () => connector.sendAppMessage(clientId, 'App.fooBar', {}),
          {
            name: 'Error',
            message: 'App request App.fooBar error: not implemented',
          },
        );
      });
    },
  );

  await t.test('sendCDPMessage', async (t: TestContext) => {
    await t.test('DOM.getDocument', async (t) => {
      const session = await getTestingSession(connector, clientId);

      const result = await connector.sendCDPMessage<
        undefined,
        { root: unknown }
      >(clientId, session.session_id, 'DOM.getDocument');

      t.assert.partialDeepStrictEqual(result, { root: {} });
    });

    await t.test("Runtime.evaluate without sessionId: 'Main'", async () => {
      const session = await getTestingSession(connector, clientId);

      const result = await connector.sendCDPMessage<
        { result: { value: unknown; type: 'undefined' | 'number' | 'string' } },
        { expression: string }
      >(
        clientId,
        session.session_id,
        'Runtime.evaluate',
        { expression: 'SystemInfo.runtimeType' },
        false,
      );

      t.assert.equal(result.result.type, 'string');
      t.assert.equal(result.result.value, 'quickjs');
    });
    await t.test("Runtime.evaluate with sessionId: 'Main'", async () => {
      const session = await getTestingSession(connector, clientId);

      const result = await connector.sendCDPMessage<
        {
          result: {
            description: string;
            value: unknown;
            type: 'number' | 'string';
          };
        },
        { expression: string }
      >(
        clientId,
        session.session_id,
        'Runtime.evaluate',
        { expression: 'SystemInfo.runtimeType' },
        true,
      );

      t.assert.equal(result.result.type, 'undefined');
      t.assert.equal(result.result.value, undefined);
    });

    await t.test('DOM.getDocument with invalid sessionId', async (t) => {
      await t.assert.rejects(
        () => connector.sendCDPMessage(clientId, -1, 'DOM.getDocument'),
        {
          name: 'Error',
          message: 'CDP request error: Not implemented: DOM.getDocument',
        },
      );
    });

    await t.test('non exist method without params', async (t: TestContext) => {
      const session = await getTestingSession(connector, clientId);

      await t.assert.rejects(
        () =>
          connector.sendCDPMessage(
            clientId,
            session.session_id,
            'DOM.nonExistMethod',
          ),
        {
          name: 'Error',
          message: 'CDP request error: Not implemented: DOM.nonExistMethod',
        },
      );
    });

    await t.test('non exist method', async (t: TestContext) => {
      const session = await getTestingSession(connector, clientId);

      await t.assert.rejects(
        () =>
          connector.sendCDPMessage(
            clientId,
            session.session_id,
            'DOM.nonExistMethod',
            {},
          ),
        {
          name: 'Error',
          message: 'CDP request error: Not implemented: DOM.nonExistMethod',
        },
      );
    });
  });

  await t.test('getGlobalSwitch', async (t) => {
    await t.test('enable_devtool', async (t) => {
      const response = await connector.getGlobalSwitch(
        clientId,
        'enable_devtool',
      );

      t.assert.equal(typeof response, 'boolean');
    });

    await t.test('unknown key', async (t) => {
      // Newer LynxExample returns false for unknown keys; older Android builds never reply.
      try {
        const response = await connector.getGlobalSwitch(
          clientId,
          'unknown_key_v0' as never,
        );
        t.assert.equal(response, false);
      } catch (error) {
        t.assert.ok(error instanceof Error);
        t.assert.match(error.message, /No response found for clientId/);
      }
    });
  });

  await t.test('setGlobalSwitch', async (t) => {
    await t.test('enable_devtool', async (t) => {
      await connector.setGlobalSwitch(clientId, 'enable_devtool', true);
      const devtoolEnabled = await connector.getGlobalSwitch(
        clientId,
        'enable_devtool',
      );

      t.assert.equal(devtoolEnabled, true);
    });

    await t.test('unknown key', async () => {
      await connector.setGlobalSwitch(clientId, 'unknown_key' as never, false);
    });
  });

  await t.test('sendStream', async (t) => {
    await t.test('timeout', { skip: true }, async (t) => {
      await t.assert.rejects(() =>
        connector.sendStream(clientId, new ReadableStream(), {
          signal: AbortSignal.timeout(100),
        }),
      );
    });

    await t.test('Page.takeScreenshot', async (t: TestContext) => {
      const session = await getTestingSession(connector, clientId);
      const sessionId = session.session_id;

      const { promise, resolve } = Promise.withResolvers<{
        data: string;
        metadata: Record<string, number>;
      }>();

      await using stream = await connector.sendCDPStream(
        clientId,
        sessionId,
        new ReadableStream({
          async start(controller) {
            controller.enqueue({
              method: 'Page.startScreencast',
              params: {
                format: 'jpeg',
                quality: 80,
                mode: 'lynxview',
              },
            });

            await promise;

            controller.enqueue({
              method: 'Page.stopScreencast',
            });
            controller.close();
          },
        }),
        { signal: t.signal },
      );

      for await (const { method, params } of stream) {
        if (method === 'Page.screencastFrame') {
          resolve(params as never);
          break;
        }
      }

      const { data, metadata } = await promise;

      t.assert.equal(typeof data, 'string');
      t.assert.ok(data.length > 0, 'Screenshot data should not be empty');
      // JPEG base64 starts with /9j/
      t.assert.ok(
        data.startsWith('/9j/'),
        'Screenshot data should be a JPEG image',
      );
      t.assert.ok(typeof metadata['timestamp'] === 'number');
    });

    await t.test('Lynx.getScreenshot', async (t: TestContext) => {
      const session = await getTestingSession(connector, clientId);
      const sessionId = session.session_id;

      await using stream = await connector.sendCDPStream(
        clientId,
        sessionId,
        ReadableStream.from([{ method: 'Lynx.getScreenshot' }]),
        {
          signal: AbortSignal.any([t.signal, AbortSignal.timeout(30_000)]),
        },
      );

      t.plan(3);
      for await (const { method, params } of stream) {
        if (method === 'Lynx.screenshotCaptured') {
          const result = params as { data: string };
          t.assert.equal(typeof result.data, 'string');
          t.assert.ok(
            result.data.length > 0,
            'Screenshot data should not be empty',
          );
          t.assert.ok(
            result.data.startsWith('/9j/'),
            'Screenshot data should be a JPEG image',
          );
          break;
        }
      }
    });
  });
});
