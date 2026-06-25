// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from 'zod';
import { clientId } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';
import { globalSwitchKeySchema } from './globalSwitch.ts';

export const SetGlobalSwitch = /*#__PURE__*/ defineTool({
  name: 'App_setGlobalSwitch',
  description: 'Set global switch state for one key.',
  schema: {
    clientId,
    key: globalSwitchKeySchema,
    switch: z.boolean().describe('Switch value (true/false).'),
  },
  annotations: {
    readOnlyHint: false,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    await connector.setGlobalSwitch(params.clientId, params.key, params.switch);

    response.appendLines(
      JSON.stringify({ key: params.key, value: params.switch }),
    );
  },
});
