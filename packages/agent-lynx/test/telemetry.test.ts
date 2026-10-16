// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { Command } from 'commander';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getTelemetryCommandNames } from '../src/devtool.ts';

test('telemetry separates the top-level command from nested actions', () => {
  const program = new Command('agent-lynx');
  const snapshot = program.command('snapshot');
  const getText = program.command('get').command('text');
  const traceStart = program.command('trace').command('start');
  const recorderStart = program.command('recorder').command('start');

  assert.deepEqual(getTelemetryCommandNames(snapshot), {
    command: 'snapshot',
    subcommand: '',
  });
  assert.deepEqual(getTelemetryCommandNames(getText), {
    command: 'get',
    subcommand: 'text',
  });
  assert.deepEqual(getTelemetryCommandNames(traceStart), {
    command: 'trace',
    subcommand: 'start',
  });
  assert.deepEqual(getTelemetryCommandNames(recorderStart), {
    command: 'recorder',
    subcommand: 'start',
  });
});
