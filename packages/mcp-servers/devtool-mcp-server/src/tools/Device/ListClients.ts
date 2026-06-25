// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { defineTool } from '../defineTool.ts';

export const ListClients = /*#__PURE__*/ defineTool({
  name: 'Device_listClients',
  description:
    'List all connected clients. This tool may timeout if no clients are connected or just started.',
  schema: {},
  annotations: {
    readOnlyHint: true,
  },
  async handler(_, response, context) {
    const connector = context.connector();

    const clients = await connector.listClients();

    response.appendLines(JSON.stringify(clients, null, 2));
  },
});
