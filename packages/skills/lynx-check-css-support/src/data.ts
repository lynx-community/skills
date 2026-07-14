// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CompatibilityRow } from './availability.js';
import { createCompatibilityRows } from './availability.js';
import {
  BackendNameSchema,
  type CompatStatement,
  CssDefinesPackageSchema,
  CssPropertyNameSchema,
  type Definition,
  DefinitionSchema,
  FeatureNameSchema,
  type NumericVersion,
  NumericVersionSchema,
} from './schemas.js';

type PackageSource = {
  readonly root: string;
  readonly version: NumericVersion;
};

export type QueryOptions = {
  readonly backend?: string;
  readonly feature?: string;
  readonly lynxVersion?: string;
};

export type QueryResult = {
  readonly package: {
    readonly name: '@lynx-js/css-defines';
    readonly version: NumericVersion;
    readonly source: 'bundled';
  };
  readonly property: Definition;
  readonly feature: string;
  readonly status?: NonNullable<CompatStatement['status']>;
  readonly lynx_version?: NumericVersion;
  readonly compatibility: readonly CompatibilityRow[] | null;
};

export class QueryError extends Error {
  override readonly name = 'QueryError';
  readonly exitCode = 2;
}

async function readPackageSource(root: string): Promise<PackageSource> {
  const raw = await readFile(resolve(root, 'package.json'), 'utf8');
  const metadata = CssDefinesPackageSchema.parse(JSON.parse(raw));
  return { root, version: metadata.version };
}

function getBundledPackageRoot(): string {
  return fileURLToPath(new URL('./css-defines', import.meta.url));
}

export async function getBundledPackageVersion(): Promise<NumericVersion> {
  return (await readPackageSource(getBundledPackageRoot())).version;
}

async function readDefinition(
  source: PackageSource,
  propertyInput: string,
): Promise<Definition> {
  const property = CssPropertyNameSchema.parse(propertyInput);
  const filenames = await readdir(resolve(source.root, 'css_defines'));
  const filename = filenames.find((candidate) => {
    const separator = candidate.indexOf('-');
    if (separator < 0) {
      return false;
    }
    const definitionName = candidate.slice(separator + 1, -'.json'.length);
    return (
      definitionName === property ||
      (property.startsWith('-') && definitionName === property.slice(1))
    );
  });

  if (filename === undefined) {
    throw new QueryError(`Unknown CSS property: ${property}`);
  }

  const raw = await readFile(
    resolve(source.root, 'css_defines', filename),
    'utf8',
  );
  const definition = DefinitionSchema.parse(JSON.parse(raw));
  if (definition.name !== property) {
    throw new QueryError(`Unknown CSS property: ${property}`);
  }
  return definition;
}

async function readBundledDefinition(propertyInput: string): Promise<{
  readonly definition: Definition;
  readonly source: PackageSource;
}> {
  const source = await readPackageSource(getBundledPackageRoot());
  return {
    definition: await readDefinition(source, propertyInput),
    source,
  };
}

function selectCompatStatement(
  definition: Definition,
  featureInput: string | undefined,
): { readonly feature: string; readonly statement: CompatStatement } | null {
  if (definition.compat_data === null || definition.compat_data === undefined) {
    if (featureInput !== undefined) {
      const feature = FeatureNameSchema.parse(featureInput);
      throw new QueryError(
        `Unknown feature ${definition.name}.${feature}. Available features: none`,
      );
    }
    return null;
  }

  const propertyCompat = definition.compat_data[definition.name];
  if (propertyCompat === undefined) {
    throw new QueryError(`Missing compatibility entry for ${definition.name}`);
  }

  if (featureInput === undefined) {
    const base = propertyCompat['__compat'];
    if (base === undefined || !('support' in base)) {
      throw new QueryError(
        `Missing base compatibility data for ${definition.name}`,
      );
    }
    return { feature: definition.name, statement: base };
  }

  const feature = FeatureNameSchema.parse(featureInput);
  const selected = propertyCompat[feature];
  if (selected === undefined || !('__compat' in selected)) {
    const available = Object.keys(propertyCompat)
      .filter((name) => name !== '__compat')
      .join(', ');
    throw new QueryError(
      `Unknown feature ${definition.name}.${feature}. Available features: ${available || 'none'}`,
    );
  }
  return { feature, statement: selected.__compat };
}

export async function queryCompatibility(
  propertyInput: string,
  options: QueryOptions,
): Promise<QueryResult> {
  const { definition, source } = await readBundledDefinition(propertyInput);
  const selected = selectCompatStatement(definition, options.feature);
  const targetVersion =
    options.lynxVersion === undefined
      ? undefined
      : NumericVersionSchema.parse(options.lynxVersion);
  const backend =
    options.backend === undefined
      ? undefined
      : BackendNameSchema.parse(options.backend);

  if (
    selected !== null &&
    backend !== undefined &&
    !Object.hasOwn(selected.statement.support, backend)
  ) {
    throw new QueryError(
      `Unknown backend: ${backend}. Available backends: ${Object.keys(selected.statement.support).join(', ')}`,
    );
  }

  const compatibility =
    selected === null
      ? null
      : createCompatibilityRows(selected.statement, targetVersion, backend);

  return {
    package: {
      name: '@lynx-js/css-defines',
      version: source.version,
      source: 'bundled',
    },
    property: definition,
    feature: selected?.feature ?? definition.name,
    ...(selected?.statement.status === undefined
      ? {}
      : { status: selected.statement.status }),
    ...(targetVersion === undefined ? {} : { lynx_version: targetVersion }),
    compatibility,
  };
}
