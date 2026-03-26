// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Connector } from '@lynx-js/devtool-connector';
import type { Transport } from '@lynx-js/devtool-connector/transport';
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

export function createProgram(
  connector: Connector,
  transports: Transport[],
): Command {
  const program = new Command();

  program
    .name('devtool')
    .description('CLI to interact with Lynx DevTool Connector')
    .version(pkg.version)
    .hook('postAction', async () => {
      await Promise.allSettled(transports.map((t) => t.close()));
    });

  registerListClientsCommand(program, connector);
  registerListSessionsCommand(program, connector);
  registerCdpCommand(program, connector);
  registerAppCommand(program, connector);
  registerOpenCommand(program, connector);
  registerGetConsoleCommand(program, connector);
  registerGetSourcesCommand(program, connector);
  registerTakeScreenshotCommand(program, connector);

  return program;
}
