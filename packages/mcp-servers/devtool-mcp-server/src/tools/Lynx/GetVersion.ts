// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId, sessionId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const GetVersion = /*#__PURE__*/ defineTool({
  name: 'Lynx_getVersion',
  description: 'Return the Lynx engine version for the selected session.',
  schema: {
    clientId,
    sessionId,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Lynx.getVersion',
      {},
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
