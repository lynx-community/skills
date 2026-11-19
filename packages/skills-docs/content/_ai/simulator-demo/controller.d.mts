// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type scenario from './scenario.json';

export function initialize(
  container: HTMLElement,
  config: typeof scenario,
  locale: 'en' | 'zh',
): () => void;
