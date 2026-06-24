// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import * as z from "zod";

export const clientId = z
  .string()
  .describe(
    "The clientId to list sessions. Use `Device_listClients` to get the ID. If somehow no clients are found, tool `Device_openApp` (sometimes unavailable) may help.",
  );

export const deviceId = z.string()
  .describe(
    "The deviceId. Use the `Device_listDevices` (if available, otherwise use `Device_acquireDevice`) to get ID for a devices.",
  );

// https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-NodeId
export const nodeId = z.number()
  .describe("Identifier of the node. Unique DOM node identifier.");

// https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-BackendNodeId
export const backendNodeId = z.number()
  .describe("Backend node identifier.");

export const sessionId = z
  .number()
  .describe("The sessionId to list sessions. Use `Device_listSessions` to get the ID.");

export const selector = z.string()
  .describe("CSS selector string");

export const query = z.string()
  .describe("Search query string");

export const searchId = z.union([z.number(), z.string()])
  .describe("Search identifier returned by `DOM.performSearch`. Pass it through unchanged.");

export const fromIndex = z.number()
  .describe("Start index for search results");

export const toIndex = z.number()
  .describe("End index for search results");

export const x = z.number()
  .describe("X coordinate");

export const y = z.number()
  .describe("Y coordinate");

export const depth = z.number()
  .optional()
  .describe("Depth of child nodes to retrieve");

export const pierce = z.boolean()
  .optional()
  .describe("Whether to pierce through shadow DOM");

export const backendNodeIds = z.array(z.number())
  .describe("Array of backend node IDs");

export const includeUserAgentShadowDOM = z.boolean()
  .optional()
  .describe("Whether to include user agent shadow DOM in search");

// https://chromedevtools.github.io/devtools-protocol/tot/CSS/#type-StyleSheetId
export const styleSheetId = z.string()
  .describe("Style sheet identifier");

// https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-Rect
export const rect = z.object({
  x,
  y,
  width: z.number().describe("Width of the rectangle"),
  height: z.number().describe("Height of the rectangle"),
});

export const scriptId = z.string()
  .describe("Identifier of the script. Use `Debugger_listScripts` to get the script IDs of a session.");

// Lynx DevTool native status codes (from devtool_status.cc)
export const screenshotMode = z.enum(["lynxview", "fullscreen"])
  .describe(
    "Mode for screencast. `lynxview` captures only the viewable area of the page, while `fullscreen` captures the entire page.",
  );

export const thread = z
  .enum(["main", "background"])
  .optional()
  .describe(
    "Lynx has two Runtime/VM each on a separate thread. Some operations may need to specify the thread. Defaults to 'background'. 'main' for the main thread, 'background' for the background thread.",
  )
  .default("background");
