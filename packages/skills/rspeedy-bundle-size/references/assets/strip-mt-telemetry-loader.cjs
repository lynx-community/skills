// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Main-thread-layer ONLY loader: strips background-only telemetry calls from the
 * main-thread bundle. Registered only on the `react:main-thread` layer, so the
 * background layer keeps full telemetry.
 *
 * When it's safe — READ THIS BEFORE ADDING A METHOD: stripping a call on the
 * main-thread layer is only behavior-neutral if that method is **jsb-backed**
 * (the native logger isn't exposed to the main/lepus thread, so the call was
 * already a no-op there). A **console-backed** logger (`console.*`) runs on the
 * main thread too — stripping it LOSES real main-thread logs (a behavior change).
 * So `METHODS` must list ONLY telemetry methods you've confirmed are jsb-backed.
 * Verify each against your telemetry SDK's implementation before adding it.
 *
 * Mechanism: replacing `x.report(...)` with `void 0` neutralizes the call in any
 * position (statement, `a && x.report()`, optional chain); the minifier DCEs the
 * rest, and once a telemetry import has no remaining main-thread reference it shakes.
 *
 * Behavior-neutral: NO lifecycle removal (that would be a behavior change). Only
 * the configured telemetry expression calls are removed.
 */
// jsb-backed telemetry method names live in signatures.cjs (overridable per stack /
// via the internal overlay). ONLY confirmed jsb-backed methods belong there.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS loader
const { TELEMETRY_METHODS } = require('./signatures.cjs');
const METHODS = new Set(TELEMETRY_METHODS);
const NEEDLE = new RegExp(`\\.(${[...METHODS].join('|')})\\(`);

module.exports = function stripMtTelemetryLoader(source) {
  if (!NEEDLE.test(source)) return source; // fast path
  try {
    // Lazy-require INSIDE the try: SWC-only rspeedy projects often don't have
    // @babel/core installed, and a missing module must not break the build.
    // (If absent, the catch returns source unchanged — telemetry stays, build is fine.)
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy optional dep
    const babel = require('@babel/core');
    const out = babel.transformSync(source, {
      babelrc: false,
      configFile: false,
      compact: false,
      sourceMaps: false,
      parserOpts: {
        sourceType: 'unambiguous',
        allowReturnOutsideFunction: true,
      },
      plugins: [
        function stripPlugin({ types: t }) {
          const isTelemetry = (node) => {
            const c = node?.callee;
            if (!c) return false;
            const member =
              c.type === 'MemberExpression' ||
              c.type === 'OptionalMemberExpression';
            return (
              member &&
              c.property &&
              c.property.type === 'Identifier' &&
              METHODS.has(c.property.name)
            );
          };
          const handle = (path) => {
            if (isTelemetry(path.node))
              path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
          };
          return {
            visitor: { CallExpression: handle, OptionalCallExpression: handle },
          };
        },
      ],
    });
    return out?.code ? out.code : source;
  } catch {
    return source; // never break the build
  }
};
