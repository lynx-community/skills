// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from "node:assert/strict";
import { once } from "node:events";
import net from "node:net";
import { test } from "node:test";
import { build, parse, type PlistValue } from "plist";
import { iOSTransport } from "../src/transport/ios.ts";

const HEADER_SIZE = 16;
const USBMUXD_VERSION = 1;
const USBMUXD_PACKET_TYPE_PLIST = 8;
const TAG = 1;

function encodePacket(payload: PlistValue): Buffer {
  const body = Buffer.from(build(payload), "utf8");
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
  return parse(buffer.subarray(HEADER_SIZE, length).toString("utf8"));
}

function toNetworkByteOrderPort(port: number): number {
  return ((port >> 8) & 0xFF) | ((port << 8) & 0xFF00);
}

test("iOSTransport listDevices uses usbmux serial number as device id", async () => {
  let resolveRequest!: (value: PlistValue) => void;
  let rejectRequest!: (reason?: unknown) => void;
  const request = new Promise<PlistValue>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });

  const server = net.createServer((socket) => {
    socket.once("data", (chunk: Buffer) => {
      try {
        resolveRequest(decodePacket(chunk));
        socket.write(encodePacket({
          DeviceList: [
            {
              DeviceID: 42,
              MessageType: "Attached",
              Properties: {
                ConnectionSpeed: 480000000,
                ConnectionType: "USB",
                DeviceID: 42,
                LocationID: 123,
                ProductID: 456,
                SerialNumber: "00008130-0008545E3608001C",
                USBSerialNumber: "usb-serial",
              },
            },
          ],
        }));
      } catch (error) {
        rejectRequest(error);
      }
    });
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");

    const transport = new iOSTransport({ host: "127.0.0.1", port: address.port });
    const devices = await transport.listDevices();

    assert.deepStrictEqual(await request, {
      MessageType: "ListDevices",
      ClientVersionString: "usbmux-driver",
      ProgName: "usbmux-driver",
    });
    assert.deepStrictEqual(devices, [
      { id: "00008130-0008545E3608001C", os: "iOS" },
    ]);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("iOSTransport connect resolves usbmux serial number to device id", async () => {
  const requests: PlistValue[] = [];

  const server = net.createServer((socket) => {
    socket.once("data", (chunk: Buffer) => {
      const request = decodePacket(chunk);
      requests.push(request);

      if (typeof request === "object" && request !== null && request["MessageType"] === "ListDevices") {
        socket.write(encodePacket({
          DeviceList: [
            {
              DeviceID: 42,
              MessageType: "Attached",
              Properties: {
                ConnectionSpeed: 480000000,
                ConnectionType: "USB",
                DeviceID: 42,
                LocationID: 123,
                ProductID: 456,
                SerialNumber: "00008130-0008545E3608001C",
                USBSerialNumber: "usb-serial",
              },
            },
          ],
        }));
        return;
      }

      socket.write(encodePacket({
        MessageType: "Result",
        Number: 0,
      }));
    });
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");

    const transport = new iOSTransport({ host: "127.0.0.1", port: address.port });
    await using conn = await transport.connect({
      deviceId: "00008130-0008545E3608001C",
      port: 8901,
      signal: AbortSignal.timeout(1_000),
    });
    void conn;

    assert.deepStrictEqual(requests, [
      {
        MessageType: "ListDevices",
        ClientVersionString: "usbmux-driver",
        ProgName: "usbmux-driver",
      },
      {
        MessageType: "Connect",
        ClientVersionString: "usbmux-driver",
        ProgName: "usbmux-driver",
        DeviceID: 42,
        PortNumber: toNetworkByteOrderPort(8901),
      },
    ]);
  } finally {
    server.close();
    await once(server, "close");
  }
});
