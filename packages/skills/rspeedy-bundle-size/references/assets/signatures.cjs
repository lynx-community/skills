// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * Background-only detection signatures, shared by all the bundle-size assets
 * (scan-levers.mjs, mt-leak-analyzer.mjs, mt-cutpoint-analyzer.mjs,
 * strip-mt-telemetry-loader.cjs). CommonJS so both the ESM tools (`import sig from
 * './signatures.cjs'`) and the CJS loader (`require('./signatures.cjs')`) can read it.
 *
 * jsb-backed APIs (NativeModules / .bridge / getJSModule / GlobalEventEmitter) are
 * GENUINELY background-only — the main/lepus thread has no jsb. Logger / monitor /
 * telemetry terms are background-only ONLY when jsb-backed; a console-backed logger
 * (`console.*`) runs on the main thread too, so those are "look here", not proof.
 *
 * CUSTOMIZE the logger/monitor/telemetry terms to YOUR stack — the defaults below are
 * generic placeholders. (Inside ByteDance, the internal build overrides this whole file
 * via the skill overlay with the real telemetry/SDK signatures.)
 */
module.exports = {
  // scan-levers.mjs — [label, regex] matched against app SOURCE
  LEAK_PATTERNS: [
    // jsb-backed — always background-only
    ['NativeModules', /\bNativeModules\b/],
    ['getJSModule', /getJSModule\s*\(/],
    ['jsb.bridge', /\.bridge\.|\bjsbCall\b|\brequestAdapter\b/],
    [
      'nativeEvents',
      /\b(GlobalEventEmitter|subscribeEvent|addGlobalEventListener)\b/,
    ],
    // monitor / telemetry — background-only ONLY when jsb-backed (customize these to your stack)
    ['monitor', /\b(reportMonitor|appMonitor)\b/],
    ['telemetry', /\.(reportEvent|reportError|logEvent|track)\s*\(/],
  ],

  // mt-leak-analyzer.mjs — module basename + content regexes over the de-concat main-thread.js
  BG_NAME:
    /(jsb|bridge|logger|report|monitor|track|request|fetch|http|storage|mmkv|getJSModule|NativeModules|GlobalEventEmitter|protobuf|crypto\b|md5|sdk)/i,
  BG_CONTENT:
    /NativeModules|GlobalEventEmitter|getJSModule|\.bridge\b|core\.pipeCall|sendReport|reportError/,

  // mt-cutpoint-analyzer.mjs — background-only PACKAGES + app-module name signatures
  BG_PACKAGES: /^(@your-scope\/(request|btm-sdk|logger|tracker)|md5)\//,
  BG_APP:
    /(^|\/)(request|requester|monitor|monitorV2|stableMonitor|apiParameterMonitor|reporter|postponeReporter|card-monitor|btm|tracker|telemetry|logger)\b/i,

  // strip-mt-telemetry-loader.cjs — jsb-backed telemetry methods to strip on the main-thread layer.
  // ONLY list methods confirmed jsb-backed; never console-backed ones (those run on main-thread).
  TELEMETRY_METHODS: ['reportEvent', 'reportError', 'logEvent', 'track'],
};
