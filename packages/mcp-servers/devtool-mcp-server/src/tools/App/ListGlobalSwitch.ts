// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { clientId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';
import { GLOBAL_SWITCH_KEYS } from './globalSwitch.ts';

export const ListGlobalSwitch = /*#__PURE__*/ defineTool({
  name: 'App_listGlobalSwitch',
  description: 'List all global switch states by querying each supported key.',
  schema: {
    clientId,
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    const switches: Array<{ key: string; value?: boolean; error?: string }> =
      [];

    for (const key of GLOBAL_SWITCH_KEYS) {
      try {
        const value = await connector.getGlobalSwitch(params.clientId, key);
        switches.push({ key, value });
      } catch (error) {
        switches.push({
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    response.appendLines(JSON.stringify({ switches }));
  },
});
