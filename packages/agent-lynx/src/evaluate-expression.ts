// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '@lynx-js/devtool-connector';

export interface EvaluateOptions {
  thread?: string | undefined;
  silent?: boolean | undefined;
  contextId?: number | undefined;
  throwOnSideEffect?: boolean | undefined;
  generatePreview?: boolean | undefined;
  objectGroup?: string | undefined;
  returnByValue?: boolean | undefined;
  awaitPromise?: boolean | undefined;
  includeCommandLineAPI?: boolean | undefined;
}

export function wrapExpression(expression: string): string {
  return `(function(){var __a=globalThis.multiApps&&globalThis.multiApps[globalThis.currentDebugAppId||globalThis.currentAppId];var lynx=__a&&__a.lynx,nativeLynx=lynx&&lynx.getNativeLynx();return(${expression});})()`;
}

export async function evaluateExpression<Result = unknown>(
  connector: Connector,
  clientId: string,
  sessionId: number,
  expression: string,
  options: EvaluateOptions = {},
): Promise<Result> {
  const thread = options.thread ?? 'background';
  if (thread !== 'background' && thread !== 'main') {
    throw new Error(
      `Invalid thread: ${thread}. Expected 'background' or 'main'.`,
    );
  }
  if (options.contextId !== undefined && !Number.isInteger(options.contextId)) {
    throw new Error(
      `Invalid context ID: ${options.contextId}. Expected an integer.`,
    );
  }

  const params = Object.fromEntries(
    [
      [
        'expression',
        thread === 'background' ? wrapExpression(expression) : expression,
      ],
      ['silent', options.silent],
      ['contextId', options.contextId],
      ['throwOnSideEffect', options.throwOnSideEffect],
      ['generatePreview', options.generatePreview],
      ['objectGroup', options.objectGroup],
      ['returnByValue', options.returnByValue ?? true],
      ['awaitPromise', options.awaitPromise],
      ['includeCommandLineAPI', options.includeCommandLineAPI],
    ].filter(([, value]) => value !== undefined),
  );

  return await connector.sendCDPMessage<Result, Record<string, unknown>>(
    clientId,
    sessionId,
    'Runtime.evaluate',
    params,
    thread === 'main',
  );
}
