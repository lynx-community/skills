// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs';
import type http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { createDebug } from 'obug';
import { DAEMON_INSPECTOR_PATH } from './protocol.ts';
import { TarballCache } from './tarball-cache.ts';

const debug = createDebug('devtool-mcp-server:daemon:static-server');

const DEVTOOL_FRONTEND_TARBALL_URL =
  'https://github.com/lynx-family/lynx-devtool/releases/download/devtools-frontend-lynx-7/devtool.frontend.lynx_1.0.1779085629.tar.gz';
const DEVTOOL_FRONTEND_PATH_PREFIX = '/devtool-frontend/';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

export class StaticServer {
  #frontendCache: TarballCache | null = null;

  tryHandle(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (req.method !== 'GET') return false;
    const pathname = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;

    if (pathname === DAEMON_INSPECTOR_PATH) {
      this.#serveInspectorWrapper(res);
      return true;
    }

    if (pathname.startsWith(DEVTOOL_FRONTEND_PATH_PREFIX)) {
      void this.#serveFrontendRes(req, res, pathname);
      return true;
    }

    return false;
  }

  #serveInspectorWrapper(res: http.ServerResponse): void {
    const base = path.dirname(fileURLToPath(import.meta.url));
    const primary = path.resolve(base, '../../public');
    const secondary = path.resolve(base, '../public');
    const candidates = [primary, secondary];
    const filePath =
      candidates
        .map((d) => path.join(d, 'inspector-wrapper.html'))
        .find((f) => fs.existsSync(f)) ??
      path.join(primary, 'inspector-wrapper.html');
    fs.readFile(filePath, 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(content),
        'cache-control': 'no-store',
      });
      res.end(content);
    });
  }

  async #serveFrontendRes(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    pathname: string,
  ): Promise<void> {
    try {
      if (!this.#frontendCache) {
        this.#frontendCache = new TarballCache();
        this.#frontendCache.start(DEVTOOL_FRONTEND_TARBALL_URL);
      }
      const relativePath = pathname.slice(DEVTOOL_FRONTEND_PATH_PREFIX.length);
      if (relativePath.includes('..')) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(relativePath).toLowerCase();
      if (ext === '.map') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const entry =
        this.#frontendCache.get(relativePath) ??
        (await this.#frontendCache.waitFor(relativePath));
      if (!entry) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
      const acceptGzip = req.headers['accept-encoding']?.includes('gzip');
      if (acceptGzip) {
        res.writeHead(200, {
          'content-type': contentType,
          'content-encoding': 'gzip',
          'content-length': entry.gzipped.length,
          'cache-control': 'public, max-age=31536000, immutable',
        });
        res.end(entry.gzipped);
      } else {
        const raw = zlib.gunzipSync(entry.gzipped);
        res.writeHead(200, {
          'content-type': contentType,
          'content-length': raw.length,
          'cache-control': 'public, max-age=31536000, immutable',
        });
        res.end(raw);
      }
    } catch (err) {
      debug('failed to serve frontend file: %O', err);
      res.writeHead(502);
      res.end('Failed to load resource');
    }
  }
}
