#!/usr/bin/env node
// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { type Node as AcornNode, parse } from 'acorn';
import {
  analyze,
  type Reference as ScopeReference,
  type Scope,
  type Variable as ScopeVariable,
} from 'eslint-scope';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ScriptThread = 'main' | 'background';

export type IssueCode =
  | 'envelope-error'
  | 'syntax-error'
  | 'unsupported-syntax'
  | 'forbidden-api'
  | 'wrong-thread-global'
  | 'undeclared-global';

export interface CheckIssue {
  line: number;
  column: number;
  code: IssueCode;
  message: string;
  thread?: ScriptThread;
  symbol?: string;
  hint?: string;
}

export interface CheckResult {
  ok: boolean;
  issues: CheckIssue[];
}

interface ParsedSection {
  content: string;
  contentStart: number;
}

interface ParsedEnvelope {
  style: ParsedSection | undefined;
  mainScript: ParsedSection | undefined;
  backgroundScript: ParsedSection | undefined;
}

interface TemplateElementNode extends AcornNode {
  value: {
    cooked?: string | null;
    raw: string;
  };
}

interface AstNode extends AcornNode {
  body?: AstNode | AstNode[];
  id?: AstNode | null;
  name?: string;
  declarations?: AstNode[];
  kind?: string;
  operator?: string;
  init?: AstNode | null;
  left?: AstNode;
  right?: AstNode;
  argument?: AstNode | null;
  arguments?: AstNode[];
  callee?: AstNode;
  object?: AstNode;
  property?: AstNode;
  computed?: boolean;
  properties?: AstNode[];
  key?: AstNode;
  value?: unknown;
  expressions?: AstNode[];
  quasis?: TemplateElementNode[];
  expression?: AstNode;
}

const UTF8_BOM = '\uFEFF';
const COMMENT_START = '<!--';
const COMMENT_END = '-->';
const CDATA_START = '<![CDATA[';
const LYNX_DOCTYPE = '<!doctype lynx>';
const END_TAG_START = '</';

// Formal parameter list from lynx::runtime::js::AddAppServiceWrapForJsContent
// in core/runtime/js/js_bundle.cc.
const BACKGROUND_WRAPPER_PARAMS = [
  'require',
  'module',
  'exports',
  'Card',
  'setTimeout',
  'setInterval',
  'clearInterval',
  'clearTimeout',
  'NativeModules',
  'tt',
  'console',
  'Component',
  'TaroLynx',
  'nativeAppId',
  'Behavior',
  'LynxJSBI',
  'lynx',
  'window',
  'document',
  'frames',
  'self',
  'location',
  'navigator',
  'localStorage',
  'history',
  'Caches',
  'screen',
  'alert',
  'confirm',
  'prompt',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'webkit',
  'Reporter',
  'print',
  'global',
  'requestAnimationFrame',
  'cancelAnimationFrame',
] as const;

const BACKGROUND_WRAPPER_PARAM_SET = new Set<string>(BACKGROUND_WRAPPER_PARAMS);
const BACKGROUND_WRAPPER_PREFIX = `(function(${
  BACKGROUND_WRAPPER_PARAMS.join(', ')
}){\n`;
const BACKGROUND_WRAPPER_SUFFIX = '\n});';

// ECMAScript built-ins registered by PrimJS/QuickJS across Lynx runtimes.
// `Intl`, `SharedArrayBuffer`, `Atomics`, `Float16Array`, and `Iterator` are not
// built into Lynx runtimes by default.
const ECMASCRIPT_GLOBALS = new Set<string>([
  'AggregateError',
  'Array',
  'ArrayBuffer',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Function',
  'Infinity',
  'Int16Array',
  'Int32Array',
  'Int8Array',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'escape',
  'eval',
  'globalThis',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'unescape',
]);

const MAIN_RUNTIME_GLOBALS = new Set<string>([
  'SystemInfo',
  'cancelAnimationFrame',
  'clearInterval',
  'clearTimeout',
  'console',
  'lynx',
  'requestAnimationFrame',
  'setInterval',
  'setTimeout',
]);

// Compiler-only or legacy main-thread APIs disallowed by references/main-thread.md.
const FORBIDDEN_MAIN_THREAD_APIS = new Set<string>([
  '__AddEvent',
  '__CreateFor',
  '__CreateIf',
  '__CreateStyleObject',
  '__SetLepusInitData',
  '__SetStyleObject',
  '__UpdateForChildCount',
  '__UpdateIfNodeIndex',
  '__UpdateStyleObject',
]);

// Implemented Fiber Element PAPI globals (`Renderer::GetBuiltinFunctionsForFiber`
// in `renderer_ng.cc` plus `_ReportError` from `element-api.d.ts`).
const MAIN_THREAD_ELEMENT_PAPI_GLOBALS = new Set<string>([
  '_ReportError',
  '__AddClass',
  '__AddConfig',
  '__AddDataset',
  '__AddEventListener',
  '__AddInlineStyle',
  '__AdoptStyleSheet',
  '__AppendElement',
  '__AsyncResolveElement',
  '__AsyncResolveSubtree',
  '__CleanUp',
  '__CloneElement',
  '__ConsumeGesture',
  '__CreateBlock',
  '__CreateComponent',
  '__CreateCompose',
  '__CreateComputation',
  '__CreateElement',
  '__CreateElementTemplate',
  '__CreateElementWithProperties',
  '__CreateEvent',
  '__CreateFrame',
  '__CreateImage',
  '__CreateList',
  '__CreateMemo',
  '__CreateNonElement',
  '__CreatePage',
  '__CreateRawText',
  '__CreateScope',
  '__CreateScrollView',
  '__CreateSignal',
  '__CreateText',
  '__CreateTypedElementTemplate',
  '__CreateView',
  '__CreateWrapperElement',
  '__DispatchEvent',
  '__ElementAnimate',
  '__ElementFromBinary',
  '__ElementIsEqual',
  '__FirstElement',
  '__FlushElementTree',
  '__GetAttributeByName',
  '__GetAttributeNames',
  '__GetAttributes',
  '__GetChildren',
  '__GetClasses',
  '__GetComponentID',
  '__GetComposeContentElement',
  '__GetComposeMountElement',
  '__GetComputedStyleByKey',
  '__GetConfig',
  '__GetDataByKey',
  '__GetDataset',
  '__GetDiffData',
  '__GetElementByAttrSlot',
  '__GetElementByUniqueID',
  '__GetElementUniqueID',
  '__GetEvent',
  '__GetEvents',
  '__GetID',
  '__GetInlineStyle',
  '__GetInlineStyles',
  '__GetPageElement',
  '__GetParent',
  '__GetScope',
  '__GetTag',
  '__GetTemplateParts',
  '__InsertElementAt',
  '__InsertElementBefore',
  '__InsertNodeToElementTemplate',
  '__InvalidateElement',
  '__InvalidateLayout',
  '__InvokeMethod',
  '__InvokeUIMethod',
  '__IsPartElement',
  '__IsTemplateElement',
  '__LastElement',
  '__LoadLepusChunk',
  '__LoadStyleSheet',
  '__MarkAsyncFlushRoot',
  '__MarkPartElement',
  '__MarkTemplateElement',
  '__MeasureElement',
  '__MeasureTextElement',
  '__MoveElements',
  '__NextElement',
  '__OnCleanUp',
  '__OnLifecycleEvent',
  '__PlaceElement',
  '__QueryComponent',
  '__QuerySelector',
  '__QuerySelectorAll',
  '__ReadSignal',
  '__RemoveElement',
  '__RemoveElementsAt',
  '__RemoveEventListener',
  '__RemoveEventListeners',
  '__RemoveGestureDetector',
  '__RemoveNodeFromElementTemplate',
  '__RemoveStyleSheet',
  '__ReplaceElement',
  '__ReplaceElements',
  '__ReplaceStyleSheets',
  '__ResolveElementSubtree',
  '__RunUpdates',
  '__SerializeElementTemplate',
  '__SetAttribute',
  '__SetAttributeOfElementTemplate',
  '__SetCSSId',
  '__SetClasses',
  '__SetComposeModifier',
  '__SetConfig',
  '__SetCustomLayout',
  '__SetDataset',
  '__SetEvents',
  '__SetGestureDetector',
  '__SetGestureState',
  '__SetID',
  '__SetInlineStyles',
  '__SetListItemInfoOfTemplate',
  '__StopImmediatePropagation',
  '__StopPropagation',
  '__SwapElement',
  '__UnTrack',
  '__UpdateComponentID',
  '__UpdateComponentInfo',
  '__UpdateListCallbacks',
  '__WriteSignal',
]);

