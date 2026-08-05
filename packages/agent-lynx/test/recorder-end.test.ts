// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { describe, test } from 'node:test';
import {
  analyzeRecordingBuffer,
  recordingOutputPath,
} from '../src/commands/recorder-analysis.ts';

describe('analyzeRecordingBuffer', () => {
  test('returns unhealthy for unparseable content', (t) => {
    const result = analyzeRecordingBuffer(
      '/tmp/bad.json',
      Buffer.from('not json'),
    );
    t.assert.equal(result.healthy, false);
    t.assert.equal(result.actions, 0);
    t.assert.match(result.verdict, /Cannot parse/);
  });

  test('returns unhealthy for empty action list', (t) => {
    const data = JSON.stringify({ 'Action List': [] });
    const result = analyzeRecordingBuffer('/tmp/empty.json', Buffer.from(data));
    t.assert.equal(result.healthy, false);
    t.assert.equal(result.actions, 0);
    t.assert.match(result.verdict, /Empty recording/);
  });

  test('returns healthy with loadTemplate', (t) => {
    const data = JSON.stringify([
      { 'Function Name': 'loadTemplate' },
      { 'Function Name': 'SendTouchEvent' },
    ]);
    const result = analyzeRecordingBuffer('/tmp/good.json', Buffer.from(data));
    t.assert.equal(result.healthy, true);
    t.assert.equal(result.hasTemplate, true);
    t.assert.equal(result.actions, 2);
  });

  test('returns healthy for touch events without loadTemplate', (t) => {
    const data = JSON.stringify([
      { 'Function Name': 'SendTouchEvent' },
      { 'Function Name': 'sendEventDarwin' },
    ]);
    const result = analyzeRecordingBuffer('/tmp/touch.json', Buffer.from(data));
    t.assert.equal(result.healthy, true);
    t.assert.equal(result.hasTemplate, false);
    t.assert.match(result.verdict, /cannot be replayed/);
  });

  test('returns healthy for actions without loadTemplate or touch', (t) => {
    const data = JSON.stringify([{ 'Function Name': 'callJSB' }]);
    const result = analyzeRecordingBuffer(
      '/tmp/partial.json',
      Buffer.from(data),
    );
    t.assert.equal(result.healthy, true);
    t.assert.equal(result.hasTemplate, false);
  });

  test('handles Action List object format', (t) => {
    const data = JSON.stringify({
      'Action List': [{ 'Function Name': 'loadTemplate' }],
    });
    const result = analyzeRecordingBuffer('/tmp/obj.json', Buffer.from(data));
    t.assert.equal(result.healthy, true);
    t.assert.equal(result.actions, 1);
  });

  test('tracks function distribution', (t) => {
    const data = JSON.stringify([
      { 'Function Name': 'loadTemplate' },
      { 'Function Name': 'SendTouchEvent' },
      { 'Function Name': 'SendTouchEvent' },
    ]);
    const result = analyzeRecordingBuffer('/tmp/dist.json', Buffer.from(data));
    t.assert.deepEqual(result.functionDistribution, {
      loadTemplate: 1,
      SendTouchEvent: 2,
    });
  });
});

describe('recordingOutputPath', () => {
  test('returns base path unchanged for first file with non-positive sessionId', (t) => {
    t.assert.equal(recordingOutputPath('/tmp/rec.json', 0, 0), '/tmp/rec.json');
    t.assert.equal(
      recordingOutputPath('/tmp/rec.json', -1, 0),
      '/tmp/rec.json',
    );
  });

  test('adds session suffix for positive sessionId', (t) => {
    t.assert.equal(
      recordingOutputPath('/tmp/rec.json', 1, 0),
      '/tmp/rec-session1.json',
    );
    t.assert.equal(
      recordingOutputPath('/tmp/rec.json', 42, 0),
      '/tmp/rec-session42.json',
    );
  });

  test('adds index suffix for non-positive sessionId when index > 0', (t) => {
    t.assert.equal(
      recordingOutputPath('/tmp/rec.json', 0, 1),
      '/tmp/rec-1.json',
    );
    t.assert.equal(
      recordingOutputPath('/tmp/rec.json', 0, 2),
      '/tmp/rec-2.json',
    );
  });

  test('preserves extension', (t) => {
    t.assert.equal(
      recordingOutputPath('/tmp/rec.recording', 3, 0),
      '/tmp/rec-session3.recording',
    );
  });

  test('adds .json when no extension', (t) => {
    t.assert.equal(
      recordingOutputPath('/tmp/rec', 1, 0),
      '/tmp/rec-session1.json',
    );
  });
});
