// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type {
  CommandData,
  SnapshotRef,
} from '@lynx-js/devtool-connector/command';
import type { Command } from 'commander';
import { runSnapshotCommand } from './result.ts';
import {
  CLIENT_OPTION,
  type Context,
  getCommandClient,
  JSON_OPTION,
  SESSION_OPTION,
} from './utils.ts';

type SnapshotResult = CommandData<'snapshot'>;

function refFlagsBadge(ref: SnapshotRef): string {
  const badges: string[] = [];
  if (!ref.flags.visible)
    badges.push(ref.flags.offscreen ? 'offscreen' : 'hidden');
  if (ref.flags.scrollable) badges.push('scrollable');
  if (ref.flags.editable) badges.push('editable');
  if (ref.flags.disabled) badges.push('disabled');
  return badges.length > 0 ? ` {${badges.join(',')}}` : '';
}

function formatRef(ref: SnapshotRef): string {
  const text = ref.text ? ` "${ref.text}"` : '';
  return `${ref.ref} [${ref.tag}]${text} @(${ref.center.x},${ref.center.y})${refFlagsBadge(ref)}`;
}

export function renderSnapshotTree(refs: readonly SnapshotRef[]): string {
  if (refs.length === 0)
    return 'No interactive elements found in the current snapshot.';

  const refsByLabel = new Map(refs.map((ref) => [ref.ref, ref]));
  const childrenByParent = new Map<string, SnapshotRef[]>();
  const roots: SnapshotRef[] = [];
  for (const ref of refs) {
    if (
      ref.parentRef !== undefined &&
      ref.parentRef !== ref.ref &&
      refsByLabel.has(ref.parentRef)
    ) {
      const children = childrenByParent.get(ref.parentRef) ?? [];
      children.push(ref);
      childrenByParent.set(ref.parentRef, children);
    } else {
      roots.push(ref);
    }
  }

  const lines: string[] = [];
  const rendered = new Set<string>();
  const walk = (
    ref: SnapshotRef,
    prefix: string,
    isLast: boolean,
    isRoot: boolean,
  ): void => {
    if (rendered.has(ref.ref)) return;
    rendered.add(ref.ref);
    const connector = isRoot ? '' : isLast ? '└─ ' : '├─ ';
    lines.push(`${prefix}${connector}${formatRef(ref)}`);

    const children = childrenByParent.get(ref.ref) ?? [];
    const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
    children.forEach((child, index) => {
      walk(child, childPrefix, index === children.length - 1, false);
    });
  };

  roots.forEach((root, index) => {
    walk(root, '', index === roots.length - 1, true);
  });
  for (const ref of refs) {
    if (!rendered.has(ref.ref)) walk(ref, '', true, true);
  }
  return lines.join('\n');
}

export function registerSnapshotCommand(
  program: Command,
  context: Context,
): void {
  const command = program
    .command('snapshot')
    .description(
      'Capture a compact tree of interactive elements with stable refs (@e1, @e2, ...).',
    )
    .option(
      '--visible-only',
      'Only include elements that are visible in the viewport.',
    )
    .option(...CLIENT_OPTION)
    .option(...SESSION_OPTION)
    .option(...JSON_OPTION);

  command.action(
    async (options: {
      visibleOnly?: boolean;
      client?: string;
      session?: string;
      json?: boolean;
    }) => {
      await runSnapshotCommand<SnapshotResult>(
        'snapshot',
        command,
        options,
        () =>
          getCommandClient(context).execute('snapshot', {
            ...(options.client ? { clientId: options.client } : {}),
            ...(options.session ? { sessionId: Number(options.session) } : {}),
            visibleOnly: options.visibleOnly ?? false,
          }),
        (data) => renderSnapshotTree(data.refs),
      );
    },
  );
}
