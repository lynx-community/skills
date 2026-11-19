// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const zig = createRequire(import.meta.url).resolve("@zigc/cli/bin/zig");
// Resolve through the CLI's dependencies so this also works with pnpm's isolated layout.
const lib = dirname(createRequire(zig).resolve("@zigc/lib/package.json"));
const cwd = fileURLToPath(new URL("../../", import.meta.url));

// Zig includes the libc headers and linker stubs: all three targets build on Linux without an Apple SDK.
for (
  const [target, output] of [
    ["x86_64-linux-gnu.2.17", "bind-linux-x64.so"],
    ["x86_64-macos.11.0", "bind-darwin-x64.dylib"],
    ["aarch64-macos.11.0", "bind-darwin-arm64.dylib"],
  ]
) {
  execFileSync(process.execPath, [
    zig,
    "cc",
    "-target",
    target,
    "-shared",
    "-fPIC",
    "-Os",
    "-s",
    "-Wall",
    "-Wextra",
    "-Werror",
    "scripts/simulator/bind.c",
    "-o",
    `public/simulator/${output}`,
  ], { cwd, stdio: "inherit", env: { ...process.env, ZIG_LIB_DIR: lib } });
}
