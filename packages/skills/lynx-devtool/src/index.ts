// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import "core-js/modules/es.promise.with-resolvers.js";
import { createProgram } from "./devtool.ts";

createProgram({ env: process.env })
  .parseAsync(process.argv)
  .catch(error => {
    throw error;
  });
