// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const configHome = resolveRequired(
    args.configHome ?? process.env.XDG_CONFIG_HOME,
    '--config-home or XDG_CONFIG_HOME',
  );
  const model = required(args.model ?? process.env.ARK_MODEL, 'ARK_MODEL');
  const baseURL = required(
    args.baseUrl ?? process.env.ARK_BASE_URL,
    'ARK_BASE_URL',
  );
  const apiKey = required(process.env.ARK_API_KEY, 'ARK_API_KEY');

  const configDir = join(configHome, 'opencode');
  const configPath = join(configDir, 'opencode.json');
  const modelRef = `ark/${model}`;

  await mkdir(configDir, { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify(buildConfig({ apiKey, baseURL, model }), null, 2)}\n`,
  );

  console.info(
    `[skill-eval] wrote opencode Ark provider config model=${modelRef} path=${configPath}`,
  );

  if (args.modelRefOutput) {
    await writeFile(resolve(args.modelRefOutput), `${modelRef}\n`);
  }
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--base-url') args.baseUrl = argv[++index];
    else if (arg === '--config-home') args.configHome = argv[++index];
    else if (arg === '--model') args.model = argv[++index];
    else if (arg === '--model-ref-output') args.modelRefOutput = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function buildConfig({ apiKey, baseURL, model }) {
  return {
    $schema: 'https://opencode.ai/config.json',
    model: `ark/${model}`,
    provider: {
      ark: {
        name: 'Volcengine Ark',
        npm: '@ai-sdk/openai-compatible',
        models: {
          [model]: {
            name: `Volcengine Ark ${model}`,
            limit: {
              context: 200000,
              output: 64000,
            },
            modalities: {
              input: ['text'],
              output: ['text'],
            },
          },
        },
        options: {
          apiKey,
          baseURL,
          headers: {},
        },
      },
    },
  };
}

function resolveRequired(value, name) {
  return resolve(required(value, name));
}

function required(value, name) {
  if (!value) {
    throw new Error(`Missing required ${name}.`);
  }
  return value;
}
