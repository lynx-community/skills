// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { useDark } from '@rspress/core/runtime';
import { type CSSProperties, useEffect, useRef, useState } from 'react';

interface DemoFrameProps {
  src: string | ((theme: 'light' | 'dark') => string);
  title: string;
  height?: CSSProperties['height'];
}

/** The packaged illustrations share the site's origin, theme, and content width. */
export function DemoFrame({ src, title, height = 500 }: DemoFrameProps) {
  const isDark = useDark();
  const iframeSrc = typeof src === 'function'
    ? src(isDark ? 'dark' : 'light')
    : src;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [measured, setMeasured] = useState<{ src: string; height: number; }>();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      const body = iframe.contentDocument?.body;
      if (!body) return;
      const measure = () => {
        // Measure the document body instead of the current iframe viewport.
        const nextHeight = Math.ceil(body.getBoundingClientRect().height) + 2;
        if (nextHeight <= 2) return;
        setMeasured((previous) =>
          previous?.src === iframeSrc && previous.height === nextHeight
            ? previous
            : { src: iframeSrc, height: nextHeight }
        );
      };
      observer = new ResizeObserver(measure);
      observer.observe(body);
      measure();
    };
    iframe.addEventListener('load', observe);
    observe();
    return () => {
      iframe.removeEventListener('load', observe);
      observer?.disconnect();
    };
  }, [iframeSrc]);

  return (
    <div
      style={{
        overflow: 'hidden',
        height: measured?.src === iframeSrc ? measured.height : height,
        position: 'relative',
        borderRadius: '8px',
        border: '1px solid var(--semi-color-border, var(--rp-c-divider))',
        boxSizing: 'border-box',
      }}
    >
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title={title}
        sandbox='allow-scripts allow-same-origin'
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}
