// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import { type Command, InvalidArgumentError } from 'commander';
import {
  PUBLIC_TASM_PACKAGE,
  resolveTasmModule,
  type TasmRuntimeOptions,
  validateTasmVersion,
} from '../tasm-package.ts';

export {
  PUBLIC_TASM_PACKAGE,
  resolveTasmModule,
  type TasmPackage,
  type TasmRuntimeOptions,
} from '../tasm-package.ts';

interface ClassHandle {
  delete?: () => void;
}

interface EncodeResult extends ClassHandle {
  status: number;
  error_msg: string;
  buffer: ClassHandle & { size(): number; get(index: number): number; };
}

interface DecodeResult extends ClassHandle {
  status: number;
  result: string;
}

interface TasmModule {
  HEAPU8: Uint8Array;
  _malloc(size: number): number;
  _free(pointer: number): void;
  _encode(json: string): EncodeResult;
  _decode(pointer: number, size: number): DecodeResult;
}

interface ConversionOptions {
  input: string;
  output: string;
  codecVersion?: string;
  json?: boolean;
}

async function convert(
  operation: 'encode' | 'decode',
  input: Buffer,
  file: string,
): Promise<Buffer> {
  const factory = createRequire(import.meta.url)(file) as (
    options: { print(message: string): void; printErr(message: string): void; },
  ) => Promise<TasmModule>;
  // A fresh instance per operation follows TASM's JS-bytecode determinism contract.
  // Use the bundled WASM entry directly: index.js also imports unrelated VM tools.
  const diagnostic = (message: string): void => {
    process.stderr.write(`${message}\n`);
  };
  const module = await factory({ print: diagnostic, printErr: diagnostic });
  if (operation === 'encode') {
    const result = module._encode(input.toString('utf8'));
    try {
      if (result.status !== 0) throw new Error(result.error_msg);
      const output = Buffer.alloc(result.buffer.size());
      for (let index = 0; index < output.length; index++) {
        output[index] = result.buffer.get(index);
      }
      return output;
    } finally {
      result.buffer.delete?.();
      result.delete?.();
    }
  }
  const pointer = module._malloc(input.length);
  if (input.length > 0 && pointer === 0) {
    throw new Error('TASM codec could not allocate input memory.');
  }
  let result: DecodeResult | undefined;
  try {
    module.HEAPU8.set(input, pointer);
    result = module._decode(pointer, input.length);
    if (result.status !== 0) throw new Error(result.result);
    return Buffer.from(
      `${JSON.stringify(JSON.parse(result.result), null, 2)}\n`,
    );
  } finally {
    module._free(pointer);
    result?.delete?.();
  }
}

export function registerTasmCommand(
  program: Command,
  runtime: TasmRuntimeOptions = {},
): void {
  const pkg = runtime.package ?? PUBLIC_TASM_PACKAGE;
  const tasm = program.command('tasm')
    .description(
      `Encode/decode templates (powered by ${pkg.name}@${pkg.version} by default)`,
    )
    .option(
      '--codec-version <version>',
      `Use an exact version of ${pkg.name}`,
      value => {
        try {
          return validateTasmVersion(value);
        } catch (error) {
          throw new InvalidArgumentError((error as Error).message);
        }
      },
      pkg.version,
    );
  const help =
    (): string => `\nPowered by ${pkg.name}@${
      tasm.opts<ConversionOptions>().codecVersion ?? pkg.version
    } (in-process WASM).
Installed with npm on first conversion and cached for offline reuse. Help requires no download.
Use a codec version compatible with the template.
AGENT_LYNX_CACHE_DIR overrides the CLI cache root (default: XDG_CACHE_HOME/agent-lynx, LOCALAPPDATA/agent-lynx, or ~/.cache/agent-lynx).`;
  tasm.addHelpText('after', help);
  for (const operation of ['encode', 'decode'] as const) {
    tasm.command(operation)
      .description(
        operation === 'encode'
          ? 'Encode template JSON to TASM binary'
          : 'Decode TASM binary to template JSON',
      )
      .requiredOption('-i, --input <path>', 'Input file path')
      .requiredOption('-o, --output <path>', 'Output file path')
      .option('-j, --json', 'Print output path and codec identity as JSON')
      .addHelpText('after', help)
      .action(async (_options: ConversionOptions, command: Command) => {
        const options = command.optsWithGlobals<ConversionOptions>();
        const input = await fs.readFile(path.resolve(options.input));
        if (operation === 'encode') {
          const value = JSON.parse(input.toString('utf8')) as unknown;
          if (
            value === null || typeof value !== 'object' || Array.isArray(value)
          ) {
            throw new Error(
              'TASM encode input must be a template JSON object.',
            );
          }
        }
        const resolved = await resolveTasmModule(runtime, options.codecVersion);
        const identity = `${resolved.package.name}@${resolved.package.version}`;
        let output: Buffer;
        try {
          output = await convert(operation, input, resolved.file);
        } catch (error) {
          throw new Error(
            `TASM ${operation} failed (${identity}): ${
              (error as Error).message
            }`,
            { cause: error },
          );
        }
        const outputPath = path.resolve(options.output);
        await fs.writeFile(outputPath, output);
        if (command.opts<ConversionOptions>().json ?? options.json) {
          console.log(
            JSON.stringify({
              operation,
              output: outputPath,
              package: resolved.package.name,
              version: resolved.package.version,
            }),
          );
        } else {
          console.error(
            `${operation} succeeded (${identity}). Output written to: ${outputPath}`,
          );
        }
      });
  }
}
