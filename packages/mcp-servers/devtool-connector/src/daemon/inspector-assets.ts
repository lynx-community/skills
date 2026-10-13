// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { createDebug } from "obug";
import { TarballCache } from "./tarball-cache.ts";

const debug = createDebug("devtool-mcp-server:daemon:inspector-assets");

const HDT_RES_TARBALL_URL =
  "https://github.com/lynx-family/lynx-devtool/releases/download/devtools-frontend-lynx-7/devtool.frontend.lynx_1.0.1779085629.tar.gz";
export const HDT_RES_PATH_PREFIX = "/devtool-frontend/";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

export interface InspectorAssetProvider {
  createInspectorResponse(): Promise<Response>;
  createHdtResourceResponse(pathname: string, acceptEncoding?: string): Promise<Response>;
}

/** Shared Inspector wrapper and HDT assets used by every daemon HTTP surface. */
export class InspectorAssets implements InspectorAssetProvider {
  #hdtResCache: TarballCache | null = null;

  async createInspectorResponse(): Promise<Response> {
    const base = path.dirname(fileURLToPath(import.meta.url));
    const primary = path.resolve(base, "../../public");
    const secondary = path.resolve(base, "../public");
    const filePath = [primary, secondary]
      .map(directory => path.join(directory, "inspector-wrapper.html"))
      .find(candidate => fs.existsSync(candidate)) ?? path.join(primary, "inspector-wrapper.html");

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": String(Buffer.byteLength(content)),
          "Cache-Control": "no-store",
          "Content-Security-Policy": "frame-ancestors 'self'",
        },
      });
    } catch (error) {
      debug("failed to serve Inspector wrapper: %O", error);
      return new Response("Not found", { status: 404 });
    }
  }

  async createHdtResourceResponse(pathname: string, acceptEncoding?: string): Promise<Response> {
    try {
      const relativePath = pathname.slice(HDT_RES_PATH_PREFIX.length);
      if (
        !pathname.startsWith(HDT_RES_PATH_PREFIX)
        || relativePath.includes("..")
      ) {
        return new Response("Not found", { status: 404 });
      }

      const ext = path.extname(relativePath).toLowerCase();
      if (ext === ".map") {
        return new Response("Not found", { status: 404 });
      }

      if (!this.#hdtResCache) {
        this.#hdtResCache = new TarballCache();
        this.#hdtResCache.start(HDT_RES_TARBALL_URL);
      }
      const tarPath = relativePath;
      const entry = this.#hdtResCache.get(tarPath) ?? await this.#hdtResCache.waitFor(tarPath);
      if (!entry) {
        return new Response("Not found", { status: 404 });
      }

      const acceptsGzip = acceptEncoding?.includes("gzip") ?? false;
      const body = acceptsGzip ? entry.gzipped : zlib.gunzipSync(entry.gzipped);
      return new Response(Uint8Array.from(body), {
        status: 200,
        headers: {
          "Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
          ...(acceptsGzip ? { "Content-Encoding": "gzip" } : {}),
          "Content-Length": String(body.length),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      debug("failed to serve hdt-res file: %O", error);
      return new Response("Failed to load resource", { status: 502 });
    }
  }
}
