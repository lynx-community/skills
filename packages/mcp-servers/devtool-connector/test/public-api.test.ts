// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as connectorEntry from '../src/index.ts';
import { Connector } from '../src/index.ts';

test('Connector exposes openPage from the package main entry', () => {
  assert.equal(typeof Connector.prototype.openPage, 'function');
  assert.equal(Connector.prototype.openPage.length, 2);
});

test('the package main entry re-exports createCorrelatedFilter', () => {
  assert.equal(typeof connectorEntry.createCorrelatedFilter, 'function');
});

test('Connector keeps the published no-reply API', () => {
  // `sendMessageNoReply` is part of the released public surface, so it must
  // stay available for fire-and-forget messages such as `xdb_proxy_config`.
  assert.equal(typeof Connector.prototype.sendMessageNoReply, 'function');
});

test('Connector keeps the published headless preparation API', () => {
  assert.equal(typeof Connector.prototype.prepareHeadless, 'function');
  assert.equal(typeof Connector.prototype.waitForHeadlessReady, 'function');
});
