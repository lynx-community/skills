// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TestContext } from "node:test";
import { testWithClient } from "../../test/testWithClient.ts";

testWithClient("Connector App", async (t, connector, client, testingTarget) => {
  const clientId = client.id;

  await t.test(
    "sendAppMessage",
    {
      skip: testingTarget.appPackageName === "com.lynx.explorer"
        ? false
        : "The host app may not expose `App.*` methods",
    },
    async (t) => {
      await t.test(
        "App.openPage and App.closePage round-trip",
        {
          skip: testingTarget.appPackageName === "com.lynx.explorer"
            ? "App keeps the Lynx session alive after App.closePage"
            : false,
        },
        async (t) => {
          const initialSessions = await connector.sendListSessionMessage(clientId);

          await connector.sendAppMessage(clientId, "App.openPage", {
            url: testingTarget.openUrl,
          });

          const { setTimeout } = await import("node:timers/promises");
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
            await connector.sendAppMessage(clientId, "App.closePage", {});
          }

          await setTimeout(1000);

          const afterClose = await connector.sendListSessionMessage(clientId);
          t.assert.equal(
            afterClose.length,
            0,
            "App.closePage should remove all sessions",
          );

          await connector.sendAppMessage(clientId, "App.openPage", {
            url: testingTarget.openUrl,
          });
          await setTimeout(1000);
        },
      );

      // TODO(Android): need restart App
      await t.test("App.setBOE on", { skip: true }, async (t: TestContext) => {
        await connector.sendAppMessage(clientId, "App.setBOE", {
          value: "prod",
          switch: true,
        });
        const result = await connector.sendAppMessage<{
          switch: string;
          value: string;
        }>(clientId, "App.getBOE");

        t.assert.equal(result.value, "prod");
        t.assert.ok(
          /**Android */ result.switch === "true"
            /** iOS */ || result.switch === "1",
        );
      });

      // TODO(Android): need restart App
      await t.test("App.setBOE off", { skip: true }, async (t: TestContext) => {
        await connector.sendAppMessage(clientId, "App.setBOE", {
          switch: false,
        });

        const result = await connector.sendAppMessage<{
          switch: string;
          value: string;
        }>(clientId, "App.getBOE");
        t.assert.ok(
          /**Android */ result.switch === "false"
            /** iOS */ || result.switch === "0",
        );
      });

      await t.test("non exist method without params", async (t) => {
        await t.assert.rejects(
          () => connector.sendAppMessage(clientId, "App.fooBar"),
          {
            name: "Error",
            message: "App request App.fooBar error: not implemented",
          },
        );
      });

      await t.test("non exist method", async (t) => {
        await t.assert.rejects(
          () => connector.sendAppMessage(clientId, "App.fooBar", {}),
          {
            name: "Error",
            message: "App request App.fooBar error: not implemented",
          },
        );
      });
    },
  );
});
