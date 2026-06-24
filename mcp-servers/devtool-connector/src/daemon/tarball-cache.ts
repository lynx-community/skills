// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import path from "node:path";
import zlib from "node:zlib";
import { createDebug } from "obug";

const debug = createDebug("devtool-mcp-server:daemon:tarball-cache");

const TAR_FILTER_PREFIX = "";

export interface TarballEntry {
  gzipped: Buffer;
  rawSize: number;
}

/**
 * Streaming tarball loader. Downloads, gunzips, and parses tar entries on
 * the fly. Only retains files matching the filter prefix, stored gzip-compressed.
 * Files become available for serving as soon as each entry is fully read.
 */
export class TarballCache {
  #files = new Map<string, TarballEntry>();
  #pending = new Map<string, Array<{ resolve: (entry: TarballEntry | null) => void; reject: (err: Error) => void }>>();
  #done = false;
  #error: Error | null = null;
  #loading: Promise<void> | null = null;

  get(filePath: string): TarballEntry | undefined {
    return this.#files.get(filePath);
  }

  get isDone(): boolean {
    return this.#done;
  }

  waitFor(filePath: string): Promise<TarballEntry | null> {
    const existing = this.#files.get(filePath);
    if (existing) return Promise.resolve(existing);
    if (this.#error) return Promise.reject(this.#error);
    if (this.#done) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      let waiters = this.#pending.get(filePath);
      if (!waiters) {
        waiters = [];
        this.#pending.set(filePath, waiters);
      }
      waiters.push({ resolve, reject });
    });
  }

  start(url: string): void {
    if (this.#loading) return;
    this.#loading = this.#load(url);
  }

  async #load(url: string): Promise<void> {
    try {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- Node 18+ exposes fetch; keep undici out of the bundle.
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch tarball: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const gunzip = zlib.createGunzip();
      const { Readable } = await import("node:stream");
      Readable.fromWeb(response.body as never).pipe(gunzip);

      let buf: Buffer = Buffer.alloc(0);
      for await (const chunk of gunzip) {
        buf = Buffer.concat([buf, chunk as Buffer]);
        buf = this.#consumeTar(buf);
      }
      this.#consumeTar(buf);
    } catch (err) {
      this.#error = err instanceof Error ? err : new Error(String(err));
      debug("tarball stream error: %O", this.#error);
    } finally {
      this.#done = true;
      for (const [, waiters] of this.#pending) {
        for (const { resolve, reject } of waiters) {
          if (this.#error) reject(this.#error);
          else resolve(null);
        }
      }
      this.#pending.clear();
      debug("tarball cache done: %d files", this.#files.size);
    }
  }

  #consumeTar(buf: Buffer): Buffer {
    while (buf.length >= 512) {
      const header = buf.subarray(0, 512);
      if (header.every((b) => b === 0)) {
        buf = buf.subarray(512);
        continue;
      }

      const rawName = header.subarray(0, 100).toString("utf-8").replace(/\0.*$/, "");
      const prefix = header.subarray(345, 500).toString("utf-8").replace(/\0.*$/, "");
      const name = prefix ? `${prefix}/${rawName}` : rawName;
      const sizeStr = header.subarray(124, 136).toString("utf-8").replace(/\0.*$/, "").trim();
      const size = parseInt(sizeStr, 8) || 0;
      const typeFlag = header[156];
      const paddedSize = Math.ceil(size / 512) * 512;

      if (buf.length < 512 + paddedSize) break;

      if ((typeFlag === 48 || typeFlag === 0) && name.startsWith(TAR_FILTER_PREFIX)) {
        const fileData = buf.subarray(512, 512 + size);
        const ext = path.extname(name).toLowerCase();
        if (ext !== ".map") {
          const gzipped = zlib.gzipSync(fileData, { level: zlib.constants.Z_BEST_SPEED });
          const entry: TarballEntry = { gzipped, rawSize: size };
          this.#files.set(name, entry);
          const waiters = this.#pending.get(name);
          if (waiters) {
            this.#pending.delete(name);
            for (const { resolve } of waiters) resolve(entry);
          }
        }
      }

      buf = buf.subarray(512 + paddedSize);
    }
    return buf;
  }
}
