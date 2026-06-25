// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from 'commander';
import {
  CLIENT_NAME_OPTION,
  CLIENT_OPTION,
  type Context,
  resolveClientAndSession,
  SESSION_OPTION,
} from '../utils.ts';
import { formatTree } from './format.ts';
import type { ID } from './protocol.ts';
import { type DevNodeType, typeTag } from './protocol.ts';
import {
  buildOutboundFrame,
  emptyTreeDiagnostic,
  type PreactEnvelope,
  runReactLynxSession,
} from './transport.ts';

interface ComponentOptions {
  client?: string;
  session?: string;
  json?: boolean;
  showShells?: boolean;
}

export interface InspectResult {
  id: ID;
  name: string;
  type: DevNodeType;
  key: string | null;
  props: unknown;
  state: unknown;
  hooks: unknown;
  context: unknown;
  signals: unknown;
  suspended?: boolean;
  canSuspend?: boolean;
  version?: string;
  __source?: { fileName: string; lineNumber: number; columnNumber: number };
}

export function parseComponentRef(
  ref: string,
): { kind: 'label'; index: number } | { kind: 'id'; id: ID } {
  const labelMatch = /^@c(\d+)$/.exec(ref);
  if (labelMatch) {
    const index = Number.parseInt(labelMatch[1]!, 10);
    if (!Number.isFinite(index) || index < 1) {
      throw new Error(`Invalid label ${ref}; expected @c1, @c2, ...`);
    }
    return { kind: 'label', index };
  }
  const numeric = Number.parseInt(ref, 10);
  if (!Number.isFinite(numeric) || String(numeric) !== ref.trim()) {
    throw new Error(
      `Invalid <ref> ${JSON.stringify(ref)}; expected @cN or a numeric id.`,
    );
  }
  return { kind: 'id', id: numeric };
}

export function formatInspectResult(data: InspectResult, ref: string): string {
  const lines: string[] = [];
  const headerKey = data.key ? ` key=${data.key}` : '';
  lines.push(
    `${ref} (id=${data.id}) [${typeTag(data.type)}] ${data.name}${headerKey}`,
  );
  if (data.__source) {
    lines.push(
      `  source: ${data.__source.fileName}:${data.__source.lineNumber}:${data.__source.columnNumber}`,
    );
  }
  if (data.suspended !== undefined && data.suspended)
    lines.push('  suspended: true');

  appendSection(lines, 'props', data.props);
  appendSection(lines, 'state', data.state);
  appendSection(lines, 'hooks', data.hooks);
  appendSection(lines, 'context', data.context);
  appendSection(lines, 'signals', data.signals);

  return lines.join('\n');
}

function appendSection(lines: string[], label: string, value: unknown): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value) && value.length === 0) return;
  if (
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return;
  }
  lines.push(`  ${label}:`);
  const rendered = JSON.stringify(value, null, 2)
    .split('\n')
    .map((l) => `    ${l}`)
    .join('\n');
  lines.push(rendered);
}

export function registerComponentCommand(
  reactlynx: Command,
  context: Context,
): void {
  reactlynx
    .command('component <ref>')
    .description(
      'Inspect a single component (props/state/hooks/context). ' +
        '<ref> is either `@cN` (resolved against `reactlynx tree`) or a numeric id.',
    )
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option(
      '--show-shells',
      'When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers ' +
        'the same way `reactlynx tree --show-shells` does. Has no effect on numeric ids.',
      false,
    )
    .option('--json', 'Print the raw `InspectData` payload as JSON', false)
    .action(async (ref: string, options: ComponentOptions) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );

      let targetId: ID;
      const parsed = parseComponentRef(ref);

      if (parsed.kind === 'label') {
        const snapshot = await runReactLynxSession({
          connector,
          clientId,
          sessionId: Number(sessionId),
          outbound: [buildOutboundFrame('refresh')],
        });

        if (snapshot.state.tree.size === 0) {
          process.stderr.write(
            `[reactlynx component] ${emptyTreeDiagnostic(snapshot)}\n`,
          );
          process.exitCode = 1;
          return;
        }

        const labels = formatTree(snapshot.state, {
          hideShells: !options.showShells,
        }).labels;
        const resolved = labels[parsed.index - 1];
        if (resolved === undefined) {
          process.stderr.write(
            `[reactlynx component] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`,
          );
          process.exitCode = 1;
          return;
        }
        targetId = resolved;
      } else {
        targetId = parsed.id;
      }

      let inspectResult: InspectResult | undefined;
      const inspectSession = await runReactLynxSession({
        connector,
        clientId,
        sessionId: Number(sessionId),
        outbound: [buildOutboundFrame<ID>('inspect', targetId)],
        idleMs: 1_000,
        maxMs: 5_000,
        onEnvelope: (env: PreactEnvelope) => {
          if (
            env.type === 'inspect-result' &&
            env.data &&
            typeof env.data === 'object'
          ) {
            inspectResult = env.data as InspectResult;
            return 'stop';
          }
          return 'continue';
        },
      });

      if (!inspectResult) {
        const types =
          [...inspectSession.envelopeTypes].sort().join(',') || '(none)';
        process.stderr.write(
          `[reactlynx component] no \`inspect-result\` for id ${targetId} after ${inspectSession.framesSeen} frame(s) ` +
            `(types=${types}). Common causes:\n` +
            `  - the id is stale (the App has unmounted that component since the snapshot was taken)\n` +
            `  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`inspect\`\n` +
            `  - the targeted thread does not have a Preact renderer (e.g. you picked a non-ReactLynx session).\n` +
            `Rerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`,
        );
        process.exitCode = 1;
        return;
      }

      if (options.json) {
        process.stdout.write(JSON.stringify(inspectResult, null, 2) + '\n');
        return;
      }

      process.stdout.write(formatInspectResult(inspectResult, ref) + '\n');
    });
}
