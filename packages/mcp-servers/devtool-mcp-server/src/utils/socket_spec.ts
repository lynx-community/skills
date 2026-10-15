// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NetConnectOpts } from 'node:net';

/**
 * @param socketSpec Socket Spec in https://android.googlesource.com/platform/system/adb/+/refs/heads/main/socket_spec.cpp
 */
export function parseSocketSpec(socketSpec: string): NetConnectOpts {
  if (socketSpec.startsWith('tcp:')) {
    const rest = socketSpec.slice(4);
    const port = parseInt(rest, 10);
    if (!Number.isNaN(port) && String(port) === rest) {
      // tcp:<port>
      return { host: '127.0.0.1', port };
    }
    // tcp:[host]:port or tcp:host:port
    const lastColon = rest.lastIndexOf(':');
    if (lastColon === -1) {
      throw new Error(`Invalid tcp socket spec: ${socketSpec}`);
    }
    const host = rest.slice(0, lastColon).replace(/^\[|\]$/g, '')
      || '127.0.0.1';
    const portStr = rest.slice(lastColon + 1);
    const parsedPort = parseInt(portStr, 10);
    if (Number.isNaN(parsedPort)) {
      throw new Error(`Invalid port in socket spec: ${socketSpec}`);
    }
    return { host, port: parsedPort };
  }

  if (
    socketSpec.startsWith('local:') || socketSpec.startsWith('localfilesystem:')
  ) {
    const prefix = socketSpec.startsWith('local:')
      ? 'local:'
      : 'localfilesystem:';
    return { path: socketSpec.slice(prefix.length) };
  }

  if (socketSpec.startsWith('localabstract:')) {
    // Linux abstract namespace: prepend null byte
    return { path: '\0' + socketSpec.slice(14) };
  }

  throw new Error(`Unsupported socket spec: ${socketSpec}`);
}
