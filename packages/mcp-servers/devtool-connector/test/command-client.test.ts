// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { callCommand, streamCommand } from "../src/command/client.ts";
import { InProcessCommandClient } from "../src/command/in-process-client.ts";
import { decodeCommandQuery } from "../src/command/query.ts";
import { fail } from "../src/command/result.ts";
import type { Connector } from "../src/index.ts";

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  let body = "";
  for await (const chunk of req) body += String(chunk);
  return body;
}

test("InProcessCommandClient invokes the same list-clients ActionCore without HTTP", async () => {
  const client = { id: "device:8901", info: { App: "Example" } };
  const connector = {
    async listClients() {
      return [client];
    },
  } as unknown as Connector;

  const result = await new InProcessCommandClient(connector).execute("list-clients", {});

  assert.deepEqual(result, { ok: true, action: "list-clients", data: { clients: [client] } });
});

test("InProcessCommandClient invokes the same list-sessions ActionCore without HTTP", async () => {
  const sessions = [{ session_id: 7, type: "lynx" as const, url: "https://example.test/main.lynx.bundle" }];
  const connector = {
    async sendListSessionMessage(clientId: string) {
      assert.equal(clientId, "device:8901");
      return sessions;
    },
  } as unknown as Connector;

  const result = await new InProcessCommandClient(connector).execute("list-sessions", {
    clientId: "device:8901",
  });

  assert.deepEqual(result, {
    ok: true,
    action: "list-sessions",
    data: { clientId: "device:8901", sessions },
  });
});

test("InProcessCommandClient keeps the regular timeout for a device open", async (t) => {
  const timeoutCalls: number[] = [];
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    timeoutCalls.push(delay);
    return new AbortController().signal;
  });
  const response = {
    event: "Customized" as const,
    data: {
      type: "SessionList" as const,
      data: [{ session_id: 7, type: "lynx" as const, url: "lynx://example/page" }],
    },
  };
  const connector = {
    async openPage(clientId: string, url: string) {
      assert.deepEqual({ clientId, url }, { clientId: "device:8901", url: "lynx://example/page" });
      return response;
    },
  } as unknown as Connector;

  const result = await new InProcessCommandClient(connector).execute("open", {
    clientId: "device:8901",
    url: "lynx://example/page",
  });

  assert.deepEqual(result, {
    ok: true,
    action: "open",
    data: { clientId: "device:8901", response },
  });
  assert.deepEqual(timeoutCalls, [30_000]);
});

test("InProcessCommandClient extends the timeout for an explicit headless open", async (t) => {
  const timeoutCalls: number[] = [];
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    timeoutCalls.push(delay);
    return new AbortController().signal;
  });
  const response = {
    event: "Customized" as const,
    data: {
      type: "SessionList" as const,
      data: [{ session_id: 7, type: "lynx" as const, url: "lynx://example/page" }],
    },
  };
  const connector = {
    async waitForHeadlessReady(clientId: string) {
      assert.equal(clientId, "headless:0");
    },
    async openPage() {
      return response;
    },
  } as unknown as Connector;

  const result = await new InProcessCommandClient(connector).execute("open", {
    clientId: "headless:0",
    url: "lynx://example/page",
  });

  assert.equal(result.ok, true);
  assert.deepEqual(timeoutCalls, [6 * 60_000]);
});

test("InProcessCommandClient lets callers override the action-level timeout", async (t) => {
  const timeoutCalls: number[] = [];
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    timeoutCalls.push(delay);
    return new AbortController().signal;
  });
  const connector = {
    async listClients() {
      return [];
    },
  } as unknown as Connector;

  await new InProcessCommandClient(connector).execute("list-clients", {}, { timeoutMs: 1234 });

  assert.deepEqual(timeoutCalls, [1234]);
});

test("InProcessCommandClient streams the same wait-for-client ActionCore without HTTP", async () => {
  const client = { id: "device:8901", info: { App: "Example" } };
  const discoveries = [[], [client]];
  const connector = {
    async listClients() {
      return discoveries.shift() ?? [];
    },
  } as unknown as Connector;

  const events = [];
  for await (
    const event of new InProcessCommandClient(connector).stream("wait-for-client", {
      timeoutMs: 1_000,
      intervalMs: 0,
    })
  ) {
    events.push(event);
  }

  assert.deepEqual(events.map(event => event.action), ["wait-for-client.progress", "wait-for-client"]);
  assert.equal(events.at(-1)?.ok, true);
  assert.deepEqual(events.at(-1)?.data?.clients, [client]);
});

test("callCommand sends JSON through POST /command/<action>", async (t) => {
  let seen: unknown;
  const server = http.createServer(async (req, res) => {
    seen = { method: req.method, url: req.url, body: JSON.parse(await readBody(req)) };
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, action: "tap", data: { ref: "@e1" } }));
  });
  t.after(() => server.close());
  const port = await listen(server);

  const result = await callCommand("tap", { clientId: "device:8901", sessionId: 3, ref: "@e1" }, {
    port,
    ensureDaemon: false,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data?.ref, "@e1");
  assert.deepEqual(seen, {
    method: "POST",
    url: "/command/tap",
    body: { clientId: "device:8901", sessionId: 3, ref: "@e1" },
  });
});

