// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ClientTarget } from '../client-id.ts';
import type { AppInfo } from '../types.ts';

export const DAEMON_PRODUCT = '@lynx-js/devtool-connector';
export const DAEMON_LIFECYCLE_PROTOCOL_VERSION = 1;
export const DAEMON_COMMAND_PROTOCOL_VERSION = 1;

export interface DaemonMetadata {
  product: typeof DAEMON_PRODUCT;
  version: string;
  lifecycleProtocol: number;
  commandProtocol: number;
  instanceId: string;
  startedAt: number;
}

export interface LegacyDaemonMetadata {
  version: string;
  commandProtocol?: number;
}

export interface DaemonShutdownRequest {
  expectedInstanceId: string;
}

// ===== Standard debug-router protocol =====

export interface InitializeEvent {
  event: 'Initialize';
  data: number;
}

export interface RegisterEvent {
  event: 'Register';
  data: { id: number; type: 'Driver' };
}

export interface ClientListEvent {
  event: 'ClientList';
  data: ClientListEntry[];
}

export interface ClientListEntry {
  id: string;
  info: AppInfo;
  type: 'runtime';
}

export interface ListClientsRequest {
  event: 'ListClients';
}

export interface PingEvent {
  event: 'Ping';
}

export interface PongEvent {
  event: 'Pong';
}

// ===== Extended control protocol (daemon-specific) =====

export interface ControlRequest {
  event: 'Control';
  data: {
    id: number;
    method:
      | 'listClients'
      | 'listDevices'
      | 'listAvailableApps'
      | 'openApp'
      | 'subscribe';
    params?: Record<string, unknown>;
  };
}

export interface ControlResponse {
  event: 'ControlResponse';
  data: {
    id: number;
    result?: unknown;
    error?: string;
  };
}

// ===== Union types =====

export type DaemonIncomingMessage =
  | RegisterEvent
  | ListClientsRequest
  | PingEvent
  | ControlRequest
  | CustomizedMessage;

export type DaemonOutgoingMessage =
  | InitializeEvent
  | ClientListEvent
  | PongEvent
  | ControlResponse
  | CustomizedMessage;

export interface CustomizedMessage {
  event: 'Customized';
  data: {
    type: string;
    data: {
      client_id?: ClientTarget;
      session_id?: number;
      message?: unknown;
      [key: string]: unknown;
    };
    sender?: ClientTarget;
    [key: string]: unknown;
  };
  to?: ClientTarget;
}

export function isCustomizedMessage(msg: unknown): msg is CustomizedMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { event?: string }).event === 'Customized'
  );
}

export function isControlRequest(msg: unknown): msg is ControlRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { event?: string }).event === 'Control'
  );
}

export function isListClientsRequest(msg: unknown): msg is ListClientsRequest {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { event?: string }).event === 'ListClients'
  );
}

export function isPingEvent(msg: unknown): msg is PingEvent {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { event?: string }).event === 'Ping'
  );
}

export function isRegisterEvent(msg: unknown): msg is RegisterEvent {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { event?: string }).event === 'Register'
  );
}

// ===== Constants =====

export const DEFAULT_DAEMON_PORT = 21783;
export const DAEMON_WS_PATH = '/devtool/connector';
export const DAEMON_VERSION_PATH: string = `${DAEMON_WS_PATH}/version`;
export const DAEMON_SHUTDOWN_PATH: string = `${DAEMON_WS_PATH}/shutdown`;
export const DAEMON_INSPECTOR_PATH: string = `${DAEMON_WS_PATH}/inspector`;
/** HTTP command endpoint shared with the WebSocket daemon on port 21783. */
export const DAEMON_COMMAND_PATH_PREFIX = '/command/';
