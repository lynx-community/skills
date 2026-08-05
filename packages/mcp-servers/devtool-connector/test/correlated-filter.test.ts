// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TestContext } from 'node:test';
import { describe, test } from 'node:test';
import {
  createCorrelatedFilter,
  isGetGlobalSwitchResponse,
  isListSessionResponse,
  type Response,
} from '../src/types.ts';

// Helper to build a ListSessionResponse (Customized event with type "SessionList")
function makeSessionListResponse(id?: number): Response {
  return {
    event: 'Customized',
    data: {
      type: 'SessionList',
      data: [],
      ...(id !== undefined ? { id } : {}),
    },
  } as Response;
}

// Helper to build a GetGlobalSwitchResponse
function makeGetGlobalSwitchResponse(id?: number): Response {
  return {
    event: 'Customized',
    data: {
      type: 'GetGlobalSwitch',
      client_id: 1,
      session_id: 1,
      message: 'true',
      ...(id !== undefined ? { id } : {}),
    },
  } as unknown as Response;
}

// Non-matching response (different Customized type)
function makeAppResponse(id?: number): Response {
  return {
    event: 'Customized',
    data: {
      type: 'App',
      message: '{}',
      ...(id !== undefined ? { id } : {}),
    },
  } as unknown as Response;
}

describe('createCorrelatedFilter', () => {
  const REQUEST_ID = 12345;

  describe('base filter rejection', () => {
    test('returns false when base filter rejects the response', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      // An App response should not pass isListSessionResponse
      const result = filter(makeAppResponse());

      t.assert.equal(result, false);
    });

    test('returns false when base filter rejects even if id matches', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      // Correct id but wrong type — base filter should reject first
      const result = filter(makeAppResponse(REQUEST_ID));

      t.assert.equal(result, false);
    });
  });

  describe('Rule 1: response has NO id field → accept (old SDK)', () => {
    test('accepts response without id field', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      const result = filter(makeSessionListResponse());

      t.assert.equal(result, true);
    });
  });

  describe('Rule 2: response id matches request id → accept', () => {
    test('accepts response with matching id', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      const result = filter(makeSessionListResponse(REQUEST_ID));

      t.assert.equal(result, true);
    });
  });

  describe('Rule 3: response id is -1 → reject (old client without id)', () => {
    test('rejects response with id -1', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      const result = filter(makeSessionListResponse(-1));

      t.assert.equal(result, false);
    });
  });

  describe('Rule 4: response id is a different positive number → reject', () => {
    test('rejects response with a different id', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      const result = filter(makeSessionListResponse(99999));

      t.assert.equal(result, false);
    });

    test('rejects response with id 0 (not our request)', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);

      const result = filter(makeSessionListResponse(0));

      t.assert.equal(result, false);
    });
  });

  describe('generic reusability with different base filters', () => {
    test('works with isGetGlobalSwitchResponse', (t: TestContext) => {
      const filter = createCorrelatedFilter(
        isGetGlobalSwitchResponse,
        REQUEST_ID,
      );

      // Matching id → accept
      t.assert.equal(filter(makeGetGlobalSwitchResponse(REQUEST_ID)), true);
      // No id → accept (old SDK)
      t.assert.equal(filter(makeGetGlobalSwitchResponse()), true);
      // Different id → reject
      t.assert.equal(filter(makeGetGlobalSwitchResponse(77777)), false);
      // Wrong base type → reject
      t.assert.equal(filter(makeSessionListResponse(REQUEST_ID)), false);
    });
  });

  describe('type narrowing', () => {
    test('narrows type correctly when filter returns true', (t: TestContext) => {
      const filter = createCorrelatedFilter(isListSessionResponse, REQUEST_ID);
      const response: Response = makeSessionListResponse(REQUEST_ID);

      if (filter(response)) {
        // TypeScript should narrow this to ListSessionResponse
        // Access .data.data (Session[]) to verify narrowing works at compile time
        t.assert.ok(Array.isArray(response.data.data));
      } else {
        t.assert.fail('expected filter to accept');
      }
    });
  });

  describe('edge cases', () => {
    test('different request ids produce independent filters', (t: TestContext) => {
      const filter1 = createCorrelatedFilter(isListSessionResponse, 11111);
      const filter2 = createCorrelatedFilter(isListSessionResponse, 22222);

      const response1 = makeSessionListResponse(11111);
      const response2 = makeSessionListResponse(22222);

      // Each filter only accepts its own id
      t.assert.equal(filter1(response1), true);
      t.assert.equal(filter1(response2), false);
      t.assert.equal(filter2(response1), false);
      t.assert.equal(filter2(response2), true);
    });

    test('handles boundary request id values', (t: TestContext) => {
      // Test with min value of randomInt range
      const filterMin = createCorrelatedFilter(isListSessionResponse, 10_000);
      t.assert.equal(filterMin(makeSessionListResponse(10_000)), true);
      t.assert.equal(filterMin(makeSessionListResponse(10_001)), false);

      // Test with max value of randomInt range
      const filterMax = createCorrelatedFilter(isListSessionResponse, 49_999);
      t.assert.equal(filterMax(makeSessionListResponse(49_999)), true);
      t.assert.equal(filterMax(makeSessionListResponse(50_000)), false);
    });
  });
});
