#!/usr/bin/env node

// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { Command } from 'commander';
import { z } from 'zod';
import {
  getBundledPackageVersion,
  QueryError,
  type QueryResult,
  queryCompatibility,
} from './data.js';
import { CssPropertyNameSchema } from './schemas.js';
import {
  checkForUpdates,
  UpdateCheckError,
  type UpdateCheckResult,
} from './updates.js';

type CliOptions = {
  readonly backend?: string;
  readonly checkUpdates?: boolean;
  readonly feature?: string;
  readonly json?: boolean;
  readonly lynxVersion?: string;
};

type NormalizedArguments = {
  readonly argv: readonly string[];
  readonly leadingHyphenProperty?: string;
};

function formatVersionAdded(value: string | boolean | null): string {
  if (value === null) {
    return 'unknown';
  }
  return typeof value === 'boolean' ? String(value) : value;
}

function printHumanResult(result: QueryResult): void {
  const property = result.property;
  console.log(
    `Package: ${result.package.name}@${result.package.version} (${result.package.source})`,
  );
  console.log(`Property: ${property.name} (#${property.id})`);
  console.log(`Type: ${property.type}`);
  console.log(`Default: ${property.default_value}`);
  console.log(`Definition version: ${property.version}`);
  console.log(`Description: ${property.desc}`);
  if (property.formal_syntax !== undefined) {
    console.log(`Syntax: ${property.formal_syntax}`);
  }
  if (property.values !== undefined) {
    console.log(
      `Values: ${property.values.map((item) => item.value).join(', ')}`,
    );
  }
  console.log(`Feature: ${result.feature}`);

  const statusLabels = [
    ...(result.status?.deprecated === true ? ['deprecated'] : []),
    ...(result.status?.experimental === true ? ['experimental'] : []),
  ];
  if (statusLabels.length > 0) {
    console.log(`Status: ${statusLabels.join(', ')}`);
  }

  if (result.compatibility === null) {
    console.log('Compatibility: no compat_data is defined for this property.');
    return;
  }

  console.log('Compatibility:');
  for (const row of result.compatibility) {
    const noteText = Array.isArray(row.notes)
      ? row.notes.join(' | ')
      : row.notes;
    const notes = noteText === undefined ? '' : `; notes=${noteText}`;
    const partial = row.partial_implementation === true ? '; partial' : '';
    console.log(
      `- ${row.backend}: added=${formatVersionAdded(row.version_added)}; ${row.availability}${partial}${notes}`,
    );
  }
}

function printUpdateCheck(result: UpdateCheckResult): void {
  if (result.update_available) {
    console.log(
      `Update available: ${result.package} ${result.bundled_version} -> ${result.latest_version}`,
    );
    return;
  }
  if (result.bundled_version === result.latest_version) {
    console.log(`Up to date: ${result.package}@${result.bundled_version}`);
    return;
  }
  console.log(
    `No update available: bundled=${result.bundled_version}; registry=${result.latest_version}`,
  );
}

function normalizeArguments(argv: readonly string[]): NormalizedArguments {
  const valueOptions = new Set(['--backend', '--feature', '--lynx-version']);
  let propertyIndex = -1;
  for (let index = 2; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) {
      continue;
    }
    if (valueOptions.has(argument)) {
      index += 1;
      continue;
    }
    if (
      argument.startsWith('-') &&
      !argument.startsWith('--') &&
      argument !== '-h' &&
      CssPropertyNameSchema.safeParse(argument).success
    ) {
      propertyIndex = index;
      break;
    }
  }
  if (propertyIndex < 0) {
    return { argv: [...argv] };
  }

  const normalized = [...argv];
  const property = normalized[propertyIndex];
  if (property === undefined) {
    return { argv: normalized };
  }
  normalized[propertyIndex] = 'leading-hyphen-property';
  return { argv: normalized, leadingHyphenProperty: property };
}

async function runQuery(property: string, options: CliOptions): Promise<void> {
  const result = await queryCompatibility(property, {
    ...(options.backend === undefined ? {} : { backend: options.backend }),
    ...(options.feature === undefined ? {} : { feature: options.feature }),
    ...(options.lynxVersion === undefined
      ? {}
      : { lynxVersion: options.lynxVersion }),
  });

  if (options.json === true) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHumanResult(result);
  }
}

async function runUpdateCheck(json: boolean): Promise<void> {
  const result = await checkForUpdates(await getBundledPackageVersion());
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  printUpdateCheck(result);
}

async function main(): Promise<void> {
  const normalized = normalizeArguments(process.argv);

  const program = new Command()
    .name('query-css-compat')
    .description(
      'Query @lynx-js/css-defines compatibility or check for a newer dataset version.',
    )
    .argument('[property]', 'CSS property name, for example display')
    .option(
      '--feature <feature>',
      'nested compat_data feature, for example grid',
    )
    .option(
      '--backend <backend>',
      'backend such as android, ios, harmony, or web_lynx',
    )
    .option('--lynx-version <version>', 'target Lynx version, for example 3.4')
    .option(
      '--check-updates',
      'check the latest dataset version without downloading it',
    )
    .option('--json', 'print the command result as JSON')
    .showHelpAfterError();

  program.action(async (property: string | undefined) => {
    const options = program.opts<CliOptions>();
    if (options.checkUpdates === true) {
      if (
        property !== undefined ||
        options.backend !== undefined ||
        options.feature !== undefined ||
        options.lynxVersion !== undefined
      ) {
        program.error(
          '--check-updates cannot be combined with a property or query filters',
        );
      }
      await runUpdateCheck(options.json === true);
      return;
    }
    if (property === undefined) {
      program.error("error: missing required argument 'property'");
      return;
    }
    await runQuery(normalized.leadingHyphenProperty ?? property, options);
  });
  await program.parseAsync(normalized.argv);
}

main().catch((error: unknown) => {
  if (error instanceof UpdateCheckError) {
    console.error(error.message);
    process.exitCode = error.exitCode;
    return;
  }
  if (error instanceof QueryError) {
    console.error(error.message);
    process.exitCode = error.exitCode;
    return;
  }
  if (error instanceof z.ZodError) {
    console.error(
      error.issues
        .map((issue) => {
          const path = issue.path.join('.');
          if (issue.code === 'unrecognized_keys') {
            const prefix = path === '' ? '' : `${path}: `;
            return `${prefix}unrecognized keys: ${issue.keys.join(', ')}`;
          }
          return path === '' ? issue.message : `${path}: ${issue.message}`;
        })
        .join('\n'),
    );
    process.exitCode = 2;
    return;
  }
  throw error;
});
