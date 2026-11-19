// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useDark } from '@rspress/core/runtime';
import { useEffect, useRef } from 'react';

import { initialize } from './controller.mjs';
import styles from './index.module.less';
import scenario from './scenario.json';
import { markup } from './template.ts';

/** Both distributions use this renderer; the internal overlay replaces the scenario. */
export function SimulatorDemo({ lang }: { lang: 'en' | 'zh'; }) {
  const isDark = useDark();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    // Restore the shared markup on locale changes and React's effect remounts.
    container.current.innerHTML = markup;
    return initialize(container.current, scenario, lang);
  }, [lang]);

  return (
    <div
      ref={container}
      className={styles['demo']}
      data-theme={isDark ? 'dark' : 'light'}
    />
  );
}
