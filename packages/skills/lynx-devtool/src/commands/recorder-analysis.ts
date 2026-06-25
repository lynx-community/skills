// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import path from 'node:path';
import zlib from 'node:zlib';

export interface FileDiagnostic {
  file: string;
  fileSizeBytes: number;
  healthy: boolean;
  actions: number;
  hasTemplate: boolean;
  functionDistribution: Record<string, number>;
  verdict: string;
}

interface Action {
  'Function Name': string;
  'Record Time'?: string;
  Params?: Record<string, unknown>;
}

type RecordingData = Action[] | { 'Action List'?: Action[] };

export function analyzeRecordingBuffer(
  filePath: string,
  buffer: Buffer,
): FileDiagnostic {
  const fileSizeBytes = buffer.byteLength;
  let recording: RecordingData;
  let parseFailed = false;

  try {
    const raw = buffer.toString('utf-8').trim();
    if (raw.startsWith('{') || raw.startsWith('[')) {
      recording = JSON.parse(raw);
    } else {
      const decoded = Buffer.from(raw, 'base64');
      const inflated = zlib.inflateSync(decoded);
      recording = JSON.parse(inflated.toString('utf-8'));
    }
  } catch {
    parseFailed = true;
    recording = {};
  }

  if (parseFailed) {
    return {
      file: filePath,
      fileSizeBytes,
      healthy: false,
      actions: 0,
      hasTemplate: false,
      functionDistribution: {},
      verdict: 'Cannot parse — file is not a valid TestBench recording',
    };
  }

  const actions = Array.isArray(recording)
    ? recording
    : (recording['Action List'] ?? []);

  const functionDistribution: Record<string, number> = {};
  for (const action of actions) {
    const fn = action['Function Name'];
    functionDistribution[fn] = (functionDistribution[fn] ?? 0) + 1;
  }

  const hasTemplate = actions.some(
    (a) => a['Function Name'] === 'loadTemplate',
  );
  const hasTouchEvents = actions.some(
    (a) =>
      a['Function Name'] === 'SendTouchEvent' ||
      a['Function Name'] === 'sendEventDarwin',
  );

  let healthy: boolean;
  let verdict: string;

  if (actions.length === 0) {
    healthy = false;
    verdict = 'Empty recording — no actions captured';
  } else if (hasTemplate) {
    healthy = true;
    verdict = 'Valid recording — includes template load and interaction data';
  } else if (hasTouchEvents) {
    healthy = true;
    verdict =
      'Recording captures touch events but no template load — still useful for analyzing interactions, but cannot be replayed in Lynx Explorer';
  } else {
    healthy = true;
    verdict =
      'Recording has actions but no template load — useful for inspecting JSB calls or data updates, but cannot be replayed';
  }

  return {
    file: filePath,
    fileSizeBytes,
    healthy,
    actions: actions.length,
    hasTemplate,
    functionDistribution,
    verdict,
  };
}

export function recordingOutputPath(
  basePath: string,
  sessionId: number,
  index: number,
): string {
  const suffix =
    sessionId > 0 ? `-session${sessionId}` : index > 0 ? `-${index}` : '';
  if (!suffix) return basePath;
  const parsed = path.parse(basePath);
  return path.join(
    parsed.dir,
    `${parsed.name}${suffix}${parsed.ext || '.json'}`,
  );
}
