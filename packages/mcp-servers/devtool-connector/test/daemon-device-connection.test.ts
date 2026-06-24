// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import {
  type ReadableStream,
  TransformStream,
  WritableStream,
} from 'node:stream/web';
import { describe, test } from 'node:test';
import { DeviceConnection } from '../src/daemon/device-connection.ts';
import type { Connection, Transport } from '../src/transport/transport.ts';

/**
 * Creates a fake transport where `connect()` returns an in-memory
 * readable/writable pair. The caller can push messages into the device
 * side via the returned `deviceWriter` and read what was sent to the
 * device via `deviceMessages`.
 */
function createFakeTransport(): {
  transport: Transport;
  deviceWriter: WritableStreamDefaultWriter<unknown>;
  deviceMessages: unknown[];
  closeConnection: () => void;
} {
  const deviceMessages: unknown[] = [];

  // Device → Connector direction
  const { readable: deviceReadable, writable: deviceSideWritable } =
    new TransformStream<unknown>();
  const deviceWriter = deviceSideWritable.getWriter();

  // Connector → Device direction
  const closeConnection = (): void => {
    void deviceWriter.close().catch(() => {});
  };
  const connectorWritable = new WritableStream<unknown>({
    write(chunk) {
      deviceMessages.push(chunk);
    },
  });

  const transport: Transport = {
    async close() {},
    async listDevices() {
      return [{ id: 'fake-device', os: 'Android' }];
    },
    async listAvailableApps() {
      return [];
    },
    async openApp() {},
    async connect<TInput, TOutput>(): Promise<Connection<TOutput, TInput>> {
      return {
        readable: deviceReadable as ReadableStream<TOutput>,
        writable: connectorWritable as WritableStream<TInput>,
        async [Symbol.asyncDispose]() {
          closeConnection();
        },
      };
    },
  };

  return { transport, deviceWriter, deviceMessages, closeConnection };
}

describe('DeviceConnection', () => {
  test('connect() establishes the connection and exposes key/deviceId/port', async (t) => {
    const { transport, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    t.assert.equal(conn.key, 'fake-device:8901');
    t.assert.equal(conn.deviceId, 'fake-device');
    t.assert.equal(conn.port, 8901);
  });

  test('send() forwards messages to the underlying transport', async (t) => {
    const { transport, deviceMessages, closeConnection } =
      createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    await conn.send({ event: 'Test', data: 'hello' });
    await conn.send({ event: 'Test', data: 'world' });

    t.assert.equal(deviceMessages.length, 2);
    assert.deepStrictEqual(deviceMessages[0], { event: 'Test', data: 'hello' });
    assert.deepStrictEqual(deviceMessages[1], { event: 'Test', data: 'world' });
  });

  test('broadcasts device messages to all subscribers', async (t) => {
    const { transport, deviceWriter, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    const receivedA: unknown[] = [];
    const receivedB: unknown[] = [];

    conn.addSubscriber({
      id: 1,
      send: (msg) => receivedA.push(msg),
      close() {},
    });
    conn.addSubscriber({
      id: 2,
      send: (msg) => receivedB.push(msg),
      close() {},
    });

    t.assert.equal(conn.subscriberCount, 2);

    // Push a message from the device side
    await deviceWriter.write({ event: 'Customized', data: { type: 'CDP' } });

    // Give the read loop a tick to process
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    t.assert.equal(receivedA.length, 1);
    t.assert.equal(receivedB.length, 1);
    assert.deepStrictEqual(receivedA[0], {
      event: 'Customized',
      data: { type: 'CDP' },
    });
    assert.deepStrictEqual(receivedB[0], {
      event: 'Customized',
      data: { type: 'CDP' },
    });
  });

  test('removeSubscriber stops broadcasting to that subscriber', async (t) => {
    const { transport, deviceWriter, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    const receivedA: unknown[] = [];
    const receivedB: unknown[] = [];

    conn.addSubscriber({
      id: 1,
      send: (msg) => receivedA.push(msg),
      close() {},
    });
    conn.addSubscriber({
      id: 2,
      send: (msg) => receivedB.push(msg),
      close() {},
    });

    // Remove subscriber A
    conn.removeSubscriber(1);
    t.assert.equal(conn.subscriberCount, 1);

    await deviceWriter.write({ event: 'Test' });
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    t.assert.equal(receivedA.length, 0);
    t.assert.equal(receivedB.length, 1);
  });

  test('captures appInfo from Register response and does not broadcast it', async (t) => {
    const { transport, deviceWriter, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    const received: unknown[] = [];
    conn.addSubscriber({
      id: 1,
      send: (msg) => received.push(msg),
      close() {},
    });

    t.assert.equal(conn.appInfo, null);

    // Simulate the device responding to Initialize with Register
    await deviceWriter.write({
      event: 'Register',
      data: {
        id: 8901,
        info: {
          App: 'TestApp',
          AppVersion: '1.0',
          debugRouterId: '1',
          debugRouterVersion: '2.0',
          deviceModel: 'Pixel',
          network: 'USB',
          osVersion: '14',
          sdkVersion: '3.0',
        },
      },
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    // appInfo should be captured
    assert.ok(conn.appInfo !== null);
    assert.equal(conn.appInfo?.App, 'TestApp');

    // Register message should NOT be broadcast to subscribers
    t.assert.equal(received.length, 0);

    // Subsequent messages SHOULD be broadcast
    await deviceWriter.write({ event: 'Customized', data: { type: 'CDP' } });
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    t.assert.equal(received.length, 1);
  });

  test('dispose() cleans up and clears subscribers', async (t) => {
    const { transport, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();

    conn.addSubscriber({ id: 1, send: () => {}, close() {} });
    t.assert.equal(conn.subscriberCount, 1);
    t.assert.equal(conn.isDisposed, false);

    await conn.dispose();

    t.assert.equal(conn.isDisposed, true);
    t.assert.equal(conn.subscriberCount, 0);
  });

  test('send() throws if not connected', async (t) => {
    const { transport } = createFakeTransport();

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    // Don't call connect()

    await t.assert.rejects(() => conn.send({ event: 'Test' }), /not connected/);
  });

  test('dispose() is idempotent', async (t) => {
    const { transport, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();

    await conn.dispose();
    await conn.dispose(); // Should not throw

    t.assert.equal(conn.isDisposed, true);
  });

  test('closes all subscribers when device disconnects (remote close)', async (t) => {
    const { transport, closeConnection } = createFakeTransport();

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();
    t.after(() => conn.dispose());

    const closed: number[] = [];
    conn.addSubscriber({ id: 1, send: () => {}, close: () => closed.push(1) });
    conn.addSubscriber({ id: 2, send: () => {}, close: () => closed.push(2) });

    closeConnection();
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    assert.deepStrictEqual(closed.sort(), [1, 2]);
  });

  test('does not close subscribers when dispose() is called explicitly', async (t) => {
    const { transport, closeConnection } = createFakeTransport();
    t.after(() => closeConnection());

    const conn = new DeviceConnection(transport, {
      deviceId: 'fake-device',
      port: 8901,
    });
    await conn.connect();

    const closed: number[] = [];
    conn.addSubscriber({ id: 1, send: () => {}, close: () => closed.push(1) });

    await conn.dispose();

    t.assert.equal(closed.length, 0);
  });
});
