// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { isListSessionResponse } from '@lynx-js/devtool-connector';
import { FilterTransformStream } from '@lynx-js/devtool-connector/streams';
import * as z from 'zod';
import { clientId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const OpenPage = /*#__PURE__*/ defineTool({
  name: 'Device_openPage',
  description: 'Open a page',
  schema: {
    url: z.string().describe('The URL of the page'),
    clientId,
  },
  annotations: {
    readOnlyHint: false,
  },
  async handler({ params }, _, context) {
    const connector = context.connector();

    // The built-in headless runtime downloads its binary lazily on first use.
    // Wait for it here (tool layer) so the open request below is not cut off
    // while the binary is still downloading.
    if (params.clientId.startsWith('headless:')) {
      await connector.waitForHeadlessReady(params.clientId);
    }

    try {
      await connector.sendAppMessage(params.clientId, 'App.openPage', {
        url: params.url,
      });
    } catch {
      await connector.sendMessage(
        params.clientId,
        {
          event: 'Customized',
          data: {
            type: 'OpenCard',
            data: {
              type: 'url',
              url: params.url,
            },
            sender: -1,
          },
          from: -1,
        },
        {
          input: [],
          output: [new FilterTransformStream(isListSessionResponse)],
        },
      );
    }
  },
});
