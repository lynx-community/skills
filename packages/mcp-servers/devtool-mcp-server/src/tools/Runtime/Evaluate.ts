// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from 'zod';
import { clientId, sessionId, thread } from '../../schema/index.ts';
import { defineTool } from '../defineTool.ts';

export const Evaluate = /*#__PURE__*/ defineTool({
  name: 'Runtime_evaluate',
  description: 'Evaluate a JavaScript expression in the selected Lynx VM.',
  schema: {
    clientId,
    sessionId,
    thread,
    expression: z.string().describe('JavaScript expression to evaluate.'),
    silent: z
      .boolean()
      .optional()
      .describe('Do not report or pause on exceptions during evaluation.'),
    contextId: z
      .number()
      .int()
      .optional()
      .describe('Execution context id to evaluate in.'),
    throwOnSideEffect: z
      .boolean()
      .optional()
      .describe('Throw if side effects cannot be ruled out.'),
    generatePreview: z
      .boolean()
      .optional()
      .describe('Whether to generate a preview for the result.'),
    objectGroup: z
      .string()
      .optional()
      .describe('Symbolic group name for released remote objects.'),
    returnByValue: z
      .boolean()
      .optional()
      .describe('Return the result by value when supported by the engine.'),
    awaitPromise: z
      .boolean()
      .optional()
      .describe('Await the resulting promise when supported by the engine.'),
    includeCommandLineAPI: z
      .boolean()
      .optional()
      .describe('Expose command line API during evaluation when supported.'),
  },
  annotations: {
    readOnlyHint: false,
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

    const evaluateParams = Object.fromEntries(
      [
        ['expression', params.expression],
        ['silent', params.silent],
        ['contextId', params.contextId],
        ['throwOnSideEffect', params.throwOnSideEffect],
        ['generatePreview', params.generatePreview],
        ['objectGroup', params.objectGroup],
        ['returnByValue', params.returnByValue],
        ['awaitPromise', params.awaitPromise],
        ['includeCommandLineAPI', params.includeCommandLineAPI],
      ].filter(([, value]) => value !== undefined),
    );

    const result = await connector.sendCDPMessage(
      params.clientId,
      params.sessionId,
      'Runtime.evaluate',
      evaluateParams,
      isMainThread,
    );

    response.appendLines(JSON.stringify(result, null, 2));
  },
});
