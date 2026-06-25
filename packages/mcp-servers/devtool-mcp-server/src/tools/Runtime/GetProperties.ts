// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from 'zod';
import { clientId, sessionId, thread } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const GetProperties = /*#__PURE__*/ defineTool({
  name: 'Runtime_getProperties',
  description: 'Return properties for a Runtime remote object.',
  schema: {
    clientId,
    sessionId,
    thread,
    objectId: z
      .string()
      .describe(
        'Remote object id returned by Runtime.evaluate or console output.',
      ),
    ownProperties: z
      .boolean()
      .optional()
      .describe('Return only properties owned by the object.'),
    accessorPropertiesOnly: z
      .boolean()
      .optional()
      .describe('Return accessor properties only when supported.'),
    generatePreview: z
      .boolean()
      .optional()
      .describe('Whether to generate previews for property values.'),
    nonIndexedPropertiesOnly: z
      .boolean()
      .optional()
      .describe('Return non-indexed properties only when supported.'),
  },
  annotations: {
    readOnlyHint: true,
  },
  async handler({ params }, response, context) {
    const connector = context.connector();
    const isMainThread = params.thread === 'main';

    await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Runtime.enable',
      {},
      isMainThread,
    );

    const getPropertiesParams = Object.fromEntries(
      [
        ['objectId', params.objectId],
        ['ownProperties', params.ownProperties],
        ['accessorPropertiesOnly', params.accessorPropertiesOnly],
        ['generatePreview', params.generatePreview],
        ['nonIndexedPropertiesOnly', params.nonIndexedPropertiesOnly],
      ].filter(([, value]) => value !== undefined),
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Runtime.getProperties',
      getPropertiesParams,
      isMainThread,
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
