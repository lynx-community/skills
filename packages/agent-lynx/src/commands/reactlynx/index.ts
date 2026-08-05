// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import type { Context } from '../utils.ts';
import { registerFindCommand } from './find.ts';
import { registerComponentCommand } from './inspect.ts';
import { registerLinkCommand } from './link.ts';
import { registerTreeCommand } from './tree.ts';
import { registerUpdateCommands } from './update.ts';

export function registerReactLynxCommand(
  program: Command,
  context: Context,
): void {
  const reactlynx = program
    .command('reactlynx')
    .description(
      'Inspect ReactLynx components and link them with DOM Snapshot @eN refs',
    );

  registerTreeCommand(reactlynx, context);
  registerComponentCommand(reactlynx, context);
  registerFindCommand(reactlynx, context);
  registerLinkCommand(reactlynx, context);
  registerUpdateCommands(reactlynx, context);
}
