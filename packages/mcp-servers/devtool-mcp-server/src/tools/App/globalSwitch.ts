// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from 'zod';

export const GLOBAL_SWITCH_KEYS = [
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

export const globalSwitchKeySchema = z
  .enum(GLOBAL_SWITCH_KEYS)
  .describe(
    'Global switch key. Use `App_listGlobalSwitch` to inspect all keys.',
  );
