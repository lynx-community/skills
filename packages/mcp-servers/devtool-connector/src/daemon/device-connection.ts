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
  #disposePromise: Promise<void> | null = null;
  #terminalCause: unknown;
  #connectPromise: Promise<Connection<unknown, unknown>> | null = null;
  #readLoopPromise: Promise<void> | null = null;
  #registered: Promise<AppInfo>;
  #resolveRegistered!: (appInfo: AppInfo) => void;
  #rejectRegistered!: (reason?: unknown) => void;
  #registrationSettled = false;

  /** Populated after a successful Initialize/Register handshake. */
  appInfo: AppInfo | null = null;

  constructor(transport: Transport, options: TransportConnectOptions) {
    this.#transport = transport;
    this.#options = options;
    this.deviceId = options.deviceId;
    this.port = options.port;
    this.key = `${options.deviceId}:${options.port}`;
    this.#registered = new Promise<AppInfo>((resolve, reject) => {
      this.#resolveRegistered = resolve;
      this.#rejectRegistered = reject;
    });
    void this.#registered.catch(() => {});
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

    try {
      this.#connectPromise = this.#transport.connect(this.#options);
      this.#conn = await this.#connectPromise;
    } catch (error) {
      this.#rejectRegistration(error);
      throw error;
    }
    if (this.#disposed) {
      const error = new Error(
        `DeviceConnection ${this.key} was disposed before connect completed`,
      );
      this.#rejectRegistration(error);
      throw error;
    }

    this.#writer = this.#conn.writable.getWriter();
    this.#readLoopPromise = this.#readLoop();
    debug('connected to %s', this.key);
  }

  waitUntilRegistered(): Promise<AppInfo> {
    return this.#registered;
  }

  addSubscriber(subscriber: DeviceConnectionSubscriber): void {
    if (this.#disposed) {
      throw new Error(`Device connection ${this.key} is no longer active`);
    }
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
    if (this.#disposed) {
      throw (
        this.#terminalCause ??
        new Error(`DeviceConnection ${this.key} is no longer active`)
      );
    }
    if (!this.#writer) {
      throw new Error(`DeviceConnection ${this.key} is not connected`);
    }
    try {
      await this.#writer.write(message);
    } catch (err) {
      debug('send to %s failed: %O', this.key, err);
      this.#terminate(err, false);
      throw this.#terminalCause ?? err;
    }
  }

  dispose(): Promise<void> {
    this.#disposed = true;
    this.#rejectRegistration(
      new Error(`DeviceConnection ${this.key} was disposed before Register`),
    );
    return this.#startDisposal(true);
  }

  async #disposeConnection(awaitReadLoop: boolean): Promise<void> {
    debug('disposing device connection %s', this.key);
    let disposeFailed = false;
    let disposeCause: unknown;

    try {
      if (!this.#conn && this.#connectPromise)
        this.#conn = await this.#connectPromise;
    } catch {
      // No connection was acquired, so there is nothing to dispose.
    }

    try {
      this.#writer?.releaseLock();
    } catch {
      // ignore
    }
    this.#writer = null;

    try {
      await this.#conn?.[Symbol.asyncDispose]();
    } catch (err) {
      debug('error disposing connection %s: %O', this.key, err);
      disposeFailed = true;
      disposeCause = err;
    }

    if (awaitReadLoop && !disposeFailed) await this.#readLoopPromise;
    this.#subscribers.clear();
    if (disposeFailed) throw disposeCause;
  }

  #startDisposal(awaitReadLoop: boolean): Promise<void> {
    if (!this.#disposePromise) {
      this.#disposePromise = this.#disposeConnection(awaitReadLoop);
      void this.#disposePromise.catch((err: unknown) => {
        debug('device connection %s disposal failed: %O', this.key, err);
      });
    }
    return this.#disposePromise;
  }

  async #readLoop(): Promise<void> {
    if (!this.#conn) return;

    let terminalCause: unknown;
    try {
      for await (const message of this.#conn.readable) {
        if (this.appInfo === null) {
          const response = message as Response;
          if (isInitializeResponse(response)) {
            this.#resolveRegistration(response.data.info);
            debug('captured appInfo for %s: %O', this.key, this.appInfo);
            continue;
          }
        }

        this.#broadcast(message);
      }
    } catch (err) {
      terminalCause = err;
      if (!this.#disposed) {
        debug('read loop error on %s: %O', this.key, err);
      }
    }

    if (!this.#disposed) {
      debug('device connection %s closed by remote', this.key);
      this.#terminate(
        terminalCause ??
          new Error(
            this.appInfo === null
              ? `Device connection ${this.key} closed before Register`
              : `Device connection ${this.key} closed by remote`,
          ),
        true,
      );
    }
  }

  #terminate(cause: unknown, readLoopEnded: boolean): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#terminalCause = cause;
    this.#rejectRegistration(cause);
    void this.#startDisposal(!readLoopEnded);
    this.#closeAllSubscribers();
  }

  #resolveRegistration(appInfo: AppInfo): void {
    if (this.#registrationSettled) return;
    this.#registrationSettled = true;
    this.appInfo = appInfo;
    this.#resolveRegistered(appInfo);
  }

  #rejectRegistration(reason: unknown): void {
    if (this.#registrationSettled) return;
    this.#registrationSettled = true;
    this.#rejectRegistered(reason);
  }

  #closeAllSubscribers(): void {
    for (const [, subscriber] of this.#subscribers) {
      try {
        subscriber.close();
      } catch (err) {
        debug('failed to close subscriber %d: %O', subscriber.id, err);
      }
    }
    this.#subscribers.clear();
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