const ALLOWED_BACKGROUND_WRAPPER_PARAMS = new Set<string>([
  'NativeModules',
  'cancelAnimationFrame',
  'clearInterval',
  'clearTimeout',
  'console',
  'fetch',
  'lynx',
  'requestAnimationFrame',
  'setInterval',
  'setTimeout',
]);

const BACKGROUND_GLOBAL_OBJECT_EXTRAS = new Set<string>([
  'SystemInfo',
  'console',
]);

const BACKGROUND_ONLY_IDENTIFIERS = new Set<string>([
  'NativeModules',
  'fetch',
]);

const MAIN_BUILTIN_GLOBALS = new Set<string>([
  ...ECMASCRIPT_GLOBALS,
  ...MAIN_RUNTIME_GLOBALS,
  ...MAIN_THREAD_ELEMENT_PAPI_GLOBALS,
]);

const BACKGROUND_GLOBAL_THIS_BUILTINS = new Set<string>([
  ...ECMASCRIPT_GLOBALS,
  ...BACKGROUND_GLOBAL_OBJECT_EXTRAS,
]);

const OBJECT_PROTOTYPE_PROPERTIES = new Set<string>(
  Object.getOwnPropertyNames(Object.prototype),
);

const TIMING_PIPELINE_GLOBAL_HINT =
  'Timing pipeline helpers are mounted on `lynx.performance` (for example `lynx.performance._generatePipelineOptions()`), not as bare `__*` globals.';

const GLOBAL_HINTS: Record<string, string> = {
  Atomics:
    '`Atomics` and `SharedArrayBuffer` are not built into Lynx runtimes by default.',
  Buffer:
    'Node.js `Buffer` does not exist in Lynx. Use `Uint8Array`, `ArrayBuffer`, or `DataView`.',
  Float16Array:
    '`Float16Array` is not built into Lynx QuickJS/PrimJS runtimes; use `Float32Array` or `Float64Array`.',
  Image:
    'Browser `Image` constructor does not exist in Lynx. Use `__CreateImage(pageId)` on the main thread.',
  Intl:
    'Lynx does not build in `Intl` by default; format numbers/dates in JS or load an explicit helper.',
  Iterator:
    'Global `Iterator` helpers are not built into Lynx QuickJS/PrimJS runtimes; iterate with standard loops or `Array.from(...)`.',
  LynxJSBI:
    '`LynxJSBI` is an internal runtime wrapper helper, not a supported `.lynxml` global; use standard `BigInt`.',
  React:
    'ReactLynx is not available in Vanilla Lynx `.lynxml` artifacts; use Element PAPI directly.',
  SharedArrayBuffer:
    '`SharedArrayBuffer` and `Atomics` are not built into Lynx runtimes by default.',
  TextCodecHelper:
    '`TextCodecHelper` is not part of the portable `.lynxml` global allowlist; pass strings directly or handle UTF-8 bytes in JS (`Uint8Array`) or host `NativeModules`.',
  TextDecoder:
    '`TextDecoder` is not a supported Lynx global in `.lynxml` scripts; decode text via `fetch` response `.text()` / `.json()`, plain JS (`Uint8Array`), or host `NativeModules`.',
  TextEncoder:
    '`TextEncoder` is not a supported Lynx global in `.lynxml` scripts; pass strings directly or encode UTF-8 bytes in JS (`Uint8Array`) or host `NativeModules`.',
  WebSocket:
    '`WebSocket` is undefined in Lynx; use `fetch` or host `NativeModules` in `<script thread="background">`.',
  XMLHttpRequest:
    '`XMLHttpRequest` is undefined in Lynx; use `fetch` in `<script thread="background">`.',
  __AddTimingListener: TIMING_PIPELINE_GLOBAL_HINT,
  __BindPipelineIDWithTimingFlag: TIMING_PIPELINE_GLOBAL_HINT,
  __CreateGestureDetector:
    '`__CreateGestureDetector` is a legacy Radon global not registered on the Fiber main thread; use `__SetGestureDetector` / `__RemoveGestureDetector`.',
  __GeneratePipelineOptions: TIMING_PIPELINE_GLOBAL_HINT,
  __MarkTiming: TIMING_PIPELINE_GLOBAL_HINT,
  __OnPipelineStart: TIMING_PIPELINE_GLOBAL_HINT,
  __SetStaticStyle:
    '`__SetStaticStyle` is a legacy Radon global not registered on the Fiber main thread; use `__AddInlineStyle` or `__SetInlineStyles`.',
  document:
    '`document` is undefined in Lynx. Create and mutate UI nodes in `<script thread="main">` with Element PAPI (`__CreatePage`, `__CreateView`, `__CreateText`, etc.).',
  exports:
    'CommonJS `exports` is not part of raw `.lynxml` scripts; load external bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.',
  getElementById:
    'Bare `getElementById` is not installed as a global; use `lynx.getElementById(id)` on `<script thread="background">` or Element PAPI handles on `<script thread="main">`.',
  getNapiLoader:
    'Bare `getNapiLoader` is not available in isolated page contexts; use `lynx.getNapiLoader()` on `<script thread="background">`.',
  global:
    '`global` is undefined in Lynx; use `globalThis` for global scope or `lynx` / `SystemInfo` for runtime APIs.',
  localStorage:
    '`localStorage` is undefined in Lynx; use `lynx.setSessionStorageItem` / `lynx.getSessionStorageItem` or host `NativeModules`.',
  module:
    'CommonJS `module` is not part of raw `.lynxml` scripts; load external bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.',
  navigator:
    '`navigator` is undefined in Lynx; read platform/device metadata from `SystemInfo`.',
  performance:
    '`performance` is not a Lynx global. Use either `Date.now()` or the `requestAnimationFrame` callback timestamp consistently (without mixing the two), or `lynx.performance` for trace/timing observation (it has no `.now()`).',
  process: 'Node.js `process` is not a Lynx global.',
  processData:
    'Define `processData` on `globalThis` (for example `Object.assign(globalThis, { processData(data) { ... } })`) in `<script thread="main">` before calling it.',
  queueMicrotask:
    'Global `queueMicrotask` is not defined across Lynx runtimes; use `Promise.resolve().then(...)` (or `lynx.queueMicrotask(...)` on the background thread).',
  require:
    'CommonJS `require` is not supported in `.lynxml` scripts; load external background bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.',
  self: '`self` is undefined in Lynx; use `globalThis`.',
  window:
    '`window` is undefined in Lynx; use `globalThis` for global scope or `lynx` / `SystemInfo` for runtime APIs.',
};

