// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Connector } from '@lynx-js/devtool-connector';
import {
  DaemonTransport,
  type Transport,
} from '@lynx-js/devtool-connector/transport';

export * from '@lynx-js/devtool-connector';
export * from '@lynx-js/devtool-connector/streams';
export * from '@lynx-js/devtool-connector/transport';
export {
  type EvaluateOptions,
  evaluateExpression,
  wrapExpression,
} from './evaluate-expression.ts';

export function createDefaultTransports(): Transport[] {
  return [new DaemonTransport()];
}

export function createDefaultConnector(
  transports: Transport[] = createDefaultTransports(),
): Connector {
  return new Connector(transports);
}
