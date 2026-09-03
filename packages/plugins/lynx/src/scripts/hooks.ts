// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command } from 'commander';
import {
  createLynxStartupReminder,
  DEFAULT_LYNX_LLMS_URL,
} from '../startup-reminder.ts';

const program = new Command();

program
  .allowUnknownOption()
  .option('--hook <type>', 'The hook event type')
  .action(async (options) => {
    const hookEvent = options.hook;

    if (hookEvent === 'SessionStart') {
      const llmsUrl = process.env['LYNX_LLMS_URL'] ?? DEFAULT_LYNX_LLMS_URL;
      const output = {
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: createLynxStartupReminder({ llmsUrl }),
        },
      };

      console.log(JSON.stringify(output, null, 2));
    }
  });

await program.parseAsync(process.argv);