function isASCIIWhitespace(ch: string): boolean {
  return (
    ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f'
  );
}

function isASCIIAlpha(ch: string): boolean {
  return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
}

function isLynxmlNameChar(ch: string): boolean {
  return isASCIIAlpha(ch) || (ch >= '0' && ch <= '9') || ch === '-';
}

function trimASCIIWhitespace(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && isASCIIWhitespace(value[start]!)) {
    start += 1;
  }
  while (end > start && isASCIIWhitespace(value[end - 1]!)) {
    end -= 1;
  }
  return value.slice(start, end);
}

function findASCIIWhitespace(value: string): number {
  for (let i = 0; i < value.length; i += 1) {
    if (isASCIIWhitespace(value[i]!)) {
      return i;
    }
  }
  return -1;
}

function isOpeningTag(
  source: string,
  position: number,
  tagName: string,
): boolean {
  if (
    position >= source.length
    || source[position] !== '<'
    || !source.startsWith(tagName, position + 1)
  ) {
    return false;
  }
  const boundary = position + tagName.length + 1;
  return (
    boundary < source.length
    && (source[boundary] === '>' || isASCIIWhitespace(source[boundary]!))
  );
}

function findStartTagEnd(source: string, tagStart: number): number {
  let quote: string | null = null;
  for (let i = tagStart + 1; i < source.length; i += 1) {
    const ch = source[i]!;
    if (quote !== null) {
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '>') {
      return i;
    }
  }
  return -1;
}

// Matches native LynxML `ParseContext::EndTagLengthAt` in `lynxml_parser.cc`:
// `</name>` with optional ASCII whitespace between `name` and `>`.
function endTagLengthAt(
  source: string,
  position: number,
  tagName: string,
): number | null {
  if (!source.startsWith(END_TAG_START, position)) {
    return null;
  }
  let cursor = position + END_TAG_START.length;
  if (!source.startsWith(tagName, cursor)) {
    return null;
  }
  cursor += tagName.length;
  if (
    cursor >= source.length
    || (!isASCIIWhitespace(source[cursor]!) && source[cursor] !== '>')
  ) {
    return null;
  }
  while (cursor < source.length && isASCIIWhitespace(source[cursor]!)) {
    cursor += 1;
  }
  if (cursor >= source.length || source[cursor] !== '>') {
    return null;
  }
  return cursor + 1 - position;
}

function findRawTextEndTag(
  source: string,
  startOffset: number,
  tagName: string,
): { start: number; length: number; } | null {
  let search = startOffset;
  while (search < source.length) {
    const candidate = source.indexOf('<', search);
    if (candidate === -1) {
      return null;
    }
    const length = endTagLengthAt(source, candidate, tagName);
    if (length !== null) {
      return { start: candidate, length };
    }
    search = candidate + 1;
  }
  return null;
}

function isQuotedAttribute(
  attributes: string,
  attributeName: string,
  expectedValue?: string,
): boolean {
  if (attributes.length === 0 || !attributes.startsWith(attributeName)) {
    return false;
  }
  let rest = trimASCIIWhitespace(attributes.slice(attributeName.length));
  if (rest.length === 0 || rest[0] !== '=') {
    return false;
  }
  rest = trimASCIIWhitespace(rest.slice(1));
  const quote = rest[0];
  if (rest.length < 3 || (quote !== '"' && quote !== "'")) {
    return false;
  }
  const closingQuote = rest.indexOf(quote, 1);
  if (closingQuote !== rest.length - 1 || closingQuote <= 1) {
    return false;
  }
  return (
    expectedValue === undefined
    || rest.slice(1, closingQuote) === expectedValue
  );
}

function buildLineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function offsetToLineColumn(
  lineStarts: number[],
  sourceLength: number,
  rawOffset: number,
): { line: number; column: number; } {
  const offset = Math.max(0, Math.min(rawOffset, sourceLength));
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((lineStarts[mid] ?? 0) <= offset) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  const lineStart = lineStarts[low] ?? 0;
  return {
    line: low + 1,
    column: offset - lineStart + 1,
  };
}

