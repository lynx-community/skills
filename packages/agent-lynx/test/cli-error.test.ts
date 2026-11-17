// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { describe, test } from 'node:test';
import { promisify } from 'node:util';
import { handleCliError } from '../src/program.ts';

const execFileAsync = promisify(execFile);

describe('top-level CLI error formatting', () => {
  test('formats operational errors cleanly unless DEBUG is set', async () => {
    let cleanStderr = '';
    const prevCode = process.exitCode;
    try {
      process.exitCode = undefined;
      handleCliError(
        new Error('No available clients found.'),
        {},
        { write: chunk => void (cleanStderr += chunk) },
      );
      assert.equal(cleanStderr, 'Error: No available clients found.\n');
      assert.equal(process.exitCode, 1);

      let debugStderr = '';
      handleCliError(
        new Error('with stack'),
        { DEBUG: 'devtool-mcp-server:*' },
        { write: chunk => void (debugStderr += chunk) },
      );
      assert.match(debugStderr, /Error: with stack\n\s+at /u);
    } finally {
      process.exitCode = prevCode;
    }

    await assert.rejects(
      execFileAsync(
        process.execPath,
        [
          'src/index.ts',
          'cdp',
          '-m',
          'Page.reload',
          '{invalid-json}',
        ],
        {
          cwd: path.resolve(import.meta.dirname, '..'),
          env: {
            ...process.env,
            AGENT_LYNX_DISABLE_UPDATE_NOTICE: '1',
            DEBUG: '',
          },
        },
      ),
      (err: unknown) => {
        const failure = err as { code?: number; stderr?: string; };
        assert.equal(failure.code, 1);
        assert.match(failure.stderr ?? '', /^Error: /u);
        assert.doesNotMatch(
          failure.stderr ?? '',
          /node:internal\/modules\/run_main/u,
        );
        return true;
      },
    );
  });
});
