// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import type { Connector } from '@lynx-js/devtool-connector';
import type { Command } from 'commander';
import { evaluateExpression } from '../evaluate-expression.ts';
import {
  CLIENT_OPTION,
  type Context,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

const CONTENT_SCREENSHOT_TIMEOUT_MS = 30_000;
const CONTENT_SCREENSHOT_POLL_INTERVAL_MS = 100;

type ContentScreenshotFormat = 'jpeg' | 'png';

export type ContentScreenshotResult = {
  data: string;
  width: number;
  height: number;
};

type ContentScreenshotState =
  | { status: 'pending' }
  | { status: 'success'; data: ContentScreenshotResult }
  | { status: 'error'; error?: unknown }
  | { status: 'missing' };

const UI_METHOD_ERROR_DESCRIPTIONS: Record<
  number,
  { name: string; message: string }
> = {
  1: {
    name: 'UNKNOWN',
    message: 'The runtime could not complete the content screenshot.',
  },
  2: {
    name: 'NODE_NOT_FOUND',
    message:
      'No node matched the selector. Check that the page is loaded and the selector is correct.',
  },
  3: {
    name: 'METHOD_NOT_FOUND',
    message:
      'The matched node does not support takeContentScreenshot. Use a selector that targets a <scroll-view>.',
  },
  4: {
    name: 'PARAM_INVALID',
    message:
      'The screenshot parameters are invalid. Use format jpeg or png and a positive scale.',
  },
  5: {
    name: 'SELECTOR_NOT_SUPPORTED',
    message:
      'The runtime does not support this selector for UI Method invocation.',
  },
  6: {
    name: 'NO_UI_FOR_NODE',
    message:
      'The matched node has no available native UI view. Ensure the <scroll-view> is mounted and has a non-zero size.',
  },
  7: {
    name: 'INVALID_STATE_ERROR',
    message:
      'The matched <scroll-view> is not in a valid state for a content screenshot.',
  },
  8: {
    name: 'OPERATION_ERROR',
    message:
      'The runtime could not capture the full content. Reduce --scale or the content size and retry.',
  },
};

type RuntimeEvaluateResponse = {
  result?: {
    type?: string;
    subtype?: string;
    value?: unknown;
    description?: string;
  };
  exceptionDetails?: {
    text?: string;
    exception?: { description?: string };
  };
};

export type ContentScreenshotOptions = {
  format: ContentScreenshotFormat;
  scale: number;
  timeoutMs?: number;
  pollIntervalMs?: number;
  waitForPoll?: (ms: number) => Promise<void>;
  stateKey?: string;
};

function createContentScreenshotExpression(
  stateKey: string,
  selector: string,
  format: ContentScreenshotFormat,
  scale: number,
): string {
  return `(function(){
    var __key=${JSON.stringify(stateKey)};
    globalThis[__key]={status:"pending"};
    try {
      var __usesSelectorQuery=lynx&&typeof lynx.createSelectorQuery==="function";
      var __createSelector=lynx&&(lynx.createSelectorQuery||lynx.createSelector);
      if(typeof __createSelector!=="function"){
        throw new Error("lynx.createSelectorQuery is unavailable");
      }
      var __query=__createSelector.call(lynx);
      var __task=__query.select(${JSON.stringify(selector)}).invoke({
        method:"takeContentScreenshot",
        params:{format:${JSON.stringify(format)},scale:${scale}},
        success:function(__data){if(globalThis[__key]){globalThis[__key]={status:"success",data:__data};}},
        fail:function(__error){if(globalThis[__key]){globalThis[__key]={status:"error",error:__error};}}
      });
      if(__task&&typeof __task.exec==="function"){
        __task.exec();
      } else if(__usesSelectorQuery) {
        throw new Error("lynx selector query did not return an executable task");
      }
    } catch(__error) {
      globalThis[__key]={
        status:"error",
        error:{message:__error&&__error.message?__error.message:String(__error)}
      };
    }
    return JSON.stringify(globalThis[__key]);
  })()`;
}

function createReadStateExpression(stateKey: string): string {
  return `JSON.stringify(globalThis[${JSON.stringify(stateKey)}]||{status:"missing"})`;
}

function createDeleteStateExpression(stateKey: string): string {
  return `delete globalThis[${JSON.stringify(stateKey)}]`;
}

function runtimeEvaluationError(
  response: RuntimeEvaluateResponse,
): string | undefined {
  if (response.exceptionDetails) {
    return (
      response.exceptionDetails.exception?.description ??
      response.exceptionDetails.text ??
      JSON.stringify(response.exceptionDetails)
    );
  }
  if (response.result?.subtype === 'error') {
    return (
      response.result.description ??
      String(response.result.value ?? 'Runtime evaluation failed')
    );
  }
  return undefined;
}

function parseContentScreenshotState(
  response: RuntimeEvaluateResponse,
): ContentScreenshotState {
  const evaluationError = runtimeEvaluationError(response);
  if (evaluationError) {
    throw new Error(`Runtime.evaluate failed: ${evaluationError}`);
  }

  const value = response.result?.value;
  if (typeof value !== 'string') {
    throw new Error(
      `Runtime.evaluate returned an unexpected result: ${JSON.stringify(response)}`,
    );
  }

  try {
    const state = JSON.parse(value) as Partial<ContentScreenshotState>;
    if (
      !state ||
      typeof state !== 'object' ||
      !['pending', 'success', 'error', 'missing'].includes(state.status ?? '')
    ) {
      throw new Error('unknown screenshot state');
    }
    return state as ContentScreenshotState;
  } catch (error) {
    throw new Error(
      `Runtime.evaluate returned invalid screenshot state: ${value}`,
      { cause: error },
    );
  }
}

function describeContentScreenshotError(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const detail = record['message'] ?? record['data'];
    const code = record['code'];
    const description =
      typeof code === 'number' ? UI_METHOD_ERROR_DESCRIPTIONS[code] : undefined;
    if (description) {
      const runtimeDetail =
        detail === undefined ? '' : ` Runtime detail: ${String(detail)}`;
      return `[code ${code} ${description.name}] ${description.message}${runtimeDetail}`;
    }
    if (detail !== undefined) {
      return `${code === undefined ? '' : `[code ${String(code)}] `}${String(detail)}`;
    }
  }
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

function validateContentScreenshotResult(
  data: ContentScreenshotResult,
): ContentScreenshotResult {
  if (
    !data ||
    typeof data !== 'object' ||
    typeof data.data !== 'string' ||
    !Number.isFinite(data.width) ||
    data.width <= 0 ||
    !Number.isFinite(data.height) ||
    data.height <= 0
  ) {
    throw new Error(
      `takeContentScreenshot returned an invalid payload: ${JSON.stringify(data)}`,
    );
  }
  return data;
}

async function evaluateRuntime(
  connector: Connector,
  clientId: string,
  sessionId: number,
  expression: string,
): Promise<RuntimeEvaluateResponse> {
  return await evaluateExpression<RuntimeEvaluateResponse>(
    connector,
    clientId,
    sessionId,
    expression,
    { thread: 'background' },
  );
}

function resolveCompletedState(
  state: ContentScreenshotState,
  selector: string,
): ContentScreenshotResult | undefined {
  if (state.status === 'success')
    return validateContentScreenshotResult(state.data);
  if (state.status === 'error') {
    throw new Error(
      `takeContentScreenshot failed for selector ${JSON.stringify(selector)}: ${describeContentScreenshotError(
        state.error,
      )}`,
    );
  }
  if (state.status === 'missing') {
    throw new Error(
      'Content screenshot state disappeared before the UI method completed. The page may have reloaded.',
    );
  }
  return undefined;
}

export async function takeContentScreenshot(
  connector: Connector,
  clientId: string,
  sessionId: number,
  selector: string,
  options: ContentScreenshotOptions,
): Promise<ContentScreenshotResult> {
  const timeoutMs = options.timeoutMs ?? CONTENT_SCREENSHOT_TIMEOUT_MS;
  const pollIntervalMs =
    options.pollIntervalMs ?? CONTENT_SCREENSHOT_POLL_INTERVAL_MS;
  const waitForPoll = options.waitForPoll ?? delay;
  const stateKey =
    options.stateKey ??
    `__lynxDevtoolContentScreenshot_${randomUUID().replaceAll('-', '')}`;
  const deadline = Date.now() + timeoutMs;

  try {
    const initialState = parseContentScreenshotState(
      await evaluateRuntime(
        connector,
        clientId,
        sessionId,
        createContentScreenshotExpression(
          stateKey,
          selector,
          options.format,
          options.scale,
        ),
      ),
    );
    const initialResult = resolveCompletedState(initialState, selector);
    if (initialResult) return initialResult;

    while (Date.now() < deadline) {
      await waitForPoll(
        Math.min(pollIntervalMs, Math.max(0, deadline - Date.now())),
      );
      const state = parseContentScreenshotState(
        await evaluateRuntime(
          connector,
          clientId,
          sessionId,
          createReadStateExpression(stateKey),
        ),
      );
      const result = resolveCompletedState(state, selector);
      if (result) return result;
    }

    throw new Error(
      `Timed out waiting for takeContentScreenshot on selector ${JSON.stringify(selector)} after ${timeoutMs}ms.`,
    );
  } finally {
    await evaluateRuntime(
      connector,
      clientId,
      sessionId,
      createDeleteStateExpression(stateKey),
    ).catch(() => {});
  }
}

function parseContentScreenshotFormat(
  input: string | undefined,
): ContentScreenshotFormat {
  const format = input?.toLowerCase() ?? 'jpeg';
  if (format !== 'jpeg' && format !== 'png') {
    throw new Error(`Invalid --format value: ${input}. Use jpeg or png.`);
  }
  return format;
}

function parseContentScreenshotScale(input: string | undefined): number {
  const scale = input === undefined ? 1 : Number(input);
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`Invalid --scale value: ${input}. Use a positive number.`);
  }
  return scale;
}

