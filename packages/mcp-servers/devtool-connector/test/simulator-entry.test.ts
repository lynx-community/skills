// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const ENTRY_PATH = fileURLToPath(new URL("../public/simulator/entry.mjs", import.meta.url));

async function runSimulatorEntry(
  urls: string[],
  options: { platform?: NodeJS.Platform } = {},
): Promise<{ opened: Array<Record<string, unknown>>; stderr: string; exitCode: number | null }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "simulator-entry-test-"));
  try {
    const runDir = path.join(root, "run");
    const lynxtronDir = path.join(root, "node_modules", "lynxtron");
    const coreDir = path.join(root, "node_modules", "mock-simulator-core");
    await mkdir(runDir, { recursive: true });
    await mkdir(lynxtronDir, { recursive: true });
    await mkdir(coreDir, { recursive: true });

    await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "simulator-host", private: true }));
    await writeFile(path.join(runDir, "packages.mjs"), "export const loadPackage = async () => ({});\n");

    const preloadPath = path.join(root, "preload.mjs");
    await writeFile(
      preloadPath,
      options.platform
        ? `Object.defineProperty(process, "platform", { value: ${JSON.stringify(options.platform)} });\n`
        : "",
    );

    await writeFile(
      path.join(lynxtronDir, "package.json"),
      JSON.stringify({ name: "lynxtron", main: "index.cjs" }),
    );
    await writeFile(
      path.join(lynxtronDir, "index.cjs"),
      [
        "module.exports = {",
        "  app: {",
        "    setPath() {},",
        "    on() {},",
        "    whenReady: () => Promise.resolve(),",
        "    quit() { process.exit(0); },",
        "  },",
        "};",
        "",
      ].join("\n"),
    );

    await writeFile(
      path.join(coreDir, "package.json"),
      JSON.stringify({ name: "mock-simulator-core", type: "module", exports: "./index.mjs" }),
    );
    await writeFile(
      path.join(coreDir, "index.mjs"),
      [
        "import { appendFileSync } from \"node:fs\";",
        "import path from \"node:path\";",
        "",
        "const logFile = path.join(process.env.AGENT_LYNX_SIMULATOR_RUN, \"opened.jsonl\");",
        "",
        "export function createSimulatorRuntime() {",
        "  return {",
        "    addWindowEventListener: () => () => {},",
        "    getWindow: () => undefined,",
        "    dispose: async () => {},",
        "    devTool: {",
        "      setDevToolEnabled: async () => {},",
        "      setLogBoxEnabled: async () => {},",
        "      setOpenCardCallback: async callback => {",
        "        for (const url of JSON.parse(process.env.TEST_OPEN_CARD_URLS ?? \"[]\")) {",
        "          callback(url);",
        "        }",
        "      },",
        "    },",
        "  };",
        "}",
        "",
        "export function createPageEnvironmentManager() {",
        "  return {",
        "    dispose() {},",
        "    async open(request) {",
        "      appendFileSync(logFile, `${JSON.stringify(request)}\\n`);",
        "      return { id: 1, getInfo: () => ({}), close: async () => {} };",
        "    },",
        "  };",
        "}",
        "",
      ].join("\n"),
    );

    const env = {
      ...process.env,
      AGENT_LYNX_SIMULATOR_ROOT: root,
      AGENT_LYNX_SIMULATOR_RUN: runDir,
      AGENT_LYNX_SIMULATOR_CORE: "mock-simulator-core",
      TEST_OPEN_CARD_URLS: JSON.stringify(urls),
    };
    delete env["NODE_TEST_CONTEXT"];

    const child = spawn(
      process.execPath,
      ["--import", pathToFileURL(preloadPath).href, ENTRY_PATH],
      { stdio: ["pipe", "ignore", "pipe"], env },
    );
    const exited = new Promise<number | null>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", code => resolve(code));
    });

    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", chunk => {
      stderr += chunk;
    });

    const readyPath = path.join(runDir, "ready");
    const logPath = path.join(runDir, "opened.jsonl");
    const deadline = Date.now() + 10_000;
    while (child.exitCode === null && Date.now() < deadline) {
      if (existsSync(readyPath)) {
        const lines = existsSync(logPath)
          ? (await readFile(logPath, "utf8")).trim().split("\n").filter(Boolean)
          : [];
        if (lines.length >= urls.length) break;
      }
      await delay(25);
    }

    child.stdin.end();
    const exitCode = await exited;

    const opened = existsSync(logPath)
      ? (await readFile(logPath, "utf8"))
        .trim()
        .split("\n")
        .filter(Boolean)
        .map(line => JSON.parse(line) as Record<string, unknown>)
      : [];
    return { opened, stderr, exitCode };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("simulator entry forwards backgroundColor and dpr in windowless mode", async () => {
  const { opened, stderr, exitCode } = await runSimulatorEntry([
    "lynx-simulator://open?url=file%3A%2F%2F%2Ftmp%2Fpage.js&windowless=true&width=320&height=640&dpr=2.5&background-color=%23123456",
    "lynx-simulator://open?url=file%3A%2F%2F%2Ftmp%2Fdefault.js&windowless=true",
  ]);

  assert.equal(exitCode, 0, stderr);
  assert.equal(stderr, "");
  assert.equal(opened.length, 2);
  assert.deepEqual(opened[0]?.["window"], {
    windowless: true,
    size: { width: 320, height: 640 },
    deviceScaleFactor: 2.5,
    backgroundColor: "#123456",
  });
  assert.deepEqual(opened[1]?.["window"], {
    windowless: true,
    size: { width: 390, height: 844 },
  });
});

test("simulator entry forwards backgroundColor in visible mode while scoping dpr to windowless mode", async () => {
  const { opened, stderr, exitCode } = await runSimulatorEntry(
    [
      "lynx-simulator://open?url=file%3A%2F%2F%2Ftmp%2Fmac-page.js&windowless=false&dpr=2.5&background-color=%23f5f5f5",
    ],
    { platform: "darwin" },
  );

  assert.equal(exitCode, 0, stderr);
  assert.equal(stderr, "");
  assert.equal(opened.length, 1);
  assert.deepEqual(opened[0]?.["window"], {
    windowless: false,
    size: { width: 390, height: 844 },
    backgroundColor: "#f5f5f5",
  });
});
