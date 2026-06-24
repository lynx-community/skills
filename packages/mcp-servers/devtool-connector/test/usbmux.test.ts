// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { once } from 'node:events';
import net from 'node:net';
import { test } from 'node:test';
import { build, type PlistValue, parse } from 'plist';
import { Usbmux } from '../src/transport/usbmux.ts';

const HEADER_SIZE = 16;
const USBMUXD_VERSION = 1;
const USBMUXD_PACKET_TYPE_PLIST = 8;
const TAG = 1;

function encodePacket(payload: PlistValue): Buffer {
  const body = Buffer.from(build(payload), 'utf8');
  const header = Buffer.alloc(HEADER_SIZE);
  header.writeUInt32LE(HEADER_SIZE + body.length, 0);
  header.writeUInt32LE(USBMUXD_VERSION, 4);
  header.writeUInt32LE(USBMUXD_PACKET_TYPE_PLIST, 8);
  header.writeUInt32LE(TAG, 12);
  return Buffer.concat([header, body]);
}

function decodePacket(buffer: Buffer): PlistValue {
  const length = buffer.readUInt32LE(0);
  assert.ok(buffer.length >= length);
  return parse(buffer.subarray(HEADER_SIZE, length).toString('utf8'));
}

test('listDevices exchanges plist packets with usbmuxd', async () => {
  let resolveRequest!: (value: PlistValue) => void;
  let rejectRequest!: (reason?: unknown) => void;
  const request = new Promise<PlistValue>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });

  const server = net.createServer((socket) => {
    socket.once('data', (chunk: Buffer) => {
      try {
        resolveRequest(decodePacket(chunk));
        socket.write(
          encodePacket({
            DeviceList: [
              {
                DeviceID: 42,
                MessageType: 'Attached',
                Properties: {
                  ConnectionSpeed: 480000000,
                  ConnectionType: 'USB',
                  DeviceID: 42,
                  LocationID: 123,
                  ProductID: 456,
                  SerialNumber: 'device-serial',
                  USBSerialNumber: 'usb-serial',
                },
              },
            ],
          }),
        );
      } catch (error) {
        rejectRequest(error);
      }
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const usbmux = new Usbmux({ host: '127.0.0.1', port: address.port });
    const devices = await usbmux.listDevices(AbortSignal.timeout(1000));

    assert.deepStrictEqual(await request, {
      MessageType: 'ListDevices',
      ClientVersionString: 'usbmux-driver',
      ProgName: 'usbmux-driver',
    });
    assert.deepStrictEqual(devices, [
      {
        DeviceID: 42,
        MessageType: 'Attached',
        Properties: {
          ConnectionSpeed: 480000000,
          ConnectionType: 'USB',
          DeviceID: 42,
          LocationID: 123,
          ProductID: 456,
          SerialNumber: 'device-serial',
          USBSerialNumber: 'usb-serial',
        },
      },
    ]);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
