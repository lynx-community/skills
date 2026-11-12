// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

declare module 'eslint-scope' {
  export interface ScopeIdentifier {
    type: 'Identifier';
    name: string;
    start: number;
    end: number;
    range?: [number, number];
  }

  export interface Definition {
    type: string;
    name: ScopeIdentifier;
    node: {
      type: string;
      start: number;
      end: number;
    };
    parent?: {
      type: string;
      kind?: string;
      start: number;
      end: number;
    } | null;
  }

  export interface Variable {
    name: string;
    identifiers: ScopeIdentifier[];
    references: Reference[];
    defs: Definition[];
    scope: Scope;
  }

  export interface Reference {
    identifier: ScopeIdentifier;
    from: Scope;
    resolved: Variable | null;
    writeExpr: unknown;
    init: boolean;
    isWrite(): boolean;
    isRead(): boolean;
    isWriteOnly(): boolean;
    isReadOnly(): boolean;
    isReadWrite(): boolean;
  }

  export interface Scope {
    type: string;
    block: {
      type: string;
      start: number;
      end: number;
    };
    upper: Scope | null;
    childScopes: Scope[];
    variableScope: Scope;
    variables: Variable[];
    set: Map<string, Variable>;
    references: Reference[];
    through: Reference[];
    functionExpressionScope: boolean;
    dynamic: boolean;
    isStrict: boolean;
  }

  export interface ScopeManager {
    scopes: Scope[];
    globalScope: Scope;
    acquire(node: object, inner?: boolean): Scope | null;
  }

  export interface AnalyzeOptions {
    optimistic?: boolean;
    directive?: boolean;
    nodejsScope?: boolean;
    impliedStrict?: boolean;
    sourceType?: 'script' | 'module';
    ecmaVersion?: number;
  }

  export function analyze(ast: object, options?: AnalyzeOptions): ScopeManager;
}
