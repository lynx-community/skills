// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import { z } from 'zod';

export const NumericVersionSchema = z
  .string()
  .regex(/^\d+(?:\.\d+){0,2}$/, 'expected a numeric version such as 3.4');

export const CssPropertyNameSchema = z
  .string()
  .regex(/^-?[a-z][a-z0-9-]*$/, 'expected a CSS property name');

export const FeatureNameSchema = z
  .string()
  .min(1, 'expected a compatibility feature name')
  .max(128, 'compatibility feature name is too long');

export const BackendNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, 'expected a backend name');

export const SupportStatementSchema = z
  .object({
    version_added: z.union([z.string().min(1), z.boolean(), z.null()]),
    notes: z.union([z.string(), z.array(z.string()).readonly()]).optional(),
    partial_implementation: z.boolean().optional(),
  })
  .strict()
  .readonly();

export const CompatStatementSchema = z
  .object({
    description: z.string().optional(),
    lynx_path: z.string().optional(),
    mdn_url: z.string().url().optional(),
    spec_url: z
      .union([z.string().url(), z.array(z.string().url()).readonly()])
      .optional(),
    status: z
      .object({
        deprecated: z.boolean(),
        experimental: z.boolean(),
      })
      .strict()
      .readonly()
      .optional(),
    support: z.record(BackendNameSchema, SupportStatementSchema).readonly(),
  })
  .strict()
  .readonly();

type FeatureCompat = {
  readonly __compat: CompatStatement;
  readonly [name: string]: CompatStatement | FeatureCompat;
};

const FeatureCompatSchema: z.ZodType<FeatureCompat> = z.lazy(() =>
  z
    .object({
      __compat: CompatStatementSchema,
    })
    .catchall(FeatureCompatSchema)
    .readonly(),
);

const CompatDataSchema = z
  .record(CssPropertyNameSchema, FeatureCompatSchema)
  .readonly();

const PropertyValueSchema = z
  .object({
    value: z.string(),
    version: NumericVersionSchema,
    desc: z.string(),
    'align-type': z.string().optional(),
  })
  .strict()
  .readonly();

const PropertyNoteSchema = z
  .object({
    literal: z.string(),
    level: z.string(),
  })
  .strict()
  .readonly();

export const DefinitionSchema = z
  .object({
    name: CssPropertyNameSchema,
    id: z.number().int().positive(),
    type: z.string().min(1),
    default_value: z.string(),
    version: NumericVersionSchema,
    author: z.string(),
    consumption_status: z.string().min(1),
    desc: z.string(),
    compat_data: CompatDataSchema.nullish(),
    formal_syntax: z.string().optional(),
    is_shorthand: z.boolean(),
    keywords: z.array(z.string()).readonly().optional(),
    note: z.array(PropertyNoteSchema).readonly().optional(),
    values: z.array(PropertyValueSchema).readonly().optional(),
  })
  .strict()
  .readonly();

export const CssDefinesPackageSchema = z
  .object({
    name: z.literal('@lynx-js/css-defines'),
    version: NumericVersionSchema,
  })
  .readonly();

export type CompatStatement = z.infer<typeof CompatStatementSchema>;
export type Definition = z.infer<typeof DefinitionSchema>;
export type NumericVersion = z.infer<typeof NumericVersionSchema>;
