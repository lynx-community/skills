// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Preact DevTools <-> ReactLynx wire probe.
 *
 * Listens on `Lynx.onVMEvent` for `event === "PreactDevtools"` and prints
 * every frame that the running ReactLynx App emits to the desktop HDT panel.
 * Optionally sends a frame back via `Lynx.sendVMEvent` so we can see the
 * full duplex channel.
 *
 * Background:
 * - `@lynx-js/preact-devtools` (see .reference-repos/preact-devtools/src/react-lynx/setup.ts)
 *   wraps Preact DevTools' `{source, type, data}` envelope and pushes it via
 *   `lynx.getDevtool().dispatchEvent({ type: "PreactDevtools", data: JSON.stringify(envelope) })`.
 * - On the wire the engine surfaces this to the connected DevTool client as
 *   the CDP event `Lynx.onVMEvent` with params `{ vmType, event, data }`.
 *   The reverse direction is the CDP method `Lynx.sendVMEvent` with the same
 *   shape (see .reference-repos/preact-devtools/ldt-plugin/src/setup.ts).
 *
 * Usage:
 *
 *   node --experimental-strip-types packages/agent-lynx/test/probes/preact-devtools-probe.ts \
 *     [--client <id>] [--session <id>] [--timeout <seconds>] [--send-init]
 *
 * Output:
 *   Each frame is printed as one JSON line on stdout, with the *decoded*
 *   Preact envelope (source/type/data) plus raw `Lynx.onVMEvent` params. Use
 *   `jq` to filter, e.g. `jq 'select(.envelope.type=="operation_v2")'`.
 */

import { ReadableStream } from 'node:stream/web';
import { parseArgs } from 'node:util';
import type { CDPRequestMessage } from '@lynx-js/devtool-connector';
import { Connector } from '@lynx-js/devtool-connector';
import { createDefaultTransports } from '../../src/connector.ts';

const PREACT_EVENT_NAME = 'PreactDevtools';

// Wire constants from .reference-repos/preact-devtools/src/constants.ts
// The App side `listenToDevtools()` (adapter/adapter/port.ts:14) only handles
// frames whose `source === "preact-devtools-to-client"`. Sending anything
// else (e.g. the panel's `preact-devtools-panel`) is silently ignored by the
// adapter, even though those frames *do* reach the renderer.
const SOURCE_DEVTOOLS_TO_CLIENT = 'preact-devtools-to-client';

interface PreactEnvelope {
  source: string;
  type: string;
  data: unknown;
}

interface LynxOnVMEventParams {
  vmType?: string;
  event?: string;
  data?: string;
}

const { values } = parseArgs({
  options: {
    client: { type: 'string' },
    session: { type: 'string' },
    timeout: { type: 'string', default: '0' },
    'send-init': { type: 'boolean', default: false },
    refresh: { type: 'boolean', default: false },
  },
  strict: false,
});

const TIMEOUT_MS =
  Number(values.timeout) > 0 ? Number(values.timeout) * 1000 : 0;
const SEND_INIT = Boolean(values['send-init']);
const SEND_REFRESH = Boolean(values.refresh);

async function pickClient(
  connector: Connector,
  hint?: string,
): Promise<string> {
  if (hint) return hint;
  const clients = await connector.listClients();
  const first = clients[0];
  if (!first) throw new Error('No connected clients found.');
  return first.id;
}

async function pickSession(
  connector: Connector,
  clientId: string,
  hint?: string,
): Promise<number> {
  if (hint) return Number(hint);
  const sessions = await connector.sendListSessionMessage(clientId);
  if (!sessions.length) throw new Error(`No sessions for client ${clientId}`);
  // Prefer the latest session, like the rest of the skill does.
  const latest = sessions.reduce((max, s) =>
    Number(s.session_id) > Number(max.session_id) ? s : max,
  );
  return Number(latest.session_id);
}

