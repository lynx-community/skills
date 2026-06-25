// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from 'commander';
import {
  CLIENT_NAME_OPTION,
  CLIENT_OPTION,
  type Context,
  parseOnOff,
  resolveClient,
} from './utils.ts';

const GLOBAL_SWITCH_KEYS = [
  'enable_devtool',
  'enable_logbox',
  'enable_debug_mode',
  'enable_dom_tree',
  'enable_quickjs_debug',
  'enable_quickjs_cache',
  'enable_v8',
  'enable_cdp_domain_dom',
  'enable_cdp_domain_css',
  'enable_cdp_domain_page',
  'enable_long_press_menu',
  'enable_highlight_touch',
  'enable_preview_screen_shot',
  'enable_pixel_copy',
  'enable_fsp_screenshot',
] as const;

type GlobalSwitchKey = (typeof GLOBAL_SWITCH_KEYS)[number];
const GLOBAL_SWITCH_KEYS_HELP = GLOBAL_SWITCH_KEYS.join(' | ');

function parseKey(input: string): GlobalSwitchKey {
  if ((GLOBAL_SWITCH_KEYS as readonly string[]).includes(input)) {
    return input as GlobalSwitchKey;
  }

  throw new Error(
    `Invalid --key value: ${input}. Use global-switch list to inspect supported keys.`,
  );
}

export function registerGlobalSwitchCommand(
  program: Command,
  context: Context,
) {
  const globalSwitch = program
    .command('global-switch')
    .description('Manage DevTool global switches');

  globalSwitch
    .command('list')
    .description('List all global switch states')
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option('--fail-fast', 'Abort on first key-read failure')
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const switches: Array<{
        key: GlobalSwitchKey;
        value?: boolean;
        error?: string;
      }> = [];
      for (const key of GLOBAL_SWITCH_KEYS) {
        try {
          const value = await connector.getGlobalSwitch(clientId, key);
          switches.push({ key, value });
        } catch (error) {
          if (options.failFast) {
            throw error;
          }

          switches.push({
            key,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log(JSON.stringify({ switches }, null, 2));
    });

  globalSwitch
    .command('get')
    .description('Get one global switch state')
    .requiredOption(
      '--key <key>',
      `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`,
    )
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const key = parseKey(options.key);

      const value = await connector.getGlobalSwitch(clientId, key);

      console.log(JSON.stringify({ key, value }, null, 2));
    });

  globalSwitch
    .command('set')
    .description('Set one global switch state')
    .requiredOption(
      '--key <key>',
      `Global switch key. Supported: ${GLOBAL_SWITCH_KEYS_HELP}`,
    )
    .requiredOption('--status <status>', 'Switch status: on/off')
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const key = parseKey(options.key);
      const value = parseOnOff(options.status);

      await connector.setGlobalSwitch(clientId, key, value);

      console.log(JSON.stringify({ key, value }, null, 2));
    });
}
