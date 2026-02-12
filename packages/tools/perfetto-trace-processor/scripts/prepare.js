// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { extract } from 'tar';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RELEASE_DIR = join(
  __dirname,
  '..',
  'node_modules',
  '.lynx-trace-release',
);
const VENDOR_DIR = join(__dirname, '..', 'vendor', 'perfetto');
const DOWNLOAD_URL =
  'https://github.com/lynx-family/lynx-trace/releases/download/v50.1-ui.alpha.1/perfetto-ui-15375aabfeac5091fc1b1737f1c5a54ff9f3b520.tar.gz';

/**
 * @returns {Promise<string>}
 */
async function downloadAndExtractLatestRelease() {
  console.log('Downloading release from GitHub...');

  await rm(RELEASE_DIR, { recursive: true, force: true });
  await mkdir(RELEASE_DIR, { recursive: true });

  const res = await fetch(DOWNLOAD_URL);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download: ${res.status}`);
  }

  console.log('Extracting...');
  await pipeline(res.body, extract({ cwd: RELEASE_DIR }));

  // Read version from index.html
  const indexHtml = await readFile(join(RELEASE_DIR, 'index.html'), 'utf-8');
  const match = indexHtml.match(/data-perfetto_version='([^']+)'/);
  let version = '';
  if (match) {
    const versionInfo = JSON.parse(match[1]);
    version = versionInfo.stable;
    console.log(`Version: ${version}`);
  }

  console.log(`Extracted to ${RELEASE_DIR}`);
  return version;
}

/**
 * @typedef {Object} Patch
 * @property {string} oldCode
 * @property {string} newCode
 */

/**
 * @typedef {Object} SourceMap
 * @property {string[]} sources
 * @property {string[]} sourcesContent
 */

/**
 * Build virtual file system from a sourcemap
 * @param {SourceMap} sourceMap
 * @returns {Map<string, string>}
 */
function buildVirtualFS(sourceMap) {
  /** @type {Map<string, string>} */
  const virtualFS = new Map();
  for (let i = 0; i < sourceMap.sources.length; i++) {
    const sourcePath = sourceMap.sources[i];
    const content = sourceMap.sourcesContent[i];
    const normalizedPath = normalize(sourcePath);
    virtualFS.set(normalizedPath, content);
  }
  return virtualFS;
}

/**
 * Create esbuild plugin for virtual file system
 * @param {Map<string, string>} virtualFS
 * @param {Map<string, string>} [pathAliases]
 * @param {Map<string, Patch[]>} [patches]
 * @returns {import("esbuild").Plugin}
 */
function createVirtualFSPlugin(
  virtualFS,
  pathAliases = new Map(),
  patches = new Map(),
) {
  return {
    name: 'virtual-fs',
    setup(build) {
      // Build a map for bare module resolution
      /** @type {Map<string, string>} */
      const bareModuleMap = new Map();
      for (const path of virtualFS.keys()) {
        const pnpmMatch = path.match(
          /node_modules\/\.pnpm\/([^/]+)\/node_modules\/(.+)$/,
        );
        if (pnpmMatch) {
          const modulePath = pnpmMatch[2];
          if (!bareModuleMap.has(modulePath)) {
            bareModuleMap.set(modulePath, path);
          }
          if (
            modulePath.endsWith('/index.js') ||
            modulePath.endsWith('/index.ts')
          ) {
            const moduleDir = modulePath.replace(/\/index\.[jt]s$/, '');
            if (!bareModuleMap.has(moduleDir)) {
              bareModuleMap.set(moduleDir, path);
            }
          }
        }
      }

      /**
       * @param {string} importPath
       * @param {string} importerPath
       * @returns {string}
       */
      const resolvePath = (importPath, importerPath) => {
        const importerDir = dirname(importerPath);
        const joined = join(importerDir, importPath);
        return normalize(joined);
      };

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') {
          if (virtualFS.has(args.path)) {
            return { path: args.path, namespace: 'virtual' };
          }
          return null;
        }

        if (args.namespace !== 'virtual') {
          return null;
        }

        if (!args.path.startsWith('.') && !args.path.startsWith('/')) {
          const exactMatch = bareModuleMap.get(args.path);
          if (exactMatch) {
            return { path: exactMatch, namespace: 'virtual' };
          }

          for (const suffix of [
            '/index.js',
            '/index.ts',
            '.js',
            '.ts',
            '/minimal.js',
          ]) {
            const tryPath = args.path + suffix;
            const match = bareModuleMap.get(tryPath);
            if (match) {
              return { path: match, namespace: 'virtual' };
            }
          }

          console.log(`Bare module not found: ${args.path}`);
          return { external: true };
        }

        const resolved = resolvePath(args.path, args.importer);

        const aliased = pathAliases.get(resolved);
        if (aliased && virtualFS.has(aliased)) {
          return { path: aliased, namespace: 'virtual' };
        }

        const extensions = ['', '.ts', '.js', '/index.ts', '/index.js'];
        for (const ext of extensions) {
          const tryPath = resolved + ext;
          if (virtualFS.has(tryPath)) {
            return { path: tryPath, namespace: 'virtual' };
          }
        }

        console.log(`Not found: ${args.path} (resolved: ${resolved})`);
        return { external: true };
      });

      build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args) => {
        let content = virtualFS.get(args.path);
        if (content === undefined) {
          return { errors: [{ text: `File not found: ${args.path}` }] };
        }

        // Apply patches if any
        const filePatches = patches.get(args.path);
        if (filePatches) {
          for (const patch of filePatches) {
            if (!content.includes(patch.oldCode)) {
              return {
                errors: [
                  {
                    text: `Patch failed: oldCode not found in ${args.path}\n\nExpected to find:\n${patch.oldCode}`,
                  },
                ],
              };
            }
            content = content.replace(patch.oldCode, patch.newCode);
          }
        }

        const loader = args.path.endsWith('.ts') ? 'ts' : 'js';
        return { contents: content, loader };
      });
    },
  };
}

// Main
const version = await downloadAndExtractLatestRelease();
const outputDir = join(RELEASE_DIR, version);

// Ensure vendors directory exists
await mkdir(VENDOR_DIR, { recursive: true });

// Build 1: engine.js from frontend_bundle.js.map
console.log('\n--- Building engine.js from frontend_bundle.js.map ---');
const frontendSourceMap = JSON.parse(
  await readFile(join(outputDir, 'frontend_bundle.js.map'), 'utf-8'),
);
const frontendVFS = buildVirtualFS(frontendSourceMap);
console.log(`Virtual FS created with ${frontendVFS.size} files`);

const engineEntry = normalize(
  '../../../out/dist/src/trace_processor/engine.ts',
);
console.log(`Entry point: ${engineEntry}`);
console.log(`Entry exists: ${frontendVFS.has(engineEntry)}`);

await build({
  entryPoints: [engineEntry],
  bundle: true,
  outfile: join(VENDOR_DIR, 'engine.js'),
  format: 'esm',
  platform: 'node',
  external: ['immer'],
  plugins: [
    createVirtualFSPlugin(
      frontendVFS,
      new Map([
        [
          '../../../out/dist/src/gen/protos',
          '../../../out/dist/ui/tsc/gen/protos.js',
        ],
      ]),
    ),
  ],
});
console.log(`Output: ${join(VENDOR_DIR, 'engine.js')}`);

// Build 2: wasm_bridge.js from engine_bundle.js.map
console.log('\n--- Building wasm_bridge.js from engine_bundle.js.map ---');
const engineSourceMap = JSON.parse(
  await readFile(join(outputDir, 'engine_bundle.js.map'), 'utf-8'),
);
const engineVFS = buildVirtualFS(engineSourceMap);
console.log(`Virtual FS created with ${engineVFS.size} files`);

const wasmBridgeEntry = normalize(
  '../../../out/dist/src/engine/wasm_bridge.ts',
);
console.log(`Entry point: ${wasmBridgeEntry}`);
console.log(`Entry exists: ${engineVFS.has(wasmBridgeEntry)}`);

await build({
  entryPoints: [wasmBridgeEntry],
  bundle: true,
  outfile: join(VENDOR_DIR, 'wasm_bridge.js'),
  format: 'esm',
  platform: 'node',
  plugins: [
    createVirtualFSPlugin(
      engineVFS,
      new Map([
        [
          '../../../out/dist/src/gen/trace_processor',
          '../../../out/dist/ui/tsc/gen/trace_processor.js',
        ],
      ]),
      new Map([
        [
          '../../../out/dist/src/engine/wasm_bridge.ts',
          [
            {
              oldCode: `\
  constructor() {
    this.aborted = false;
    const deferredRuntimeInitialized = defer<void>();
    this.connection = initTraceProcessor({
      locateFile: (s: string) => s,
      print: (line: string) => console.log(line),
      printErr: (line: string) => this.appendAndLogErr(line),
      onRuntimeInitialized: () => deferredRuntimeInitialized.resolve(),
    });
`,
              newCode: `\
  constructor(wasmBinary: Uint8Array) {
    this.aborted = false;
    const deferredRuntimeInitialized = defer<void>();
    this.connection = initTraceProcessor({
      wasmBinary: wasmBinary,
      locateFile: (s: string) => s,
      print: (line: string) => {}, // discard standard output
      printErr: (line: string) => {}, // discard standard error
      onRuntimeInitialized: () => deferredRuntimeInitialized.resolve(),
    });
`,
            },
          ],
        ],
        [
          '../../../out/dist/ui/tsc/gen/trace_processor.js',
          [
            {
              oldCode: `throw new Error("environment detection error");`,
              newCode: ``,
            },
          ],
        ],
      ]),
    ),
  ],
});
console.log(`Output: ${join(VENDOR_DIR, 'wasm_bridge.js')}`);

// Copy trace_processor.wasm to vendor directory
await copyFile(
  join(outputDir, 'trace_processor.wasm'),
  join(VENDOR_DIR, 'trace_processor.wasm'),
);
console.log(`Copied: ${join(VENDOR_DIR, 'trace_processor.wasm')}`);

// Download and save Perfetto LICENSE
const licenseRes = await fetch(
  'https://raw.githubusercontent.com/google/perfetto/master/LICENSE',
);
if (licenseRes.ok) {
  await writeFile(join(VENDOR_DIR, 'LICENSE'), await licenseRes.text());
  console.log(`Downloaded: ${join(VENDOR_DIR, 'LICENSE')}`);
}
