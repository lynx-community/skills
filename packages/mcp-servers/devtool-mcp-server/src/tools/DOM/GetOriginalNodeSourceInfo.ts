// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  type OriginalNodeSourceInfo,
  remapOriginalNodeSourceInfo,
} from '@lynx-js/devtool-connector/command';
import { clientId, nodeId, sessionId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const GetOriginalNodeSourceInfo = /*#__PURE__*/ defineTool({
  name: 'DOM_getOriginalNodeSourceInfo',
  description:
    'Get source info for an element node. When debug metadata is available, remap it and append repo, source, line, and column.',
  schema: {
    clientId,
    sessionId,
    nodeId,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler(
    { params: { clientId, sessionId, nodeId } },
    response,
    context,
  ) {
    const connector = context.connector();

    const result = await connector.sendCDPMessage(
      clientId,
      sessionId,
      'DOM.getOriginalNodeSourceInfo',
      { nodeId },
    );

    const remapped = await remapOriginalNodeSourceInfo(
      result as OriginalNodeSourceInfo,
    );

    response.appendLines(JSON.stringify(remapped));
  },
});
