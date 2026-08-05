// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { Command } from 'commander';
import { CLIENT_OPTION, type Context, resolveClient } from './utils.ts';

const DEBUG_MODE_KEY = 'enable_debug_mode';
const DEBUG_MODE_RESTART_MESSAGE =
  '`enable_debug_mode` has been enabled. Restart the app and run `recorder start` again.';

type RecordingStartResult =
  | { started: true; restartRequired: false; message: string }
  | { started: false; restartRequired: true; message: string };

export function registerStartCommand(parent: Command, context: Context) {
  parent
    .command('start')
    .description('Start TestBench recording')
    .option(...CLIENT_OPTION)
    .action(async (options) => {
      const { connector, clientId } = await resolveClient(context, options);

      const result = await runRecordingStart(connector, clientId);
      if (result.started) {
      }
      console.log(JSON.stringify({ success: result.started, ...result }));
    });
}

export async function runRecordingStart(
  connector: {
    getGlobalSwitch: ConnectorGlobalSwitch;
    setGlobalSwitch: ConnectorSetGlobalSwitch;
    sendCDPMessage: ConnectorCDPMessage;
  },
  clientId: string,
): Promise<RecordingStartResult> {
  const debugModeEnabled = await connector.getGlobalSwitch(
    clientId,
    DEBUG_MODE_KEY,
  );
  if (!debugModeEnabled) {
    await connector.setGlobalSwitch(clientId, DEBUG_MODE_KEY, true);

    const persisted = await connector.getGlobalSwitch(clientId, DEBUG_MODE_KEY);
    if (persisted) {
      return {
        started: false,
        restartRequired: true,
        message: DEBUG_MODE_RESTART_MESSAGE,
      };
    }
    // Platform did not persist the switch — proceed to Recording.start directly.
  }

  try {
    await connector.sendCDPMessage(clientId, -1, 'Recording.start', {});
  } catch (err) {
    if (!isRecordingStartNotImplementedError(err)) throw err;
    throw new Error(
      'Recording.start is not implemented even after `enable_debug_mode` is enabled. ' +
        'The app or engine may not include `ENABLE_TESTBENCH_RECORDER`, ' +
        'or it may not be a dev/recorder build.',
      { cause: err },
    );
  }

  return {
    started: true,
    restartRequired: false,
    message:
      'Recording started successfully. Open or reload a Lynx page before `recorder end`.',
  };
}

type ConnectorGlobalSwitch = (
  clientId: string,
  key: typeof DEBUG_MODE_KEY,
) => Promise<boolean>;
type ConnectorSetGlobalSwitch = (
  clientId: string,
  key: typeof DEBUG_MODE_KEY,
  value: boolean,
) => Promise<void>;
type ConnectorCDPMessage = (
  clientId: string,
  sessionId: number,
  method: string,
  params: object,
) => Promise<unknown>;

function isRecordingStartNotImplementedError(err: unknown): boolean {
  return (
    err instanceof Error &&
    err.message.includes('Not implemented') &&
    err.message.includes('Recording.start')
  );
}
