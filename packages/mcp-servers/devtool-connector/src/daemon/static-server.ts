// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type http from "node:http";
import { createDebug } from "obug";
import { HDT_RES_PATH_PREFIX, type InspectorAssetProvider, InspectorAssets } from "./inspector-assets.ts";
import { DAEMON_INSPECTOR_PATH } from "./protocol.ts";

const debug = createDebug("devtool-mcp-server:daemon:static-server");

export class StaticServer {
  readonly #assets: InspectorAssetProvider;
  readonly #resourcePrefix: string;

  constructor(assets: InspectorAssetProvider = new InspectorAssets(), resourcePrefix: string = HDT_RES_PATH_PREFIX) {
    this.#assets = assets;
    this.#resourcePrefix = resourcePrefix;
  }

  tryHandle(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (req.method !== "GET") return false;
    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;

    if (pathname === DAEMON_INSPECTOR_PATH) {
      void this.#serveResponse(res, this.#assets.createInspectorResponse());
      return true;
    }

    if (pathname.startsWith(this.#resourcePrefix)) {
      void this.#serveResponse(
        res,
        this.#assets.createHdtResourceResponse(pathname, req.headers["accept-encoding"]),
      );
      return true;
    }

    return false;
  }

  async #serveResponse(res: http.ServerResponse, responsePromise: Promise<Response>): Promise<void> {
    try {
      const response = await responsePromise;
      const body = Buffer.from(await response.arrayBuffer());
      if (res.destroyed || res.headersSent || res.writableEnded) return;
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(body);
    } catch (error) {
      debug("failed to write static response: %O", error);
      if (res.destroyed || res.headersSent || res.writableEnded) return;
      res.writeHead(500);
      res.end("Failed to write response");
    }
  }
}
