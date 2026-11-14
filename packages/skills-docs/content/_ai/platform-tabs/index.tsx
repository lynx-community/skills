// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { ReactNode } from 'react';
import { Children, isValidElement, useEffect, useState } from 'react';

import { BorderBeam } from './border-beam';
import styles from './platform-tabs.module.less';

interface PlatformTabProps {
  platform: 'ios' | 'android' | 'harmony' | 'simulator' | 'desktop';
  label: string;
  connection?: 'USB' | 'Sandbox' | 'Remote';
  children: ReactNode;
}

export function PlatformTab({ children }: PlatformTabProps) {
  return <>{children}</>;
}

export function PlatformTabs({
  children,
  lastRowSize,
}: {
  children: ReactNode;
  lastRowSize?: number;
}) {
  const tabs = Children.toArray(children).filter(
    isValidElement<PlatformTabProps>,
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    function readPlatform() {
      const value = Number(
        new URLSearchParams(window.location.search).get('platform'),
      );
      setActive(
        Number.isInteger(value) && value >= 0 && value < tabs.length
          ? value
          : 0,
      );
    }

    readPlatform();
    window.addEventListener('popstate', readPlatform);
    return () => window.removeEventListener('popstate', readPlatform);
  }, [tabs.length]);

  const cards = tabs.map((
    { props: { platform, label, connection } },
    index,
  ) => (
    <button
      key={tabKey(label, connection)}
      type='button'
      className={styles.card}
      aria-pressed={active === index}
      onClick={() => {
        setActive(index);
        const url = new URL(window.location.href);
        if (index === 0) url.searchParams.delete('platform');
        else url.searchParams.set('platform', String(index));
        window.history.replaceState(window.history.state, '', url);
      }}
    >
      {active === index && <BorderBeam />}
      <span
        aria-hidden='true'
        className={styles.icons}
        data-platform={platform}
      >
        <span />
        {platform === 'desktop' && <span />}
      </span>
      <span className={styles.label}>
        {label}
        {connection && (
          <span className={styles.connection}> ({connection})</span>
        )}
      </span>
    </button>
  ));

  return (
    <>
      <div className={styles.track}>
        {lastRowSize
          ? (
            <>
              <div className={styles.connectionRow}>
                {cards.slice(0, -lastRowSize)}
              </div>
              <div className={styles.connectionRow}>
                {cards.slice(-lastRowSize)}
              </div>
            </>
          )
          : <div className={styles.row}>{cards}</div>}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tabKey(tab.props.label, tab.props.connection)}
          hidden={active !== index}
        >
          {tab}
        </div>
      ))}
    </>
  );
}

function tabKey(
  label: string,
  connection: PlatformTabProps['connection'],
): string {
  return connection ? `${label} (${connection})` : label;
}
