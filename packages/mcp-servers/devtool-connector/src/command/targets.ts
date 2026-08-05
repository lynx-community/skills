// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Connector } from '../index.ts';
import type { CommandObject } from './contract.ts';
import { type CommandResult, fail } from './result.ts';

function stringParam(params: CommandObject, key: string): string | undefined {
  const value = params[key];
  return typeof value === 'string' && value.trim() !== ''
    ? value.trim()
    : undefined;
}

function numberParam(params: CommandObject, key: string): number | undefined {
  const value = params[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function isHeadlessClientId(clientId: string): boolean {
  return clientId.startsWith('headless:');
}

function targetFailure(
  action: string,
  message: string,
  nextActions: string[],
): CommandResult<never> {
  return fail(action, message, {
    reason: 'target-not-found',
    recoverable: true,
    nextActions,
  });
}

export type ResolvedSessionTarget =
  | {
      ok: true;
      params: CommandObject & { clientId: string; sessionId: number };
    }
  | { ok: false; result: CommandResult<never> };

/** Resolve optional client/session fields once inside the daemon. */
export async function resolveSessionTarget(
  action: string,
  params: CommandObject,
  connector: Connector,
): Promise<ResolvedSessionTarget> {
  let clientId = stringParam(params, 'clientId');
  if (params['clientId'] !== undefined && !clientId) {
    return {
      ok: false,
      result: fail(
        action,
        'clientId must be a non-empty string when provided.',
        { reason: 'bad-params' },
      ),
    };
  }
  if (!clientId) {
    const clients = await connector.listClients();
    const firstClient = clients.find(
      (client) => !isHeadlessClientId(client.id),
    );
    if (!firstClient) {
      const headlessAvailable = clients.some((client) =>
        isHeadlessClientId(client.id),
      );
      return {
        ok: false,
        result: targetFailure(
          action,
          headlessAvailable
            ? 'No real-device clients found. The built-in headless runtime is available but is never auto-selected.'
            : 'No available clients found.',
          headlessAvailable
            ? [
                'Retry with an explicit headless client, for example `--client headless:0`.',
              ]
            : [
                'Connect a Lynx client, then retry the command.',
                'Run `agent-lynx list-clients` to verify discovery.',
              ],
        ),
      };
    }
    clientId = firstClient.id;
  }

  let sessionId = numberParam(params, 'sessionId');
  if (params['sessionId'] !== undefined && sessionId === undefined) {
    return {
      ok: false,
      result: fail(action, 'sessionId must be a finite number when provided.', {
        reason: 'bad-params',
      }),
    };
  }
  if (sessionId === undefined) {
    const sessions = await connector.sendListSessionMessage(clientId);
    if (sessions.length === 0) {
      return {
        ok: false,
        result: targetFailure(
          action,
          isHeadlessClientId(clientId)
            ? `No sessions found for headless client ${clientId}. The headless runtime has no page open yet.`
            : `No available sessions found for client: ${clientId}`,
          isHeadlessClientId(clientId)
            ? [
                `Open a page first with \`agent-lynx open --client ${clientId} <url>\`.`,
              ]
            : [
                `Open or reload a Lynx page on ${clientId}.`,
                `Run \`agent-lynx list-sessions --client ${clientId}\`.`,
              ],
        ),
      };
    }
    const latest = sessions.reduce((max, session) =>
      session.session_id > max.session_id ? session : max,
    );
    sessionId = latest.session_id;
  }

  return { ok: true, params: { ...params, clientId, sessionId } };
}
