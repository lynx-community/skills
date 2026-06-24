// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId, sessionId, thread } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const GetHeapUsage = /*#__PURE__*/ defineTool({
  name: 'Runtime_getHeapUsage',
  description: 'Returns the JavaScript heap usage for the given session.',
  schema: {
    clientId,
    sessionId,
    thread,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Runtime.enable',
      {},
      params.thread === 'main',
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Runtime.getHeapUsage',
      {},
      params.thread === 'main',
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
