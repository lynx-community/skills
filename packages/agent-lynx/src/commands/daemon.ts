// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  DaemonManager,
  DEFAULT_DAEMON_PORT,
} from '@lynx-js/devtool-connector/daemon';
import { Command } from 'commander';

export interface DaemonCommandLifecycle {
  ensureRunning(port: number): Promise<string>;
  stop(port: number): Promise<void>;
}

export interface RegisterDaemonCommandOptions {
  fetch?: typeof fetch;
  lifecycle?: DaemonCommandLifecycle;
  print?: (output: string) => void;
}

interface DaemonCommandOptions {
  port: number;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `Invalid --port value: ${value}. Use an integer from 1 to 65535.`,
    );
  }
  return port;
}

const DEFAULT_LIFECYCLE: DaemonCommandLifecycle = {
  ensureRunning: port => DaemonManager.ensureRunning(port),
  stop: port => DaemonManager.kill(port),
};

export function registerDaemonCommand(
  program: Command,
  options: RegisterDaemonCommandOptions = {},
): void {
  const lifecycle = options.lifecycle ?? DEFAULT_LIFECYCLE;
  const print = options.print ?? console.log;
  const fetchVersion = options.fetch ?? fetch;
  const daemon = program
    .command('daemon')
    .description('Start, stop, or inspect the shared local connector daemon');

  daemon
    .command('status')
    .description(
      'Read the running daemon version and protocol versions without starting it',
    )
    .option(
      '--port <port>',
      'Loopback daemon port',
      parsePort,
      DEFAULT_DAEMON_PORT,
    )
    .action(async ({ port }: DaemonCommandOptions) => {
      const response = await fetchVersion(
        `http://127.0.0.1:${port}/devtool/connector/version`,
      );
      print(JSON.stringify(await response.json(), null, 2));
    });

  daemon
    .command('start')
    .description('Ensure the shared local connector daemon is running')
    .option(
      '--port <port>',
      'Loopback daemon port',
      parsePort,
      DEFAULT_DAEMON_PORT,
    )
    .action(async ({ port }: DaemonCommandOptions) => {
      const url = await lifecycle.ensureRunning(port);
      print(JSON.stringify({ status: 'running', port, url }, null, 2));
    });

  daemon
    .command('stop')
    .description('Gracefully stop the shared local connector daemon')
    .option(
      '--port <port>',
      'Loopback daemon port',
      parsePort,
      DEFAULT_DAEMON_PORT,
    )
    .action(async ({ port }: DaemonCommandOptions) => {
      await lifecycle.stop(port);
      print(JSON.stringify({ status: 'stopped', port }, null, 2));
    });
}
