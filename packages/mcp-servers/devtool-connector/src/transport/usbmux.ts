// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { on, once } from 'node:events';
import * as net from 'node:net';
import { Duplex } from 'node:stream';
import type { ReadableStream, WritableStream } from 'node:stream/web';
import { build, type PlistValue, parse } from 'plist';

const HEADER_SIZE = 16;
const USBMUXD_VERSION = 1;
const USBMUXD_PACKET_TYPE_PLIST = 8;
const TAG = 1;

export interface UsbmuxdDeviceProperties {
  ConnectionSpeed: number;
  ConnectionType: string;
  DeviceID: number;
  LocationID: number;
  ProductID: number;
  SerialNumber: string;
  USBSerialNumber: string;
}

export interface UsbmuxdDeviceRecord {
  DeviceID: number;
  MessageType: string;
  Properties: UsbmuxdDeviceProperties;
}

export type UsbmuxdResponse =
  | UsbmuxdListDevicesResponse
  | UsbmuxdResultResponse;

export interface UsbmuxdListDevicesResponse {
  DeviceList: UsbmuxdDeviceRecord[];
}

export interface UsbmuxdResultResponse {
  MessageType: 'Result';
  Number: number;
}

export interface UsbmuxdConnectRequest {
  MessageType: 'Connect';
  ClientVersionString: string;
  ProgName: string;
  DeviceID: number;
  PortNumber: number;
}

export interface UsbmuxdListDevicesRequest {
  MessageType: 'ListDevices';
  ClientVersionString: string;
  ProgName: string;
}

export type UsbmuxdRequest = UsbmuxdConnectRequest | UsbmuxdListDevicesRequest;

export interface UsbmuxConnection {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  dispose: () => void;
}

export class Usbmux {
  private connectOptions: net.NetConnectOpts;

  constructor(connectOptions?: net.NetConnectOpts | string) {
    if (typeof connectOptions === 'string') {
      this.connectOptions = { path: connectOptions };
    } else if (connectOptions) {
      this.connectOptions = connectOptions;
    } else {
      this.connectOptions = { path: '/var/run/usbmuxd' };
    }
  }

  public async listDevices(
    signal?: AbortSignal,
  ): Promise<UsbmuxdDeviceRecord[]> {
    const { socket, response } = await this.#sendAndReceive<
      UsbmuxdListDevicesRequest,
      UsbmuxdListDevicesResponse
    >(
      {
        MessageType: 'ListDevices',
        ClientVersionString: 'usbmux-driver',
        ProgName: 'usbmux-driver',
      },
      signal,
    );

    socket.destroy();

    return response.DeviceList;
  }

  public async connect(
    deviceId: number,
    port: number,
    signal?: AbortSignal,
  ): Promise<UsbmuxConnection> {
    // Port must be in network byte order (big-endian)
    const networkPort = ((port >> 8) & 0xff) | ((port << 8) & 0xff00);

    const { socket, response, tail } = await this.#sendAndReceive<
      UsbmuxdConnectRequest,
      UsbmuxdResultResponse
    >(
      {
        MessageType: 'Connect',
        ClientVersionString: 'usbmux-driver',
        ProgName: 'usbmux-driver',
        DeviceID: Number(deviceId),
        PortNumber: networkPort,
      },
      signal,
    );

    if (response.MessageType === 'Result' && response.Number === 0) {
      if (tail.length > 0) {
        socket.unshift(tail);
      }

      const { readable, writable } = Duplex.toWeb(socket);
      return {
        readable,
        writable,
        dispose: () => socket.destroy(),
      };
    }

    socket.destroy();
    throw new Error(
      `Invalid response for Connect: ${JSON.stringify(response)}`,
    );
  }

  async #sendAndReceive<T, R>(
    payload: T,
    signal?: AbortSignal,
  ): Promise<{ socket: net.Socket; response: R; tail: Buffer }> {
    const socket = net.createConnection(this.connectOptions);

    if (signal) {
      const abortHandler = () => socket.destroy();
      signal.addEventListener('abort', abortHandler, { once: true });
      socket.once('close', () =>
        signal.removeEventListener('abort', abortHandler),
      );
    }

    try {
      await once(socket, 'connect', { signal });

      socket.write(encodeRequest());

      let buffer = Buffer.alloc(0);

      // We still use Node.js streams for the handshake part because `Duplex.toWeb`
      // consumes the stream, making it hard to "peek" or "unshift" without extra overhead.
      // Once handshake is done, we convert to Web Streams in `connect`.
      for await (const [chunk] of on(socket, 'data', { signal })) {
        buffer = Buffer.concat([buffer, chunk]);
        if (buffer.length < HEADER_SIZE) continue;

        const length = buffer.readUInt32LE(0);
        if (buffer.length < length) continue;

        const responseBuffer = buffer.subarray(HEADER_SIZE, length);
        const tail = buffer.subarray(length);

        const response = parse(responseBuffer.toString('utf8')) as R;
        return { socket, response, tail };
      }

      throw new Error('Connection closed before response received');
    } catch (error) {
      socket.destroy();
      throw error;
    }

    function encodeRequest(): Buffer {
      const xml = build(payload as PlistValue);
      const body = Buffer.from(xml, 'utf8');
      const length = HEADER_SIZE + body.length;
      const header = Buffer.alloc(HEADER_SIZE);
      header.writeUInt32LE(length, 0);
      header.writeUInt32LE(USBMUXD_VERSION, 4);
      header.writeUInt32LE(USBMUXD_PACKET_TYPE_PLIST, 8);
      header.writeUInt32LE(TAG, 12);
      return Buffer.concat([header, body]);
    }
  }
}
