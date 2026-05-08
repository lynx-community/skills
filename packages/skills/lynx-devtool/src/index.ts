// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Connector } from '@lynx-js/devtool-connector';
import {
  AndroidTransport,
  DesktopTransport,
  iOSTransport,
  type Transport,
} from '@lynx-js/devtool-connector/transport';
import { createProgram } from './devtool.ts';

function getAndroidTransportSpec(): { host: string; port: number } {
  const port = Number.parseInt(process.env.ADB_SERVER_PORT ?? '5037', 10);

  return {
    host: process.env.ADB_SERVER_HOST ?? '127.0.0.1',
    port: Number.isInteger(port) && port > 0 ? port : 5037,
  };
}

const transports: Transport[] = [
  new AndroidTransport(getAndroidTransportSpec()),
  new DesktopTransport(),
  new iOSTransport(),
];

const connector = new Connector(transports);

await createProgram(connector, transports).parseAsync(process.argv);
