// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
const path = require("node:path");

let registered = false;
let binding;

function setUp() {
  if (registered) return;
  // Supply a compiled addon with getExtensionConfig(); see extension-development.md.
  // Keep it alive after registering its native creator handles.
  binding ??= require(path.join(__dirname, "prebuilds", `${process.platform}-${process.arch}`, "host_elements.node"));
  const config = binding.getExtensionConfig();
  const { registerGlobalEnvModule } = process._linkedBinding("lynx_extension");
  registerGlobalEnvModule(config.name, config.creatorModuleFunc, config.isLazyCreate, config.opaque);
  registered = true;
}

module.exports = { setUp };
