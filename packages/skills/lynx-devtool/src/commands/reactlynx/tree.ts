// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from "commander";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "../utils.ts";
import { formatTree } from "./format.ts";
import { buildOutboundFrame, emptyTreeDiagnostic, runReactLynxSession } from "./transport.ts";

export function registerTreeCommand(reactlynx: Command, context: Context): void {
  reactlynx
    .command("tree")
    .description(
      "Print the ReactLynx component tree as an ASCII diagram with @cN labels.",
    )
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option(
      "--depth <n>",
      "Maximum tree depth to print (default: unbounded)",
      (v) => {
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) {
          throw new Error(`--depth must be a positive integer (got ${v})`);
        }
        return n;
      },
    )
    .option(
      "--show-shells",
      "Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts",
      false,
    )
    .option(
      "--json",
      "Emit a JSON object { labels, roots, nodes } instead of ASCII",
      false,
    )
    .action(async (options) => {
      const { connector, clientId, sessionId } = await resolveClientAndSession(
        context,
        options,
      );

      const result = await runReactLynxSession({
        connector,
        clientId,
        sessionId: Number(sessionId),
        outbound: [buildOutboundFrame("refresh")],
      });

      if (result.state.tree.size === 0) {
        process.stderr.write(`[reactlynx tree] ${emptyTreeDiagnostic(result)}\n`);
        process.exitCode = 1;
        return;
      }

      const formatted = formatTree(result.state, {
        maxDepth: options.depth,
        hideShells: !options.showShells,
      });

      if (options.json) {
        const nodes = Array.from(result.state.tree.values()).map((n) => ({
          id: n.id,
          type: n.type,
          name: n.name,
          key: n.key,
          parent: n.parent,
          children: n.children,
        }));
        process.stdout.write(
          JSON.stringify(
            { labels: formatted.labels, roots: result.state.roots, nodes },
            null,
            2,
          ) + "\n",
        );
      } else {
        process.stdout.write(formatted.text + "\n");
      }
    });
}
