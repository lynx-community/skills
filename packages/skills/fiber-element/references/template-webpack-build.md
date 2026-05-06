# Template Webpack Build Reference

Use this reference when scaffolding a standalone FiberElement app that bundles background JavaScript, main-thread JavaScript, and CSS through the template-webpack path.

## package.json

```json
{
  "name": "my-fiber-element-app",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "rspeedy build",
    "dev": "rspeedy dev"
  },
  "devDependencies": {
    "@lynx-js/qrcode-rsbuild-plugin": "latest",
    "@lynx-js/rspeedy": "latest",
    "@lynx-js/runtime-wrapper-webpack-plugin": "latest",
    "@lynx-js/template-webpack-plugin": "latest",
    "@lynx-js/type-element-api": "latest",
    "@rspack/core": "latest"
  }
}
```

## src/rspeedy-env.d.ts

```typescript
/// <reference types="@rspeedy/core/client" />
/// <reference types="@lynx-js/type-element-api" />
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["src"]
}
```

## lynx.config.js

```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';

import { pluginTemplateWebpack } from './plugin.js';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  dev: {
    hmr: false,
    liveReload: false,
  },
  output: {
    distPath: {
      root: path.join(projectRoot, 'dist'),
    },
    filename: 'card.bundle',
  },
  plugins: [
    pluginTemplateWebpack(),
    pluginQRCode({
      schema(url) {
        return `${url}?fullscreen=true`;
      },
    }),
  ],
});
```

## plugin.js

```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { RuntimeWrapperWebpackPlugin } from '@lynx-js/runtime-wrapper-webpack-plugin';
import {
  LynxEncodePlugin,
  LynxTemplatePlugin,
} from '@lynx-js/template-webpack-plugin';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const BACKGROUND_ENTRY = 'card__background';
const MAIN_THREAD_ENTRY = 'card__main-thread';
const MAIN_THREAD_ASSET = '.rspeedy/card/main-thread.js';
const BACKGROUND_ASSET = '.rspeedy/card/background.js';
const PLUGIN_NAME = 'template-webpack';

export function pluginTemplateWebpack() {
  return {
    name: PLUGIN_NAME,
    setup(api) {
      api.modifyBundlerChain((chain) => {
        chain.entryPoints.clear();

        chain.entry(BACKGROUND_ENTRY).add({
          import: path.join(projectRoot, 'src/background.ts'),
          filename: BACKGROUND_ASSET,
        });

        chain.entry(MAIN_THREAD_ENTRY).add({
          import: [
            path.join(projectRoot, 'src/main-thread.ts'),
            path.join(projectRoot, 'src/style.css'),
          ],
          filename: MAIN_THREAD_ASSET,
        });

        chain.plugin('template').use(LynxTemplatePlugin, [
          {
            ...LynxTemplatePlugin.defaultOptions,
            filename: 'card.bundle',
            intermediate: '.rspeedy/card',
            chunks: [BACKGROUND_ENTRY, MAIN_THREAD_ENTRY],
            dsl: 'react_nodiff',
            cssPlugins: [],
          },
        ]);

        chain.plugin('runtime-wrapper').use(RuntimeWrapperWebpackPlugin, [
          {
            targetSdkVersion: '3.2',
            test: /background\.js$/,
          },
        ]);

        chain.plugin('encode').use(LynxEncodePlugin, []);

        chain.plugin('before-encode').use({
          apply(compiler) {
            compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
              const hooks =
                LynxTemplatePlugin.getLynxTemplatePluginHooks(compilation);
              hooks.beforeEncode.tap(PLUGIN_NAME, (args) => {
                const backgroundAsset = compilation.getAsset(BACKGROUND_ASSET);
                const mainThreadAsset = compilation.getAsset(MAIN_THREAD_ASSET);
                const cssChunk = compilation.namedChunks.get(MAIN_THREAD_ENTRY);
                const cssAssets = [...(cssChunk?.files ?? [])]
                  .filter((file) => file.endsWith('.css'))
                  .map((file) => compilation.getAsset(file))
                  .filter((asset) => asset !== undefined);

                if (!backgroundAsset || !mainThreadAsset) {
                  return args;
                }

                args.encodeData.manifest = {
                  [backgroundAsset.name]: backgroundAsset.source
                    .source()
                    .toString(),
                };
                args.encodeData.lepusCode = {
                  root: mainThreadAsset,
                  chunks: [],
                  filename: mainThreadAsset.name,
                };
                args.encodeData.css = {
                  ...LynxTemplatePlugin.convertCSSChunksToMap(
                    cssAssets.map((asset) =>
                      asset.source.source().toString(),
                    ),
                    [],
                    Boolean(args.encodeData.compilerOptions.enableCSSSelector),
                  ),
                  chunks: [],
                };

                return args;
              });
            });
          },
        });
      });
    },
  };
}
```

## Run

```bash
pnpm build
pnpm dev
```

Confirm `dist/card.bundle` is emitted, the QR/dev URL opens, background events reach `src/background.ts`, and main-thread lifecycle updates render.
