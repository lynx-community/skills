// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { NetConnectOpts } from 'node:net';

import { parseTcpSocketSpec } from '@yume-chan/adb-server-node-tcp';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 5037;

/**
 * @param socketSpec Socket Spec in https://android.googlesource.com/platform/system/adb/+/refs/heads/main/socket_spec.cpp
 */
export function parseSocketSpec(socketSpec: string): NetConnectOpts {
  if (socketSpec.startsWith('tcp:')) {
    const address = socketSpec.slice(4);
    const { host, port } = parseTcpSocketSpec(address);
    return { host: host ?? DEFAULT_HOST, port: port ?? DEFAULT_PORT };
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
