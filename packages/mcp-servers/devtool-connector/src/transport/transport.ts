// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReadableStream, WritableStream } from 'node:stream/web';
import type { ClientTarget } from '../client-id.ts';
import type { AppInfo } from '../types.ts';

export interface TransportConnectOptions {
  deviceId: string;
  port: ClientTarget;
  signal?: AbortSignal | undefined;
}

/**
 * Narrow a {@link ClientTarget} to the numeric debug-router port required by
 * port-forwarding transports.
 */
export function requireNumericPort(port: ClientTarget): number {
  if (typeof port === 'number') {
    return port;
  }
  if (/^\d+$/.test(port)) {
    return Number(port);
  }
  throw new TypeError(
    `Transport requires a numeric port, received target: ${port}`,
  );
}

export interface OpenAppOptions {
  signal?: AbortSignal;
  withDataCleared?: boolean | undefined;
}

export interface Transport {
  close(): Promise<void>;

  listDevices(): Promise<Device[]>;

  listClients?(): Promise<Client[]>;

  listAvailableApps(deviceId: string): Promise<App[]>;

  openApp(
    deviceId: string,
    packageName: string,
    options?: OpenAppOptions,
  ): Promise<void>;

  connect<TInput = unknown, TOutput = unknown>(
    options: TransportConnectOptions,
  ): Promise<Connection<TOutput, TInput>>;

  readonly persistent?: boolean;
}

export interface Device {
  id: string;
  os: 'iOS' | 'Android' | 'Desktop';
}

export interface Client {
  id: string;
  info: AppInfo;
}

export interface App {
  packageName: string;
  name: string;
}

export interface Connection<TReadable = Uint8Array, TWritable = Uint8Array>
  extends AsyncDisposable {
  readable: ReadableStream<TReadable>;
  writable: WritableStream<TWritable>;
}
