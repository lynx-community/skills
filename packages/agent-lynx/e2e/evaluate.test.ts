// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import type { TestContext } from 'node:test';
import {
  getTestingSession,
  testWithClient,
} from '@lynx-js/devtool-connector/test-with-client';
import { evaluateExpression } from '../src/commands/evaluate.ts';

interface RemoteObject {
  type?: string;
  value?: unknown;
  objectId?: string;
}

interface EvaluateResult {
  result?: RemoteObject;
  exceptionDetails?: unknown;
}

testWithClient('evaluate', async (suite, connector, client, target) => {
  const session = await getTestingSession(connector, client.id, target);

  await suite.test(
    'reads lynx.__globalProps from the evaluate scope',
    async (t: TestContext) => {
      const evaluated = await evaluateExpression<EvaluateResult>(
        connector,
        client.id,
        session.session_id,
        'JSON.stringify(lynx.__globalProps)',
      );

      t.assert.equal(
        evaluated.exceptionDetails,
        undefined,
        'Global props evaluation should not throw',
      );
      t.assert.equal(
        evaluated.result?.type,
        'string',
        'Serialized global props should be a string',
      );
      t.assert.equal(
        typeof evaluated.result?.value,
        'string',
        'Global props should have a serialized value',
      );
      const globalProps = JSON.parse(
        evaluated.result!.value as string,
      ) as unknown;
      t.assert.ok(
        typeof globalProps === 'object' &&
          globalProps !== null &&
          !Array.isArray(globalProps),
        'lynx.__globalProps should serialize to an object',
      );
    },
  );

  await suite.test(
    'keeps an object inspectable when returnByValue is false',
    async (t: TestContext) => {
      const evaluated = await evaluateExpression<EvaluateResult>(
        connector,
        client.id,
        session.session_id,
        "({ answer: 42, label: 'lynx-devtool-e2e' })",
        { returnByValue: false, objectGroup: 'lynx-devtool-e2e' },
      );

      const objectId = evaluated.result?.objectId;
      t.assert.equal(
        typeof objectId,
        'string',
        'Reference mode should return an objectId',
      );
      t.assert.equal(
        evaluated.result?.value,
        undefined,
        'Reference mode should not serialize the object value',
      );

      const properties = await connector.sendCDPMessage<
        {
          result?: Array<{ name: string; value?: { value?: unknown } }>;
        },
        { objectId: string; ownProperties: boolean }
      >(client.id, session.session_id, 'Runtime.getProperties', {
        objectId: objectId!,
        ownProperties: true,
      });
      const answer = properties.result?.find(({ name }) => name === 'answer');
      t.assert.equal(
        answer?.value?.value,
        42,
        'The referenced object should remain inspectable',
      );
    },
  );
});
