// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import getReleasePlan from '@changesets/get-release-plan';

// Unlike CLI status, this validates every existing record without comparing a
// Git base branch or requiring release intent for synchronized source changes.
const plan = await getReleasePlan(process.cwd());
console.log(
  `Validated ${plan.changesets.length} changesets; ${plan.releases.length} pending package releases.`,
);
