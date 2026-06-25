// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

export class ClientId {
  static serialize(deviceId: string, port: number): string {
    return `${encodeURIComponent(deviceId)}:${port}`;
  }

  static deserialize(
    clientId: string,
  ): { deviceId: string; port: number } | null {
    try {
      const lastColonIndex = clientId.lastIndexOf(':');
      if (lastColonIndex === -1) return null;

      const port = Number.parseInt(clientId.substring(lastColonIndex + 1), 10);
      if (Number.isNaN(port)) return null;

      return {
        deviceId: decodeURIComponent(clientId.substring(0, lastColonIndex)),
        port,
      };
    } catch {
      return null;
    }
  }
}
