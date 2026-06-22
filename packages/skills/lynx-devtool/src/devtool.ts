// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from 'commander';
import pkg from '../package.json' with { type: 'json' };
import { registerAppCommand } from './commands/app.ts';
import { registerCdpCommand } from './commands/cdp.ts';
import { registerGetConsoleCommand } from './commands/get-console.ts';
import { registerGetSourcesCommand } from './commands/get-sources.ts';
import { registerListClientsCommand } from './commands/list-clients.ts';
import { registerListSessionsCommand } from './commands/list-sessions.ts';
import { registerOpenCommand } from './commands/open.ts';
import { registerTakeScreenshotCommand } from './commands/take-screenshot.ts';
import type { DevtoolClient } from './sdk.ts';

export function createProgram(client: DevtoolClient): Command {
  const program = new Command();

  program
    .name('devtool')
    .description('CLI to interact with Lynx DevTool Connector')
    .version(pkg.version);

  registerListClientsCommand(program, client);
  registerListSessionsCommand(program, client);
  registerCdpCommand(program, client);
  registerAppCommand(program, client);
  registerOpenCommand(program, client);
  registerGetConsoleCommand(program, client);
  registerGetSourcesCommand(program, client);
  registerTakeScreenshotCommand(program, client);

  return program;
}
