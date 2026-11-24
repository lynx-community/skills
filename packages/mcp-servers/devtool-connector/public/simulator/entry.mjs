// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createExtensions } from "./extensions.mjs";

const directory = process.env.AGENT_LYNX_SIMULATOR_RUN;
const require = createRequire(path.join(process.env.AGENT_LYNX_SIMULATOR_ROOT, "package.json"));
const { createSimulatorRuntime, createPageEnvironmentManager } = await import(
  pathToFileURL(require.resolve(process.env.AGENT_LYNX_SIMULATOR_CORE)),
);
const { app } = require("lynxtron");
app.setPath("userData", directory);
app.on("window-all-closed", () => {});

const runtime = createSimulatorRuntime();
let environments;
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  environments?.dispose();
  void runtime.dispose().finally(() => app.quit());
};
process.stdin.on("end", stop).resume(); // EOF also handles a daemon killed without cleanup.
process.on("SIGTERM", stop).on("SIGINT", stop);
void app.whenReady().then(async () => {
  const packages = JSON.parse(process.env.AGENT_LYNX_SIMULATOR_PACKAGES ?? '{"jsb":[],"nativeExtensions":[]}');
  const { loadPackage } = await import(pathToFileURL(path.join(directory, "packages.mjs")).href);
  environments = await createExtensions({ loadPackage, runtime, createPageEnvironmentManager, packages });
  if (stopping) {
    environments.dispose();
    return;
  }
  await runtime.devTool.setDevToolEnabled(true);
  await runtime.devTool.setLogBoxEnabled(false);
  await runtime.devTool.setOpenCardCallback(url => {
    void (async () => {
      const query = url.startsWith("lynx-simulator:") ? new URL(url).searchParams : new URLSearchParams();
      const target = query.size ? query.get("url") : url;
      if (!target || target.startsWith("lynx-simulator:")) throw new Error("Lynx Simulator URL requires a page url.");
      const flag = query.get("windowless");
      if (flag !== null && flag !== "true" && flag !== "false") throw new Error("windowless must be true or false.");
      const windowless = flag === null ? process.platform === "linux" : flag === "true";
      if (process.platform === "linux" && !windowless) throw new Error("Linux requires windowless rendering.");
      const dpr = query.get("dpr");
      const backgroundColor = query.get("background-color");
      await environments.open({
        target,
        cwd: query.get("cwd") ?? process.cwd(),
        pageEnvironment: query.get("page-env") ?? undefined,
        window: {
          windowless,
          size: { width: Number(query.get("width") ?? 390), height: Number(query.get("height") ?? 844) },
          ...(windowless && dpr !== null ? { deviceScaleFactor: Number(dpr) } : {}),
          ...(backgroundColor !== null ? { backgroundColor } : {}),
        },
      });
    })().catch(console.error);
  });
  writeFileSync(path.join(directory, "ready"), "");
}).catch(error => {
  console.error(error);
  stop();
});
