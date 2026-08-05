// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * A client address on a device.
 *
 * Numeric targets are debug-router TCP ports. String targets identify clients
 * that are not reachable through a numeric port and are matched verbatim.
 */
export type ClientTarget = number | string;

export class ClientId {
  static serialize(deviceId: string, target: ClientTarget): string {
    const encodedTarget =
      typeof target === 'string' ? encodeURIComponent(target) : target;
    return `${encodeURIComponent(deviceId)}:${encodedTarget}`;
  }

  static deserialize(
    clientId: string,
  ): { deviceId: string; port: ClientTarget } | null {
    try {
      const lastColonIndex = clientId.lastIndexOf(':');
      if (lastColonIndex === -1) return null;

      const target = decodeURIComponent(clientId.substring(lastColonIndex + 1));
      if (!target) return null;
      const port = /^-?\d+$/.test(target) ? Number(target) : target;
      if (typeof port === 'number' && !Number.isSafeInteger(port)) return null;

      return {
        deviceId: decodeURIComponent(clientId.substring(0, lastColonIndex)),
        port,
      };
    } catch {
      return null;
    }
  }
}
