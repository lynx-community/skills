// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import {
  type EvaluateOptions,
  evaluateExpression,
  wrapExpression,
} from '../evaluate-expression.ts';
import {
  CLIENT_OPTION,
  type Context,
  resolveClientAndSession,
  SESSION_OPTION,
} from './utils.ts';

export { evaluateExpression, type EvaluateOptions, wrapExpression };

interface EvaluateCommandOptions {
  client?: string;
  session?: string;
  thread: string;
  silent?: boolean;
  contextId?: string;
  throwOnSideEffect?: boolean;
  generatePreview?: boolean;
  objectGroup?: string;
  returnByValue?: boolean;
  awaitPromise?: boolean;
  includeCommandLineApi?: boolean;
}

export function registerEvaluateCommand(program: Command, context: Context) {
  program
    .command('evaluate')
    .description('Evaluate a JavaScript expression in the selected Lynx VM')
    .argument('<expression>', 'JavaScript expression to evaluate')
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--thread <thread>',
      'VM thread to target: background or main',
      'background',
    )
    .option(
      '--silent',
      'Do not report or pause on exceptions during evaluation',
    )
    .option('--context-id <id>', 'Execution context ID to evaluate in')
    .option(
      '--throw-on-side-effect',
      'Throw if side effects cannot be ruled out',
    )
    .option('--generate-preview', 'Generate a preview for the result')
    .option(
      '--object-group <name>',
      'Symbolic group name for released remote objects',
    )
    .option(
      '--return-by-value',
      'Return the result by value when supported by the engine',
      true,
    )
    .option(
      '--no-return-by-value',
      'Return a remote object reference for later inspection',
    )
    .option(
      '--await-promise',
      'Await the resulting promise when supported by the engine',
    )
    .option(
      '--include-command-line-api',
      'Expose the command line API when supported by the engine',
    )
    .action(async (expression: string, options: EvaluateCommandOptions) => {
      const contextId =
        options.contextId === undefined ? undefined : Number(options.contextId);
      if (contextId !== undefined && !Number.isInteger(contextId)) {
        throw new Error(
          `Invalid context ID: ${options.contextId}. Expected an integer.`,
        );
      }

      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );

      const result = await evaluateExpression(
        connector,
        clientId,
        Number(sessionId),
        expression,
        {
          thread: options.thread,
          silent: options.silent,
          contextId,
          throwOnSideEffect: options.throwOnSideEffect,
          generatePreview: options.generatePreview,
          objectGroup: options.objectGroup,
          returnByValue: options.returnByValue,
          awaitPromise: options.awaitPromise,
          includeCommandLineAPI: options.includeCommandLineApi,
        },
      );

      console.log(JSON.stringify(result, null, 2));
    });
}