function decodeContentScreenshotDataUrl(dataUrl: string): {
  bytes: Buffer;
  format: ContentScreenshotFormat;
} {
  const match = /^data:image\/(jpeg|png);base64,(.+)$/s.exec(dataUrl);
  if (!match?.[1] || !match[2]) {
    throw new Error(
      'takeContentScreenshot returned an invalid image data URL.',
    );
  }
  return {
    bytes: Buffer.from(match[2], 'base64'),
    format: match[1] as ContentScreenshotFormat,
  };
}

export function registerTakeContentScreenshotCommand(
  program: Command,
  context: Context,
) {
  program
    .command('take-content-screenshot')
    .description('Capture the full content of a scroll container')
    .requiredOption(
      '--selector <selector>',
      'CSS selector for a scroll-view or compatible list',
    )
    .option(
      '--format <format>',
      'Screenshot format: jpeg or png (default: jpeg)',
    )
    .option('--scale <scale>', 'Positive output scale (default: 1)')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '-o, --output <path>',
      'Output file path (default: content-screenshot-<timestamp>.<format>)',
    )
    .action(async (options) => {
      if (!options.selector.trim()) {
        throw new Error('--selector must not be empty.');
      }

      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );
      const format = parseContentScreenshotFormat(options.format);
      const scale = parseContentScreenshotScale(options.scale);

      const result = await takeContentScreenshot(
        connector,
        clientId,
        Number(sessionId),
        options.selector,
        { format, scale },
      );
      const decoded = decodeContentScreenshotDataUrl(result.data);
      const fileName =
        options.output ?? `content-screenshot-${Date.now()}.${decoded.format}`;
      await fs.writeFile(fileName, decoded.bytes);

      console.log(
        `Content screenshot saved to ${fileName} (${result.width}x${result.height})`,
      );
    });
}