function parseEnvelope(
  source: string,
  lineStarts: number[],
  issues: CheckIssue[],
): ParsedEnvelope | null {
  const addEnvelopeError = (
    offset: number,
    message: string,
    hint?: string,
  ): null => {
    const { line, column } = offsetToLineColumn(
      lineStarts,
      source.length,
      offset,
    );
    const issue: CheckIssue = {
      line,
      column,
      code: 'envelope-error',
      message,
    };
    if (hint !== undefined) {
      issue.hint = hint;
    }
    issues.push(issue);
    return null;
  };

  let position = source.startsWith(UTF8_BOM) ? UTF8_BOM.length : 0;

  const consumeIgnorable = (): boolean => {
    for (;;) {
      while (
        position < source.length && isASCIIWhitespace(source[position]!)
      ) {
        position += 1;
      }
      if (!source.startsWith(COMMENT_START, position)) {
        return true;
      }
      const commentEnd = source.indexOf(
        COMMENT_END,
        position + COMMENT_START.length,
      );
      if (commentEnd === -1) {
        addEnvelopeError(position, 'Unterminated XML comment.');
        return false;
      }
      position = commentEnd + COMMENT_END.length;
    }
  };

  let probe = position;
  while (probe < source.length && isASCIIWhitespace(source[probe]!)) {
    probe += 1;
  }
  if (source.startsWith('<?xml', probe) || source.startsWith('<?XML', probe)) {
    return addEnvelopeError(
      probe,
      'XML declarations (`<?xml ...?>`) are not allowed in `.lynxml`.',
      'Start the document directly with `<!doctype lynx>`.',
    );
  }

  if (!source.startsWith(LYNX_DOCTYPE, position)) {
    return addEnvelopeError(
      position,
      'Document must start with exact `<!doctype lynx>`.',
      'Remove leading whitespace or non-Lynx doctype declarations before `<!doctype lynx>`.',
    );
  }
  position += LYNX_DOCTYPE.length;

  if (!consumeIgnorable()) {
    return null;
  }

  if (!isOpeningTag(source, position, 'lynx')) {
    return addEnvelopeError(
      position,
      'Expected lowercase `<lynx engine-version="...">` root element after `<!doctype lynx>`.',
    );
  }

  const rootOpenEnd = findStartTagEnd(source, position);
  if (rootOpenEnd === -1) {
    return addEnvelopeError(position, 'Unterminated `<lynx>` opening tag.');
  }
  const rootTagBody = trimASCIIWhitespace(
    source.slice(position + 1, rootOpenEnd),
  );
  const rootNameEnd = findASCIIWhitespace(rootTagBody);
  const rootAttrs = rootNameEnd === -1
    ? ''
    : trimASCIIWhitespace(rootTagBody.slice(rootNameEnd));
  if (rootAttrs.endsWith('/')) {
    return addEnvelopeError(
      position,
      'Self-closing tags (`/>`) are not supported in `.lynxml`.',
    );
  }
  if (!isQuotedAttribute(rootAttrs, 'engine-version')) {
    return addEnvelopeError(
      position,
      '`<lynx>` requires exactly one non-empty quoted `engine-version` attribute.',
    );
  }
  position = rootOpenEnd + 1;

  let style: ParsedSection | undefined;
  let mainScript: ParsedSection | undefined;
  let backgroundScript: ParsedSection | undefined;
  let maxRankSeen = -1;
  let lastClosedTagName: 'style' | 'script' | undefined;
  let rootClosed = false;

  for (;;) {
    if (!consumeIgnorable()) {
      return null;
    }
    const lynxEndLen = endTagLengthAt(source, position, 'lynx');
    if (lynxEndLen !== null) {
      if (lynxEndLen !== '</lynx>'.length) {
        return addEnvelopeError(
          position,
          'Closing tag `</lynx>` must not contain whitespace before `>`; write exact `</lynx>`.',
        );
      }
      position += lynxEndLen;
      rootClosed = true;
      break;
    }
    if (position >= source.length) {
      break;
    }
    if (source[position] !== '<') {
      const hasLaterClose = lastClosedTagName !== undefined
        && findRawTextEndTag(source, position, lastClosedTagName) !== null;
      return addEnvelopeError(
        position,
        'Unexpected text content outside `<style>` and `<script>` blocks.',
        hasLaterClose
          ? `A source block cannot contain a literal \`</${lastClosedTagName}>\` closing tag (including optional whitespace before \`>\`), even inside strings or comments.`
          : undefined,
      );
    }

    const sectionStart = position;
    const tagEnd = findStartTagEnd(source, position);
    if (tagEnd === -1) {
      return addEnvelopeError(sectionStart, 'Unterminated opening tag.');
    }
    if (source.startsWith(END_TAG_START, sectionStart)) {
      const rawClose = trimASCIIWhitespace(
        source.slice(sectionStart + 1, tagEnd),
      );
      return addEnvelopeError(
        sectionStart,
        `Unexpected closing tag \`<${rawClose}>\` inside \`<lynx>\`.`,
      );
    }
    if (
      source.startsWith('<!', sectionStart)
      || source.startsWith('<?', sectionStart)
    ) {
      return addEnvelopeError(
        sectionStart,
        'Expected `<style>` or `<script>` start tag inside `<lynx>`.',
      );
    }

    const nameStart = sectionStart + 1;
    let nameEndPos = nameStart;
    while (nameEndPos < tagEnd && isLynxmlNameChar(source[nameEndPos]!)) {
      nameEndPos += 1;
    }
    if (nameEndPos === nameStart || !isASCIIAlpha(source[nameStart]!)) {
      return addEnvelopeError(
        sectionStart,
        'Invalid element start tag inside `<lynx>`: tag name must start immediately after `<` with an ASCII letter.',
      );
    }
    const tagName = source.slice(nameStart, nameEndPos);
    if (nameEndPos < tagEnd && !isASCIIWhitespace(source[nameEndPos]!)) {
      if (source.startsWith('/>', nameEndPos)) {
        return addEnvelopeError(
          sectionStart,
          'Self-closing tags (`/>`) are not supported in `.lynxml`.',
        );
      }
      return addEnvelopeError(
        sectionStart,
        `Invalid start tag \`<${tagName}>\` inside \`<lynx>\`: expected whitespace before attributes.`,
      );
    }
    const attrs = trimASCIIWhitespace(source.slice(nameEndPos, tagEnd));
    if (attrs.endsWith('/')) {
      return addEnvelopeError(
        sectionStart,
        'Self-closing tags (`/>`) are not supported in `.lynxml`.',
      );
    }
    const rawTag = trimASCIIWhitespace(source.slice(nameStart, tagEnd));

    let rawSectionTag: 'style' | 'script';
    let rank: number;

    if (tagName === 'style') {
      if (attrs.length !== 0) {
        return addEnvelopeError(
          sectionStart,
          '`<style>` does not accept attributes.',
        );
      }
      if (style !== undefined) {
        return addEnvelopeError(sectionStart, 'Duplicate `<style>` block.');
      }
      rank = 0;
      rawSectionTag = 'style';
    } else if (tagName === 'script') {
      rawSectionTag = 'script';
      if (isQuotedAttribute(attrs, 'thread', 'main')) {
        if (mainScript !== undefined) {
          return addEnvelopeError(
            sectionStart,
            'Duplicate `<script thread="main">` block.',
          );
        }
        rank = 1;
      } else if (isQuotedAttribute(attrs, 'thread', 'background')) {
        if (backgroundScript !== undefined) {
          return addEnvelopeError(
            sectionStart,
            'Duplicate `<script thread="background">` block.',
          );
        }
        rank = 2;
      } else {
        return addEnvelopeError(
          sectionStart,
          '`<script>` requires exactly one quoted `thread="main"` or `thread="background"` attribute.',
        );
      }
    } else {
      return addEnvelopeError(
        sectionStart,
        `Unsupported top-level element \`<${tagName}>\` inside \`<lynx>\`.`,
        'Do not place `<config>` or UI markup in `<lynx>`; create UI nodes with Element PAPI in `<script thread="main">`.',
      );
    }

    if (rank < maxRankSeen) {
      return addEnvelopeError(
        sectionStart,
        `Out-of-order \`<${rawTag}>\` block inside \`<lynx>\`.`,
        'Use canonical block order: optional `<style>`, required `<script thread="main">`, then optional `<script thread="background">`.',
      );
    }
    maxRankSeen = rank;

    const contentStart = tagEnd + 1;
    const endTag = findRawTextEndTag(source, contentStart, rawSectionTag);
    if (endTag === null) {
      return addEnvelopeError(
        sectionStart,
        `Missing closing tag \`</${rawSectionTag}>\`.`,
      );
    }
    if (endTag.length !== END_TAG_START.length + rawSectionTag.length + 1) {
      const hasLaterClose = findRawTextEndTag(
        source,
        endTag.start + endTag.length,
        rawSectionTag,
      ) !== null;
      return addEnvelopeError(
        endTag.start,
        `Closing tag \`</${rawSectionTag}>\` must not contain whitespace before \`>\`; write exact \`</${rawSectionTag}>\`.`,
        hasLaterClose
          ? `A source block cannot contain a literal \`</${rawSectionTag}>\` closing tag (including optional whitespace before \`>\`), even inside strings or comments.`
          : undefined,
      );
    }

    const content = source.slice(contentStart, endTag.start);
    if (trimASCIIWhitespace(content).startsWith(CDATA_START)) {
      return addEnvelopeError(
        contentStart,
        'CDATA sections (`<![CDATA[`) are not supported in `.lynxml`.',
        'Keep CSS and JavaScript source text raw without CDATA or XML escaping.',
      );
    }

    const section: ParsedSection = { content, contentStart };
    if (rank === 0) {
      style = section;
    } else if (rank === 1) {
      mainScript = section;
    } else {
      backgroundScript = section;
    }
    lastClosedTagName = rawSectionTag;
    position = endTag.start + endTag.length;
  }

  if (!rootClosed) {
    return addEnvelopeError(position, 'Missing closing tag `</lynx>`.');
  }
  if (!consumeIgnorable()) {
    return null;
  }
  if (position !== source.length) {
    return addEnvelopeError(position, 'Unexpected content after `</lynx>`.');
  }
  if (mainScript === undefined) {
    return addEnvelopeError(
      position,
      'Missing required `<script thread="main">` block.',
    );
  }
  if (trimASCIIWhitespace(mainScript.content).length === 0) {
    return addEnvelopeError(
      mainScript.contentStart,
      '`<script thread="main">` must not be empty.',
      'Create the page root with `__CreatePage("0", 0)` and render initial UI in `<script thread="main">`.',
    );
  }

  return { style, mainScript, backgroundScript };
}