async function main() {
  const transports = createDefaultTransports();
  const connector = new Connector(transports);

  const clientId = await pickClient(
    connector,
    values.client as string | undefined,
  );
  const sessionId = await pickSession(
    connector,
    clientId,
    values.session as string | undefined,
  );

  process.stderr.write(
    `[probe] clientId=${clientId} sessionId=${sessionId} timeout=${TIMEOUT_MS || 'infinite'}ms\n`,
  );

  const ac = new AbortController();
  if (TIMEOUT_MS > 0) {
    setTimeout(() => ac.abort(new Error('probe timeout')), TIMEOUT_MS).unref();
  }
  process.once('SIGINT', () => ac.abort(new Error('SIGINT')));

  // Build an input stream that:
  //   1. (always) sits idle so the long-running CDP stream stays open and we
  //      keep receiving `Lynx.onVMEvent` events.
  //   2. (optional) emits one synthetic outbound `Lynx.sendVMEvent` so we can
  //      see whether the App side acknowledges arbitrary frames.
  const input = new ReadableStream<CDPRequestMessage>({
    async start(controller) {
      const send = (envelope: PreactEnvelope, label: string) => {
        controller.enqueue({
          method: 'Lynx.sendVMEvent',
          params: {
            vmType: 'JSContext',
            event: PREACT_EVENT_NAME,
            data: JSON.stringify(envelope),
          },
        });
        process.stderr.write(
          `[probe] sent ${label}: ${JSON.stringify(envelope)}\n`,
        );
      };

      if (SEND_INIT) {
        // Mirrors browser content-script init handshake. The App-side
        // `hook.ts` flips `status -> "connected"` only after it sees an
        // envelope with `source === DevtoolsToClient` and `type === "init"`.
        send(
          { source: SOURCE_DEVTOOLS_TO_CLIENT, type: 'init', data: null },
          'init',
        );
      }
      if (SEND_REFRESH) {
        // Browser content-script.ts:35 sends `refresh` to make the running
        // adapter re-emit `attach` + a fresh `operation_v2` for every root.
        // This is what we want to inspect the wire format end-to-end.
        send(
          { source: SOURCE_DEVTOOLS_TO_CLIENT, type: 'refresh', data: null },
          'refresh',
        );
      }
      // Keep the writable side open; close only when aborted.
      ac.signal.addEventListener('abort', () => {
        try {
          controller.close();
        } catch {}
      });
    },
  });

  await using stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    input,
    { signal: ac.signal },
  );

  let frames = 0;
  try {
    for await (const msg of stream) {
      // `msg` is whatever the device returned in CDP envelope form. We only
      // care about Lynx.onVMEvent frames whose event === "PreactDevtools".
      if (typeof msg !== 'object' || msg === null) continue;
      const method = (msg as { method?: string }).method;
      if (method !== 'Lynx.onVMEvent') continue;

      const params = (msg as { params?: LynxOnVMEventParams }).params ?? {};
      if (params.event !== PREACT_EVENT_NAME) continue;

      let envelope: PreactEnvelope | { __parseError: string; raw: unknown } = {
        __parseError: 'n/a',
        raw: params.data,
      };
      try {
        envelope = JSON.parse(params.data ?? 'null');
      } catch (err) {
        envelope = {
          __parseError: err instanceof Error ? err.message : String(err),
          raw: params.data,
        };
      }

      frames += 1;
      const out = {
        ts: new Date().toISOString(),
        frame: frames,
        vmType: params.vmType,
        envelope,
      };
      process.stdout.write(JSON.stringify(out) + '\n');
    }
  } catch (err) {
    if (!(err instanceof Error && err.name === 'AbortError')) {
      throw err;
    }
  }

  process.stderr.write(`[probe] finished, frames=${frames}\n`);
}

main().catch((err) => {
  process.stderr.write(
    `[probe] fatal: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`,
  );
  process.exit(1);
});
