// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { createDebug } from 'obug';
import type { ClientTarget } from '../client-id.ts';
import type {
  Connection,
  Transport,
  TransportConnectOptions,
} from '../transport/transport.ts';
import { type AppInfo, isInitializeResponse, type Response } from '../types.ts';

const debug = createDebug('devtool-mcp-server:daemon:device-connection');

export interface DeviceConnectionSubscriber {
  readonly id: number;
  send(message: unknown): void;
  close(): void;
}

/**
 * Maintains a persistent connection to a single device:port through a real
 * transport.
 *
 * On first connect it performs the Initialize/Register handshake and caches
 * the {@link AppInfo}. After that, messages from the device are broadcast to
 * all subscribers, and messages from clients are forwarded to the device.
 */
export class DeviceConnection {
  readonly key: string;
  readonly deviceId: string;
  readonly port: ClientTarget;

  #conn: Connection<unknown, unknown> | null = null;
  #writer: WritableStreamDefaultWriter<unknown> | null = null;
  #subscribers = new Map<number, DeviceConnectionSubscriber>();
  #transport: Transport;
  #options: TransportConnectOptions;
  #disposed = false;
  #readLoopPromise: Promise<void> | null = null;

  /** Populated after a successful Initialize/Register handshake. */
  appInfo: AppInfo | null = null;

  constructor(transport: Transport, options: TransportConnectOptions) {
    this.#transport = transport;
    this.#options = options;
    this.deviceId = options.deviceId;
    this.port = options.port;
    this.key = `${options.deviceId}:${options.port}`;
  }

  /**
   * Opens the underlying transport connection. The caller should wrap this
   * in a try/catch — a failure means the device:port is unreachable.
   */
  async connect(): Promise<void> {
    debug('connecting to %s', this.key);
    if (this.#disposed) {
      throw new Error(
        `DeviceConnection ${this.key} was disposed before connect started`,
      );
    }

    const conn = await this.#transport.connect(this.#options);
    if (this.#disposed) {
      await conn[Symbol.asyncDispose]();
      throw new Error(
        `DeviceConnection ${this.key} was disposed before connect completed`,
      );
    }

    this.#conn = conn;
    this.#writer = this.#conn.writable.getWriter();
    this.#readLoopPromise = this.#readLoop();
    debug('connected to %s', this.key);
  }

  addSubscriber(subscriber: DeviceConnectionSubscriber): void {
    this.#subscribers.set(subscriber.id, subscriber);
    debug(
      'subscriber %d added to %s (total: %d)',
      subscriber.id,
      this.key,
      this.#subscribers.size,
    );
  }

  removeSubscriber(id: number): void {
    this.#subscribers.delete(id);
    debug(
      'subscriber %d removed from %s (total: %d)',
      id,
      this.key,
      this.#subscribers.size,
    );
  }

  get subscriberCount(): number {
    return this.#subscribers.size;
  }

  get isDisposed(): boolean {
    return this.#disposed;
  }

  get isPersistent(): boolean {
    return this.#transport.persistent === true;
  }

  async send(message: unknown): Promise<void> {
    if (!this.#writer) {
      throw new Error(`DeviceConnection ${this.key} is not connected`);
    }
    try {
      await this.#writer.write(message);
    } catch (err) {
      debug('send to %s failed: %O', this.key, err);
      throw err;
    }
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    debug('disposing device connection %s', this.key);

    try {
      this.#writer?.releaseLock();
    } catch {
      // ignore
    }

    try {
      await this.#conn?.[Symbol.asyncDispose]();
    } catch (err) {
      debug('error disposing connection %s: %O', this.key, err);
    }

    await this.#readLoopPromise;
    this.#subscribers.clear();
  }

  async #readLoop(): Promise<void> {
    if (!this.#conn) return;

    try {
      for await (const message of this.#conn.readable) {
        if (this.appInfo === null) {
          const response = message as Response;
          if (isInitializeResponse(response)) {
            this.appInfo = response.data.info;
            debug('captured appInfo for %s: %O', this.key, this.appInfo);
            continue;
          }
        }

        this.#broadcast(message);
      }
    } catch (err) {
      if (!this.#disposed) {
        debug('read loop error on %s: %O', this.key, err);
      }
    }

    if (!this.#disposed) {
      debug('device connection %s closed by remote', this.key);
      this.#disposed = true;
      this.#closeAllSubscribers();
    }
  }

  #closeAllSubscribers(): void {
    for (const [, subscriber] of this.#subscribers) {
      try {
        subscriber.close();
      } catch (err) {
        debug('failed to close subscriber %d: %O', subscriber.id, err);
      }
    }
  }

  #broadcast(message: unknown): void {
    for (const [, subscriber] of this.#subscribers) {
      try {
        subscriber.send(message);
      } catch (err) {
        debug('failed to send to subscriber %d: %O', subscriber.id, err);
      }
    }
  }
}