function isAstNode(value: unknown): value is AstNode {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as { type?: unknown; }).type === 'string'
    && typeof (value as { start?: unknown; }).start === 'number'
    && typeof (value as { end?: unknown; }).end === 'number'
  );
}

function forEachChildAstNode(
  node: AstNode,
  callback: (child: AstNode) => void,
): void {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'range' || key === 'loc') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) {
          callback(item);
        }
      }
    } else if (isAstNode(value)) {
      callback(value);
    }
  }
}

function unwrapExpression(node: AstNode | null | undefined): AstNode | null {
  let current = node ?? null;
  while (
    current !== null
    && (current.type === 'ParenthesizedExpression'
      || current.type === 'ChainExpression')
  ) {
    current = current.expression ?? null;
  }
  return current;
}

function isFunctionBoundary(node: AstNode): boolean {
  return (
    node.type === 'FunctionDeclaration'
    || node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression'
  );
}

function extractStaticString(node: AstNode | null | undefined): string | null {
  const unwrapped = unwrapExpression(node);
  if (unwrapped === null) {
    return null;
  }
  if (unwrapped.type === 'Literal' && typeof unwrapped.value === 'string') {
    return unwrapped.value;
  }
  if (
    unwrapped.type === 'TemplateLiteral'
    && (unwrapped.expressions?.length ?? 0) === 0
    && (unwrapped.quasis?.length ?? 0) === 1
  ) {
    const quasi = unwrapped.quasis?.[0];
    return quasi ? (quasi.value.cooked ?? quasi.value.raw) : null;
  }
  return null;
}

function extractStaticMemberProperty(memberNode: AstNode): string | null {
  if (memberNode.type !== 'MemberExpression' || !memberNode.property) {
    return null;
  }
  if (!memberNode.computed) {
    return memberNode.property.type === 'Identifier'
      ? (memberNode.property.name ?? null)
      : null;
  }
  return extractStaticString(memberNode.property);
}

function extractStaticObjectPropertyKey(propNode: AstNode): string | null {
  if (propNode.type !== 'Property' || !propNode.key) {
    return null;
  }
  if (!propNode.computed && propNode.key.type === 'Identifier') {
    return propNode.key.name ?? null;
  }
  return extractStaticString(propNode.key);
}

function classifyDisallowedGlobal(
  name: string,
  thread: ScriptThread,
  viaGlobalThis = false,
): { code: IssueCode; message: string; hint?: string; } {
  const displaySymbol = viaGlobalThis ? `globalThis.${name}` : name;

  if (FORBIDDEN_MAIN_THREAD_APIS.has(name)) {
    if (thread === 'main') {
      return {
        code: 'forbidden-api',
        message:
          `\`${displaySymbol}\` is a compiler-only or legacy Element PAPI global and must not be used in Vanilla Lynx.`,
        hint:
          'Use `__AddEventListener`, `__SetInlineStyles`, and imperative JS loops/conditionals with `__ReplaceElements` instead.',
      };
    }
    return {
      code: 'wrong-thread-global',
      message:
        `\`${displaySymbol}\` is a main-thread-only API (and compiler-only/legacy) and cannot be used in \`<script thread="background">\`.`,
      hint:
        'Keep UI tree creation and mutation in `<script thread="main">`, and send serializable patches from the background thread.',
    };
  }

  if (thread === 'background' && MAIN_THREAD_ELEMENT_PAPI_GLOBALS.has(name)) {
    return {
      code: 'wrong-thread-global',
      message:
        `\`${displaySymbol}\` is a main-thread Element PAPI global and cannot be called in \`<script thread="background">\`.`,
      hint:
        'Dispatch a serializable patch via `lynx.getCoreContext().dispatchEvent(...)` and apply Element PAPI mutations in `<script thread="main">`.',
    };
  }

  if (thread === 'main' && BACKGROUND_ONLY_IDENTIFIERS.has(name)) {
    return {
      code: 'wrong-thread-global',
      message:
        `\`${displaySymbol}\` is only available in \`<script thread="background">\`, not \`<script thread="main">\`.`,
      hint:
        'Move async requests, `fetch`, and `NativeModules` calls to `<script thread="background">` and pass serializable results to the main thread.',
    };
  }

  if (
    thread === 'background'
    && viaGlobalThis
    && ALLOWED_BACKGROUND_WRAPPER_PARAMS.has(name)
    && !BACKGROUND_GLOBAL_THIS_BUILTINS.has(name)
  ) {
    return {
      code: 'undeclared-global',
      message:
        `\`${displaySymbol}\` is not defined on \`<script thread="background">\`; \`${name}\` is injected as an \`app-service.js\` wrapper parameter rather than a \`globalThis\` property.`,
      hint:
        `Reference \`${name}\` directly as a bare identifier in \`<script thread="background">\`.`,
    };
  }

  const hint = GLOBAL_HINTS[name];
  const result: { code: IssueCode; message: string; hint?: string; } = {
    code: 'undeclared-global',
    message:
      `\`${displaySymbol}\` is not a declared identifier or supported Lynx global in \`<script thread="${thread}">\`.`,
  };
  if (hint !== undefined) {
    result.hint = hint;
  }
  return result;
}

function hasEsmImportOrExport(programNode: AstNode): boolean {
  const body = Array.isArray(programNode.body) ? programNode.body : [];
  return body.some(
    (stmt) =>
      stmt.type === 'ImportDeclaration'
      || stmt.type === 'ExportNamedDeclaration'
      || stmt.type === 'ExportDefaultDeclaration'
      || stmt.type === 'ExportAllDeclaration',
  );
}

function reportSyntaxFailure(
  error: unknown,
  section: ParsedSection,
  localOffsetAdjust: number,
  thread: ScriptThread,
  lineStarts: number[],
  sourceLength: number,
  issues: CheckIssue[],
): void {
  const syntaxError = error as { pos?: number; message?: string; };
  const rawPos = typeof syntaxError.pos === 'number' ? syntaxError.pos : 0;
  const clampedLocal = Math.max(
    0,
    Math.min(rawPos + localOffsetAdjust, section.content.length),
  );
  const { line, column } = offsetToLineColumn(
    lineStarts,
    sourceLength,
    section.contentStart + clampedLocal,
  );
  const rawMessage = (syntaxError.message ?? 'JavaScript syntax error').replace(
    /\s*\(\d+:\d+\)$/,
    '',
  );

  const redeclaredMatch = /^Identifier '([^']+)' has already been declared$/
    .exec(rawMessage);

  if (redeclaredMatch === null) {
    try {
      const moduleAst = parse(section.content, {
        ecmaVersion: 'latest',
        sourceType: 'module',
      }) as AstNode;
      if (hasEsmImportOrExport(moduleAst)) {
        issues.push({
          line,
          column,
          code: 'unsupported-syntax',
          thread,
          message:
            `ESM \`import\`/\`export\` syntax is not supported in raw \`.lynxml\` \`<script thread="${thread}">\`: ${rawMessage}.`,
          hint:
            'Write classic script statements in `.lynxml`, or build external background modules separately and load them with `lynx.fetchBundle()` + `lynx.loadScript()`.',
        });
        return;
      }
    } catch {
      // Fall through to report standard syntax error.
    }
  }

  const collidedParam = redeclaredMatch?.[1];
  const issue: CheckIssue = {
    line,
    column,
    code: 'syntax-error',
    thread,
    message:
      `JavaScript syntax error in \`<script thread="${thread}">\`: ${rawMessage}.`,
  };
  if (
    thread === 'background'
    && collidedParam !== undefined
    && BACKGROUND_WRAPPER_PARAM_SET.has(collidedParam)
  ) {
    issue.symbol = collidedParam;
    issue.hint =
      `\`<script thread="background">\` executes inside Lynx's \`app-service.js\` factory function where \`${collidedParam}\` is already a formal parameter; rename this top-level lexical binding or scope it inside a block/function.`;
  }
  issues.push(issue);
}