test("callCommand applies action-level timeouts and preserves explicit overrides", async (t) => {
  const timeoutCalls: number[] = [];
  t.mock.method(AbortSignal, "timeout", (delay: number) => {
    timeoutCalls.push(delay);
    return new AbortController().signal;
  });
  const server = http.createServer(async (req, res) => {
    await readBody(req);
    const action = req.url?.split("/").at(-1) ?? "unknown";
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, action, data: {} }));
  });
  t.after(() => server.close());
  const port = await listen(server);

  await callCommand("open", { clientId: "device:8901", url: "lynx://example/page" }, {
    port,
    ensureDaemon: false,
  });
  await callCommand("tap", { clientId: "device:8901", sessionId: 3, ref: "@e1" }, {
    port,
    ensureDaemon: false,
  });
  await callCommand("open", { clientId: "headless:0", url: "lynx://example/page" }, {
    port,
    ensureDaemon: false,
  });
  await callCommand("open", { clientId: "device:8901", url: "lynx://example/page" }, {
    port,
    ensureDaemon: false,
    timeoutMs: 1234,
  });

  assert.deepEqual(timeoutCalls, [30_000, 30_000, 6 * 60_000, 1234]);
});

test("streamCommand parses fragmented SSE events sent by POST", async (t) => {
  let seen: unknown;
  const server = http.createServer(async (req, res) => {
    seen = {
      method: req.method,
      url: req.url,
      accept: req.headers.accept,
      body: JSON.parse(await readBody(req)),
    };
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.write(`data: ${JSON.stringify({ ok: true, action: "wait.progress", data: { matched: false } })}\r`);
    await new Promise<void>(resolve => setImmediate(resolve));
    res.end(`\n\r\ndata: ${JSON.stringify({ ok: true, action: "wait", data: { matched: true } })}\r\n\r\n`);
  });
  t.after(() => server.close());
  const port = await listen(server);

  const events = [];
  for await (
    const event of streamCommand("wait", { text: "Ready", timeout: 20 }, { port, ensureDaemon: false })
  ) {
    events.push(event);
  }

  assert.deepEqual(seen, {
    method: "POST",
    url: "/command/wait",
    accept: "text/event-stream",
    body: { text: "Ready", timeout: 20 },
  });
  assert.deepEqual(events.map(event => event.action), ["wait.progress", "wait"]);
});

test("streamCommand GET preserves typed values for curl-friendly SSE", async (t) => {
  let decoded: unknown;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    decoded = decodeCommandQuery(url.searchParams);
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(`data: ${
      JSON.stringify({
        ok: false,
        action: "wait",
        error: {
          message: "timeout",
          reason: "timeout",
          recoverable: true,
          nextActions: [],
        },
      })
    }\n\n`);
  });
  t.after(() => server.close());
  const port = await listen(server);

  for await (
    const _event of streamCommand("wait", {
      clientId: "123",
      sessionId: 7,
      text: "true",
      timeout: 0,
    }, { port, ensureDaemon: false, method: "GET" })
  ) {
    void _event; // consume
  }

  assert.deepEqual(decoded, { clientId: "123", sessionId: 7, text: "true", timeout: 0 });
});

test("command clients reject syntactically valid JSON that is not a result envelope", async (t) => {
  const server = http.createServer(async (req, res) => {
    await readBody(req);
    if (req.headers.accept === "text/event-stream") {
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.end("data: null\n\n");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
  t.after(() => server.close());
  const port = await listen(server);

  const unary = await callCommand("snapshot", {}, { port, ensureDaemon: false });
  assert.equal(unary.error?.reason, "invalid-response");

  const events = [];
  for await (const event of streamCommand("wait", { text: "Ready" }, { port, ensureDaemon: false })) {
    events.push(event);
  }
  assert.equal(events.length, 1);
  assert.equal(events[0]?.error?.reason, "invalid-response");
});

test("streamCommand caps an unterminated SSE event", async (t) => {
  const server = http.createServer(async (req, res) => {
    await readBody(req);
    res.writeHead(200, { "content-type": "text/event-stream" });
    res.end(`data: ${"x".repeat(1024 * 1024 + 1)}`);
  });
  t.after(() => server.close());
  const port = await listen(server);

  const events = [];
  for await (const event of streamCommand("wait", { text: "Ready" }, { port, ensureDaemon: false })) {
    events.push(event);
  }
  assert.equal(events.length, 1);
  assert.equal(events[0]?.error?.reason, "invalid-response");
});

test("command clients return structured failures when the daemon is unreachable", async () => {
  const server = http.createServer();
  const port = await listen(server);
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));

  const unary = await callCommand("snapshot", {}, { port, ensureDaemon: false });
  assert.equal(unary.ok, false);
  assert.equal(unary.error?.reason, "daemon-unavailable");

  const events = [];
  for await (
    const event of streamCommand("wait", { text: "Ready" }, { port, ensureDaemon: false })
  ) {
    events.push(event);
  }
  assert.equal(events.length, 1);
  assert.equal(events[0]?.error?.reason, "daemon-unavailable");
});

test("streamCommand reports a pre-aborted request through the result envelope", async () => {
  const controller = new AbortController();
  controller.abort(new Error("caller stopped"));
  const events = [];
  for await (
    const event of streamCommand("wait", { text: "Ready" }, {
      port: 1,
      ensureDaemon: false,
      signal: controller.signal,
    })
  ) {
    events.push(event);
  }
  assert.equal(events.length, 1);
  assert.equal(events[0]?.error?.reason, "aborted");
});

test("fail serializes the deepest Error cause instead of duplicating the wrapper message", () => {
  const result = fail("snapshot", "wrapper failed", {
    cause: new Error("wrapper failed", { cause: new Error("socket reset") }),
  });
  assert.equal(result.error?.cause, "socket reset");
});
