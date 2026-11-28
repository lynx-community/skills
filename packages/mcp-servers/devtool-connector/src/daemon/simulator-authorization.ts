// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { randomBytes, randomUUID } from "node:crypto";
import { constants, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { open } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const SIMULATOR_RUN_ACTION = "simulator-run";

function tokenPath(port: number): string {
  return path.join(os.homedir(), ".DebugRouterConnector", `simulator-run-${port}.token`);
}

export function publishSimulatorAuthorization(port: number): { file: string; header: Buffer } {
  const file = tokenPath(port);
  const temporary = `${file}.${randomUUID()}`;
  const token = randomBytes(32).toString("hex");
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try {
    writeFileSync(temporary, token, { flag: "wx", mode: 0o600 });
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
  return { file, header: Buffer.from(`Bearer ${token}`) };
}

export async function readSimulatorAuthorization(port: number): Promise<string> {
  const file = await open(tokenPath(port), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await file.stat();
    const uid = process.getuid?.();
    if (!stat.isFile() || stat.size !== 64 || (uid !== undefined && (stat.uid !== uid || (stat.mode & 0o077) !== 0))) {
      throw new Error("Simulator credential file must be private to the current user.");
    }
    const token = await file.readFile("utf8");
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid simulator credential file.");
    return `Bearer ${token}`;
  } finally {
    await file.close();
  }
}
