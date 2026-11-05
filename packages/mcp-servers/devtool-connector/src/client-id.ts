// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
export type ClientTarget = number | string;

export class ClientId {
  readonly transportId: string;
  readonly deviceId: string;
  readonly port: ClientTarget;

  constructor(transportId: string, deviceId: string, port: ClientTarget) {
    this.transportId = transportId;
    this.deviceId = deviceId;
    this.port = port;
  }

  static serialize(transportId: string, deviceId: string, target: ClientTarget): string {
    const encodedTransportId = encodeURIComponent(transportId);
    const encodedDeviceId = encodeURIComponent(deviceId);
    const encodedTarget = typeof target === "string" ? encodeURIComponent(target) : target;
    return `${encodedTransportId}:${encodedDeviceId}:${encodedTarget}`;
  }

  static deserialize(clientId: string): ClientId | null {
    try {
      const [rawTransportId, rawDeviceId, rawTarget, ...rest] = clientId.split(":");
      if (rawTransportId === undefined || rawDeviceId === undefined || rawTarget === undefined || rest.length > 0) {
        return null;
      }

      const transportId = decodeURIComponent(rawTransportId);
      const deviceId = decodeURIComponent(rawDeviceId);
      const target = decodeURIComponent(rawTarget);
      if (!transportId || !deviceId || !target) return null;

      const port = /^-?\d+$/.test(target) ? Number(target) : target;
      if (typeof port === "number" && !Number.isSafeInteger(port)) return null;

      return new ClientId(transportId, deviceId, port);
    } catch {
      return null;
    }
  }
}
