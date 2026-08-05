// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Shared constants for user-facing CLI text.
 */

/**
 * Placeholder used in user-facing hints in place of a hardcoded executable
 * name. The CLI is not guaranteed to be invoked as a stable `agent-lynx`
 * binary (it may be run via `node .../index.ts`, a wrapper, etc.), so we show a
 * neutral placeholder and let the human/agent substitute their own invocation.
 */
export const CLI_PLACEHOLDER = 'agent-lynx';
