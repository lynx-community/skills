// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  createDaemonProcessEnvironment,
  DaemonManager,
  resolveDaemonEntryPath,
} from '../src/daemon/manager.ts';
import {
  DAEMON_PRODUCT,
  DAEMON_SHUTDOWN_PATH,
  DAEMON_VERSION_PATH,
} from '../src/daemon/protocol.ts';
import { CONNECTOR_VERSION } from '../src/daemon/version.ts';

function daemonMetadata(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    commandProtocol: 1,
    instanceId: '11111111-1111-4111-8111-111111111111',
    lifecycleProtocol: 1,
    product: DAEMON_PRODUCT,
    startedAt: 1,
    version: CONNECTOR_VERSION,
    ...overrides,
  };
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      rawBody += chunk;
    });
    request.on('end', () => {
      if (rawBody === '') {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(error as Error);
      }
    });
    request.on('error', reject);
  });
}

function listen(server: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

function close(server: http.Server): Promise<void> {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve) => server.close(() => resolve()));
}

test('resolveDaemonEntryPath resolves the source daemon entry from this package', () => {
  assert.equal(resolveDaemonEntryPath(), path.resolve('src/daemon/entry.ts'));
});

test('resolveDaemonEntryPath respects package imports in a built package', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'daemon-manager-'));
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  await fs.mkdir(path.join(tempDir, 'dist', 'daemon'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src', 'daemon'), { recursive: true });
  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify({
      type: 'module',
      imports: { '#daemon-entry': './dist/daemon/entry.js' },
    }),
  );
  await fs.writeFile(
    path.join(tempDir, 'dist', 'daemon', 'entry.js'),
    'export {};\n',
  );
  await fs.writeFile(
    path.join(tempDir, 'src', 'daemon', 'manager.js'),
    'export {};\n',
  );
  const expectedEntryPath = await fs.realpath(
    path.join(tempDir, 'dist', 'daemon', 'entry.js'),
  );

  assert.equal(
    resolveDaemonEntryPath(
      pathToFileURL(path.join(tempDir, 'src', 'daemon', 'manager.js')).href,
    ),
    expectedEntryPath,
  );
});

test('daemon child environment excludes direct transport configuration', () => {
  const sourceEnvironment = {
    ADB_SERVER_HOST: '10.0.0.1',
    ADB_SERVER_PORT: '5038',
    DEBUG: 'devtool-mcp-server:daemon:*',
    PATH: '/usr/bin',
  };

  assert.deepEqual(createDaemonProcessEnvironment(sourceEnvironment), {
    DEBUG: 'devtool-mcp-server:daemon:*',
    PATH: '/usr/bin',
  });
  assert.deepEqual(sourceEnvironment, {
    ADB_SERVER_HOST: '10.0.0.1',
    ADB_SERVER_PORT: '5038',
    DEBUG: 'devtool-mcp-server:daemon:*',
    PATH: '/usr/bin',
  });
});

test('daemon child environment supplies an empty DEBUG default', () => {
  assert.deepEqual(createDaemonProcessEnvironment({ PATH: '/usr/bin' }), {
    DEBUG: '',
    PATH: '/usr/bin',
  });
});

