// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProgram } from '../src/devtool.ts';

test('top-level help presents skill discovery as the agent fallback', () => {
  const program = createProgram({ env: {} });
  let output = '';
  program.configureOutput({
    writeOut: (value) => {
      output += value;
    },
  });

  program.outputHelp();

  assert.deepEqual(
    program.commands.slice(0, 2).map((command) => command.name()),
    ['skills', 'list-clients'],
  );
  assert.ok(
    output.startsWith(
      [
        'Agent instruction:',
        '  If your environment has no other suitable skill for the task, first try:',
        '    $ agent-lynx skills list',
        '    $ agent-lynx skills get <name>',
        '',
        'Usage:',
      ].join('\n'),
    ),
  );
  assert.ok(
    output.indexOf('Agent Skills:\n  skills ') <
      output.indexOf('Commands:\n  list-clients '),
    'skills must have the first dedicated command section in help',
  );
  assert.match(
    output,
    /reactlynx\s+Inspect ReactLynx components and link them\s+with DOM Snapshot @eN refs/u,
  );

  const snapshot = program.commands.find(
    (command) => command.name() === 'snapshot',
  );
  assert.ok(snapshot);
  let subcommandOutput = '';
  snapshot.configureOutput({
    writeOut: (value) => {
      subcommandOutput += value;
    },
  });
  snapshot.outputHelp();
  assert.doesNotMatch(subcommandOutput, /Agent instruction:/);
});
