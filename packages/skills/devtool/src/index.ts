// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Connector } from "@lynx-js/devtool-connector";
import {
  AndroidTransport,
  DesktopTransport,
  iOSTransport,
  type Transport,
} from "@lynx-js/devtool-connector/transport";
import { createProgram } from "./devtool.ts";

const transports: Transport[] = [
  new AndroidTransport(),
  new DesktopTransport(),
  new iOSTransport(),
];

const connector = new Connector(transports);

await createProgram(connector, transports).parseAsync(process.argv);