test('DaemonManager refuses to stop an unknown process occupying the daemon port', async (t) => {
  const server = http.createServer((_request, response) => {
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(() => close(server));

  await assert.rejects(DaemonManager.kill(port), /unknown process/);
  assert.equal(server.listening, true);
});

test('DaemonManager refuses to reuse an unknown listener for ordinary daemon callers', async (t) => {
  const server = http.createServer((_request, response) => {
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(() => close(server));

  await assert.rejects(DaemonManager.ensureRunning(port), /unknown process/);
  assert.equal(server.listening, true);
});

test('DaemonManager refuses to replace a listener identifying as another product', async (t) => {
  let shutdownCalls = 0;
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === DAEMON_VERSION_PATH) {
      sendJson(
        response,
        200,
        daemonMetadata({
          product: '@example/not-the-connector',
          version: '0.0.1',
        }),
      );
      return;
    }
    if (request.method === 'POST' && request.url === DAEMON_SHUTDOWN_PATH) {
      shutdownCalls += 1;
    }
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(() => close(server));

  await assert.rejects(
    DaemonManager.ensureRunning(port),
    /another product|instead of/iu,
  );
  assert.equal(shutdownCalls, 0);
  assert.equal(server.listening, true);
});

test('DaemonManager never downgrades a newer connector daemon', async (t) => {
  let shutdownCalls = 0;
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === DAEMON_VERSION_PATH) {
      sendJson(response, 200, daemonMetadata({ version: '9999.0.0' }));
      return;
    }
    if (request.method === 'POST' && request.url === DAEMON_SHUTDOWN_PATH) {
      shutdownCalls += 1;
    }
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(() => close(server));

  await assert.rejects(
    DaemonManager.ensureRunning(port),
    /newer than caller|upgrade the caller/iu,
  );
  assert.equal(shutdownCalls, 0);
  assert.equal(server.listening, true);
});

test('DaemonManager stops an identified connector through its shutdown route', async (t) => {
  let shutdownCalls = 0;
  let shutdownBody: unknown;
  let shutdownContentType: string | undefined;
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === DAEMON_VERSION_PATH) {
      sendJson(response, 200, daemonMetadata());
      return;
    }
    if (request.method === 'POST' && request.url === DAEMON_SHUTDOWN_PATH) {
      shutdownCalls += 1;
      shutdownContentType = request.headers['content-type'];
      void readJsonBody(request).then((body) => {
        shutdownBody = body;
        response.writeHead(202);
        response.end(() => void server.close());
      });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(() => close(server));

  await DaemonManager.kill(port);
  assert.equal(shutdownCalls, 1);
  assert.equal(shutdownContentType, 'application/json');
  assert.deepStrictEqual(shutdownBody, {
    expectedInstanceId: '11111111-1111-4111-8111-111111111111',
  });
  assert.equal(server.listening, false);
});

test('DaemonManager waits through transient unknown probes until the stopped instance leaves', async (t) => {
  let shutdownAccepted = false;
  let closeTimer: NodeJS.Timeout | undefined;
  const server = http.createServer((request, response) => {
    if (request.method === 'GET' && request.url === DAEMON_VERSION_PATH) {
      if (shutdownAccepted) {
        response.writeHead(503);
        response.end();
      } else {
        sendJson(response, 200, daemonMetadata());
      }
      return;
    }
    if (request.method === 'POST' && request.url === DAEMON_SHUTDOWN_PATH) {
      shutdownAccepted = true;
      response.writeHead(202);
      response.end();
      closeTimer = setTimeout(() => void close(server), 250);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const port = await listen(server);
  t.after(async () => {
    if (closeTimer) clearTimeout(closeTimer);
    await close(server);
  });

  await DaemonManager.kill(port);

  assert.equal(shutdownAccepted, true);
  assert.equal(server.listening, false);
});

test(
  'DaemonManager metadata probe settles when the response is aborted',
  { timeout: 2_000 },
  async (t) => {
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.write('{"version":');
      response.destroy();
    });
    const port = await listen(server);
    t.after(() => close(server));

    await assert.rejects(DaemonManager.kill(port), /unknown process/);
  },
);

test(
  'DaemonManager shutdown request settles when the response is aborted',
  { timeout: 2_000 },
  async (t) => {
    const server = http.createServer((request, response) => {
      if (request.method === 'GET' && request.url === DAEMON_VERSION_PATH) {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ version: '0.0.0' }));
        return;
      }
      response.writeHead(202);
      response.write('accepted');
      response.destroy();
    });
    const port = await listen(server);
    t.after(() => close(server));

    await assert.rejects(
      DaemonManager.kill(port),
      /refused the shutdown request/,
    );
  },
);

test(
  'DaemonManager metadata timeout settles even when destroy emits no useful response',
  { timeout: 3_000 },
  async (t) => {
    const server = http.createServer(() => {
      // Keep the request open until the manager-side timeout destroys it.
    });
    const port = await listen(server);
    t.after(() => close(server));

    await assert.rejects(DaemonManager.kill(port), /unknown process/);
  },
);