function analyzeScriptSection(
  section: ParsedSection,
  thread: ScriptThread,
  lineStarts: number[],
  sourceLength: number,
  issues: CheckIssue[],
): void {
  let program: AstNode;
  let offsetAdjust = 0;
  let userStart = 0;
  let userEnd = section.content.length;

  if (thread === 'background') {
    const wrappedSource =
      `${BACKGROUND_WRAPPER_PREFIX}${section.content}${BACKGROUND_WRAPPER_SUFFIX}`;
    try {
      program = parse(wrappedSource, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        ranges: true,
      }) as AstNode;
    } catch (error) {
      reportSyntaxFailure(
        error,
        section,
        -BACKGROUND_WRAPPER_PREFIX.length,
        thread,
        lineStarts,
        sourceLength,
        issues,
      );
      return;
    }

    const topBody = Array.isArray(program.body) ? program.body : [];
    const candidateFn = topBody.length === 1
      ? unwrapExpression(topBody[0]?.expression)
      : null;
    const candidateBlock = candidateFn?.type === 'FunctionExpression'
        && isAstNode(candidateFn.body)
      ? candidateFn.body
      : null;
    const expectedBlockStart = BACKGROUND_WRAPPER_PREFIX.length - 2;
    const expectedBlockEnd = BACKGROUND_WRAPPER_PREFIX.length
      + section.content.length
      + 2;

    if (
      candidateBlock === null
      || candidateBlock.start !== expectedBlockStart
      || candidateBlock.end !== expectedBlockEnd
    ) {
      try {
        parse(section.content, {
          ecmaVersion: 'latest',
          sourceType: 'script',
          allowReturnOutsideFunction: true,
        });
      } catch (standaloneError) {
        reportSyntaxFailure(
          standaloneError,
          section,
          0,
          thread,
          lineStarts,
          sourceLength,
          issues,
        );
        return;
      }
      const prematureEnd = candidateBlock !== null
        ? candidateBlock.end - 1 - BACKGROUND_WRAPPER_PREFIX.length
        : 0;
      const { line, column } = offsetToLineColumn(
        lineStarts,
        sourceLength,
        section.contentStart
          + Math.max(0, Math.min(prematureEnd, section.content.length)),
      );
      issues.push({
        line,
        column,
        code: 'syntax-error',
        thread,
        message:
          'JavaScript syntax error in `<script thread="background">`: unbalanced closing brace `}`.',
      });
      return;
    }

    offsetAdjust = -BACKGROUND_WRAPPER_PREFIX.length;
    userStart = BACKGROUND_WRAPPER_PREFIX.length;
    userEnd = BACKGROUND_WRAPPER_PREFIX.length + section.content.length;
  } else {
    try {
      program = parse(section.content, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        ranges: true,
      }) as AstNode;
    } catch (error) {
      reportSyntaxFailure(
        error,
        section,
        0,
        thread,
        lineStarts,
        sourceLength,
        issues,
      );
      return;
    }
  }

  const scopeManager = analyze(program, {
    ecmaVersion: 2025,
    sourceType: 'script',
    optimistic: true,
  });

  let wrapperFnNode: AstNode | null = null;
  let wrapperScope: Scope | null = null;
  if (thread === 'background') {
    const firstStmt = Array.isArray(program.body) ? program.body[0] : undefined;
    wrapperFnNode = unwrapExpression(firstStmt?.expression);
    if (wrapperFnNode !== null) {
      wrapperScope = scopeManager.acquire(wrapperFnNode);
    }
  }

  const isUserAstNode = (node: { start: number; end: number; }): boolean =>
    node.start >= userStart && node.end <= userEnd;

  const referenceByIdentifier = new Map<AstNode, ScopeReference>();
  for (const scope of scopeManager.scopes) {
    for (const ref of scope.references) {
      const idNode = ref.identifier as unknown as AstNode;
      if (isUserAstNode(idNode)) {
        referenceByIdentifier.set(idNode, ref);
      }
    }
  }

  const parentByNode = new Map<AstNode, AstNode>();
  const buildParents = (node: AstNode): void => {
    forEachChildAstNode(node, (child) => {
      parentByNode.set(child, node);
      buildParents(child);
    });
  };
  buildParents(program);

  const isEagerlyInside = (
    node: AstNode,
    container: AstNode | undefined,
  ): boolean => {
    if (!container) {
      return false;
    }
    let current: AstNode | undefined = node;
    while (current !== undefined) {
      if (current === container) {
        return true;
      }
      if (isFunctionBoundary(current)) {
        return false;
      }
      current = parentByNode.get(current);
    }
    return false;
  };

  const findEnclosingThisOwner = (thisNode: AstNode): AstNode | null => {
    let child: AstNode = thisNode;
    let parent = parentByNode.get(child);
    while (parent !== undefined) {
      if (
        parent.type === 'FunctionDeclaration'
        || parent.type === 'FunctionExpression'
        || parent.type === 'StaticBlock'
        || parent.type === 'Program'
      ) {
        return parent;
      }
      if (parent.type === 'PropertyDefinition' && parent.value === child) {
        return parent;
      }
      child = parent;
      parent = parentByNode.get(child);
    }
    return null;
  };

  const isUnshadowedGlobal = (
    expr: AstNode | null | undefined,
    expectedName: string,
  ): boolean => {
    const unwrapped = unwrapExpression(expr);
    if (
      unwrapped === null
      || unwrapped.type !== 'Identifier'
      || unwrapped.name !== expectedName
    ) {
      return false;
    }
    const ref = referenceByIdentifier.get(unwrapped);
    return ref !== undefined && ref.resolved === null;
  };

  const isGlobalThis = (
    expr: AstNode | null | undefined,
    visited = new Set<AstNode>(),
  ): boolean => {
    const unwrapped = unwrapExpression(expr);
    if (unwrapped === null || visited.has(unwrapped)) {
      return false;
    }
    if (unwrapped.type === 'ThisExpression') {
      // Main-thread classic scripts evaluate with `this === globalThis`;
      // background modules run via `factory.bind(baseApp)`.
      return thread === 'main' && findEnclosingThisOwner(unwrapped) === program;
    }
    if (isUnshadowedGlobal(unwrapped, 'globalThis')) {
      return true;
    }
    if (
      unwrapped.type === 'MemberExpression'
      && extractStaticMemberProperty(unwrapped) === 'globalThis'
    ) {
      const nextVisited = new Set(visited);
      nextVisited.add(unwrapped);
      return isGlobalThis(unwrapped.object, nextVisited);
    }
    if (unwrapped.type === 'Identifier') {
      const ref = referenceByIdentifier.get(unwrapped);
      const def = ref?.resolved?.defs.length === 1
        ? ref.resolved.defs[0]
        : undefined;
      const declarator = def?.node as unknown as AstNode | undefined;
      if (
        def?.type === 'Variable'
        && def.parent?.kind === 'const'
        && declarator?.type === 'VariableDeclarator'
        && declarator.id === (def.name as unknown as AstNode)
      ) {
        const nextVisited = new Set(visited);
        nextVisited.add(unwrapped);
        return isGlobalThis(declarator.init, nextVisited);
      }
    }
    return false;
  };

  const sectionIssues: CheckIssue[] = [];
  const reportAtNode = (
    node: AstNode,
    code: IssueCode,
    message: string,
    symbol?: string,
    hint?: string,
  ): void => {
    const localOffset = Math.max(
      0,
      Math.min(node.start + offsetAdjust, section.content.length),
    );
    const { line, column } = offsetToLineColumn(
      lineStarts,
      sourceLength,
      section.contentStart + localOffset,
    );
    const issue: CheckIssue = {
      line,
      column,
      code,
      thread,
      message,
    };
    if (symbol !== undefined) {
      issue.symbol = symbol;
    }
    if (hint !== undefined) {
      issue.hint = hint;
    }
    sectionIssues.push(issue);
  };

  // Track custom global properties defined via `globalThis.* = ...`,
  // `Object.assign(globalThis, { ... })`, `Object.defineProperty(globalThis, ...)`,
  // or main-thread classic `var` / `function` declarations. Each entry stores
  // the AST node (if any) within which an eager read would still see the
  // uninitialized property.
  const customGlobalDefs = new Map<string, Array<AstNode | undefined>>();
  const writeMemberNodes = new Set<AstNode>();

  const registerCustomGlobal = (
    propName: string,
    eagerRhsGuard?: AstNode,
  ): void => {
    if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) {
      return;
    }
    let list = customGlobalDefs.get(propName);
    if (!list) {
      list = [];
      customGlobalDefs.set(propName, list);
    }
    list.push(eagerRhsGuard);
  };

  const reportOrRegisterGlobalWrite = (
    reportNode: AstNode,
    propName: string,
    viaGlobalThis: boolean,
    eagerRhsGuard?: AstNode,
  ): void => {
    if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) {
      const classification = classifyDisallowedGlobal(
        propName,
        thread,
        viaGlobalThis,
      );
      reportAtNode(
        reportNode,
        classification.code,
        classification.message,
        propName,
        classification.hint,
      );
      return;
    }
    registerCustomGlobal(propName, eagerRhsGuard);
  };

  if (thread === 'main') {
    for (const variable of scopeManager.globalScope.variables) {
      for (const def of variable.defs) {
        if (
          def.type === 'FunctionName'
          || (def.type === 'Variable' && def.parent?.kind === 'var')
        ) {
          reportOrRegisterGlobalWrite(
            def.node as unknown as AstNode,
            variable.name,
            false,
          );
        }
      }
    }
  }

  const collectGlobalDefinitions = (node: AstNode): void => {
    if (isUserAstNode(node)) {
      if (
        node.type === 'AssignmentExpression'
        && (node.operator === '='
          || node.operator === '??='
          || node.operator === '||=')
      ) {
        const lhs = unwrapExpression(node.left);
        if (lhs?.type === 'MemberExpression') {
          if (node.operator === '=') {
            writeMemberNodes.add(lhs);
          }
          if (isGlobalThis(lhs.object)) {
            const propName = extractStaticMemberProperty(lhs);
            if (propName !== null) {
              writeMemberNodes.add(lhs);
              reportOrRegisterGlobalWrite(lhs, propName, true, node.right);
            }
          }
        }
      } else if (node.type === 'CallExpression') {
        const callee = unwrapExpression(node.callee);
        const args = node.arguments ?? [];
        if (
          callee?.type === 'MemberExpression'
          && isUnshadowedGlobal(callee.object, 'Object')
          && args.length >= 2
          && isGlobalThis(args[0])
        ) {
          const method = extractStaticMemberProperty(callee);
          if (method === 'assign') {
            for (const sourceArg of args.slice(1)) {
              const obj = unwrapExpression(sourceArg);
              if (obj?.type === 'ObjectExpression') {
                for (const prop of obj.properties ?? []) {
                  const keyName = extractStaticObjectPropertyKey(prop);
                  if (keyName !== null) {
                    reportOrRegisterGlobalWrite(
                      node,
                      keyName,
                      true,
                      prop.value as AstNode | undefined,
                    );
                  }
                }
              }
            }
          } else if (method === 'defineProperty' && args.length >= 3) {
            const keyName = extractStaticString(args[1]);
            if (keyName !== null) {
              reportOrRegisterGlobalWrite(node, keyName, true, args[2]);
            }
          }
        }
      }
    }
    forEachChildAstNode(node, collectGlobalDefinitions);
  };
  collectGlobalDefinitions(program);

  const isCustomGlobalDefinedForRead = (
    propName: string,
    readNode: AstNode,
  ): boolean => {
    const guards = customGlobalDefs.get(propName);
    if (!guards) {
      return false;
    }
    return guards.some((guard) => !isEagerlyInside(readNode, guard));
  };

  const isWrapperParamUserInitialized = (
    variable: ScopeVariable,
    readNode: AstNode,
  ): boolean => {
    for (const def of variable.defs) {
      const defNode = def.node as unknown as AstNode;
      if (defNode === wrapperFnNode || !isUserAstNode(defNode)) {
        continue;
      }
      if (def.type === 'FunctionName') {
        return true;
      }
      if (def.type === 'Variable') {
        if (
          defNode.type === 'VariableDeclarator'
          && defNode.init != null
          && !isEagerlyInside(readNode, defNode.init)
        ) {
          return true;
        }
        const varDecl = parentByNode.get(defNode);
        const loopStmt = varDecl ? parentByNode.get(varDecl) : undefined;
        if (
          (loopStmt?.type === 'ForInStatement'
            || loopStmt?.type === 'ForOfStatement')
          && loopStmt.left === varDecl
          && !isEagerlyInside(readNode, loopStmt.right)
        ) {
          return true;
        }
      }
    }
    for (const varRef of variable.references) {
      const refId = varRef.identifier as unknown as AstNode;
      if (isUserAstNode(refId) && varRef.isWriteOnly()) {
        const parent = parentByNode.get(refId);
        if (
          parent?.type === 'AssignmentExpression'
          && parent.operator === '='
          && parent.left === refId
          && !isEagerlyInside(readNode, parent.right)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const checkGlobalThisPropertyRead = (
    reportNode: AstNode,
    propName: string,
  ): void => {
    if (FORBIDDEN_MAIN_THREAD_APIS.has(propName)) {
      const classification = classifyDisallowedGlobal(propName, thread, true);
      reportAtNode(
        reportNode,
        classification.code,
        classification.message,
        propName,
        classification.hint,
      );
      return;
    }
    const builtinSet = thread === 'main'
      ? MAIN_BUILTIN_GLOBALS
      : BACKGROUND_GLOBAL_THIS_BUILTINS;
    if (
      builtinSet.has(propName)
      || OBJECT_PROTOTYPE_PROPERTIES.has(propName)
      || isCustomGlobalDefinedForRead(propName, reportNode)
    ) {
      return;
    }
    const classification = classifyDisallowedGlobal(propName, thread, true);
    reportAtNode(
      reportNode,
      classification.code,
      classification.message,
      propName,
      classification.hint,
    );
  };

  for (const [idNode, ref] of referenceByIdentifier) {
    const name = idNode.name;
    if (name === undefined) {
      continue;
    }

    if (ref.resolved !== null) {
      if (
        thread === 'main'
        && ref.resolved.scope === scopeManager.globalScope
        && FORBIDDEN_MAIN_THREAD_APIS.has(name)
        && ref.isRead()
        && ref.resolved.defs.some(
          (def) =>
            def.type === 'FunctionName'
            || (def.type === 'Variable' && def.parent?.kind === 'var'),
        )
      ) {
        const classification = classifyDisallowedGlobal(name, thread, false);
        reportAtNode(
          idNode,
          classification.code,
          classification.message,
          name,
          classification.hint,
        );
        continue;
      }
      if (
        thread === 'background'
        && wrapperScope !== null
        && ref.resolved.scope === wrapperScope
        && BACKGROUND_WRAPPER_PARAM_SET.has(name)
        && !ALLOWED_BACKGROUND_WRAPPER_PARAMS.has(name)
        && ref.isRead()
        && !isWrapperParamUserInitialized(ref.resolved, idNode)
      ) {
        const classification = classifyDisallowedGlobal(name, thread, false);
        reportAtNode(
          idNode,
          classification.code,
          classification.message,
          name,
          classification.hint,
        );
      }
      continue;
    }

    if (FORBIDDEN_MAIN_THREAD_APIS.has(name)) {
      const classification = classifyDisallowedGlobal(name, thread, false);
      reportAtNode(
        idNode,
        classification.code,
        classification.message,
        name,
        classification.hint,
      );
      continue;
    }

    const builtinGlobals = thread === 'main'
      ? MAIN_BUILTIN_GLOBALS
      : BACKGROUND_GLOBAL_THIS_BUILTINS;
    if (
      builtinGlobals.has(name)
      || isCustomGlobalDefinedForRead(name, idNode)
    ) {
      continue;
    }

    const classification = classifyDisallowedGlobal(name, thread, false);
    reportAtNode(
      idNode,
      classification.code,
      classification.message,
      name,
      classification.hint,
    );
  }

  const walkStructuralChecks = (node: AstNode): void => {
    if (isUserAstNode(node)) {
      switch (node.type) {
        case 'WithStatement': {
          reportAtNode(
            node,
            'unsupported-syntax',
            `\`with\` statements are not supported in \`<script thread="${thread}">\`.`,
          );
          break;
        }
        case 'ImportExpression': {
          reportAtNode(
            node,
            'unsupported-syntax',
            `Dynamic \`import()\` is not supported in raw \`.lynxml\` \`<script thread="${thread}">\`.`,
            undefined,
            'Load external background bundles with `lynx.fetchBundle()` and `lynx.loadScript()`.',
          );
          break;
        }
        case 'MemberExpression': {
          if (!writeMemberNodes.has(node) && isGlobalThis(node.object)) {
            const propName = extractStaticMemberProperty(node);
            if (propName !== null) {
              checkGlobalThisPropertyRead(node, propName);
            }
          }
          break;
        }
        case 'VariableDeclarator': {
          if (node.id?.type === 'ObjectPattern' && isGlobalThis(node.init)) {
            for (const prop of node.id.properties ?? []) {
              const propName = extractStaticObjectPropertyKey(prop);
              if (propName !== null) {
                checkGlobalThisPropertyRead(prop, propName);
              }
            }
          }
          break;
        }
        case 'AssignmentExpression':
        case 'AssignmentPattern': {
          if (node.left?.type === 'ObjectPattern' && isGlobalThis(node.right)) {
            for (const prop of node.left.properties ?? []) {
              const propName = extractStaticObjectPropertyKey(prop);
              if (propName !== null) {
                checkGlobalThisPropertyRead(prop, propName);
              }
            }
          }
          break;
        }
        default:
          break;
      }
    }
    forEachChildAstNode(node, walkStructuralChecks);
  };
  walkStructuralChecks(program);

  sectionIssues.sort((a, b) => a.line - b.line || a.column - b.column);
  issues.push(...sectionIssues);
}

export function checkLynxmlSource(source: string): CheckResult {
  const issues: CheckIssue[] = [];
  const lineStarts = buildLineStarts(source);
  const envelope = parseEnvelope(source, lineStarts, issues);

  if (envelope !== null) {
    if (envelope.mainScript !== undefined) {
      analyzeScriptSection(
        envelope.mainScript,
        'main',
        lineStarts,
        source.length,
        issues,
      );
    }
    if (envelope.backgroundScript !== undefined) {
      analyzeScriptSection(
        envelope.backgroundScript,
        'background',
        lineStarts,
        source.length,
        issues,
      );
    }
  }

  issues.sort((a, b) => a.line - b.line || a.column - b.column);
  return {
    ok: issues.length === 0,
    issues,
  };
}

function formatUsage(): string {
  return [
    'Usage: node check-lynxml.mjs [--json] <file.lynxml|-> [...]',
    '',
    'Statically validates build-free Lynx XML (.lynxml) artifacts:',
    '  - Document envelope (`<!doctype lynx>`, `<lynx engine-version="...">`, canonical block order)',
    '  - JavaScript syntax in `<script thread="main">` and `<script thread="background">`',
    '  - Thread-specific Lynx global allowlists and forbidden APIs',
  ].join('\n');
}

function runCli(argv: string[]): void {
  let jsonOutput = false;
  const targets: string[] = [];

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      console.log(formatUsage());
      return;
    }
    if (arg === '--json') {
      jsonOutput = true;
      continue;
    }
    if (arg.startsWith('-') && arg !== '-') {
      console.error(`Unknown option: ${arg}\n\n${formatUsage()}`);
      process.exitCode = 1;
      return;
    }
    targets.push(arg);
  }

  if (targets.length === 0) {
    console.error(formatUsage());
    process.exitCode = 1;
    return;
  }

  const fileReports: Array<{
    file: string;
    ok: boolean;
    issues: CheckIssue[];
  }> = [];
  let allOk = true;

  for (const target of targets) {
    const displayFile = target === '-' ? '<stdin>' : target;
    let source: string;
    try {
      source = target === '-'
        ? readFileSync(0, 'utf8')
        : readFileSync(resolve(target), 'utf8');
    } catch (error) {
      allOk = false;
      const message = error instanceof Error ? error.message : String(error);
      fileReports.push({
        file: displayFile,
        ok: false,
        issues: [
          {
            line: 1,
            column: 1,
            code: 'envelope-error',
            message: `Failed to read file: ${message}`,
          },
        ],
      });
      continue;
    }

    const result = checkLynxmlSource(source);
    if (!result.ok) {
      allOk = false;
    }
    fileReports.push({
      file: displayFile,
      ok: result.ok,
      issues: result.issues,
    });
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          ok: allOk,
          files: fileReports,
        },
        null,
        2,
      ),
    );
  } else {
    for (const report of fileReports) {
      if (report.ok) {
        console.log(`OK ${report.file}`);
        continue;
      }
      const shownHints = new Set<string>();
      for (const issue of report.issues) {
        const scopeLabel = issue.thread !== undefined
          ? `${issue.code}/${issue.thread}`
          : issue.code;
        console.error(
          `${report.file}:${issue.line}:${issue.column} error [${scopeLabel}] ${issue.message}`,
        );
        if (issue.hint !== undefined && !shownHints.has(issue.hint)) {
          shownHints.add(issue.hint);
          console.error(`  Hint: ${issue.hint}`);
        }
      }
    }
  }

  if (!allOk) {
    process.exitCode = 1;
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) {
    return false;
  }
  try {
    return (
      realpathSync(resolve(entry))
      === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return resolve(entry) === resolve(fileURLToPath(import.meta.url));
  }
}

if (isDirectExecution()) {
  runCli(process.argv.slice(2));
}
