// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from "commander";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "../utils.ts";
import { formatTree } from "./format.ts";
import { formatInspectResult, type InspectResult, parseComponentRef } from "./inspect.ts";
import type { ID } from "./protocol.ts";
import { buildOutboundFrame, emptyTreeDiagnostic, type PreactEnvelope, runReactLynxSession } from "./transport.ts";

export type UpdateKind = "update-prop" | "update-state" | "update-context";

interface UpdateOptions {
  client?: string;
  session?: string;
  showShells?: boolean;
  raw?: boolean;
  json?: boolean;
}

interface UpdatePayload {
  id: ID;
  path: string;
  value: unknown;
}

export function parseUpdateValue(input: string, options: { raw: boolean }): unknown {
  if (options.raw) return input;
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error(
      `<value> must be valid JSON (e.g. \`"hello"\`, \`42\`, \`true\`, \`null\`, \`{"a":1}\`); `
        + `pass --raw to send the input verbatim as a string. Underlying error: ${
          err instanceof Error ? err.message : String(err)
        }`,
      { cause: err },
    );
  }
}

export function buildUpdatePath(userPath: string): string {
  if (userPath.length === 0) {
    throw new Error(
      "<path> must not be empty. Use dot notation, e.g. `count`, `user.name`, `items.0.title`.",
    );
  }
  for (const prefix of ["root.", "props.", "state.", "context."] as const) {
    if (userPath.startsWith(prefix)) {
      throw new Error(
        `<path> ${JSON.stringify(userPath)} must not start with \`${prefix}\`. `
          + "The CLI prepends `root.` automatically; pass paths starting at the field name, e.g. `count`.",
      );
    }
  }

  for (const segment of userPath.split(".")) {
    if (segment.length === 0) {
      throw new Error(
        `<path> ${JSON.stringify(userPath)} contains an empty segment. `
          + "Dot notation must look like `a.b.c`, not `a..b` or `.a`.",
      );
    }
  }
  return `root.${userPath}`;
}

export function registerUpdateCommands(reactlynx: Command, context: Context): void {
  registerOneUpdate(reactlynx, context, {
    name: "update-prop",
    description: "Set a prop on a single ReactLynx component (forceUpdate is called for you)",
    kind: "update-prop",
  });
  registerOneUpdate(reactlynx, context, {
    name: "update-state",
    description: "Set a state field on a single class component (forceUpdate is called for you)",
    kind: "update-state",
  });
  registerOneUpdate(reactlynx, context, {
    name: "update-context",
    description:
      "Set a context value on a single component. Best-effort; upstream may make this read-only in the future.",
    kind: "update-context",
  });
}

function registerOneUpdate(
  reactlynx: Command,
  context: Context,
  spec: { name: string; description: string; kind: UpdateKind },
): void {
  reactlynx
    .command(`${spec.name} <ref> <path> <value>`)
    .description(spec.description)
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option(
      "--show-shells",
      "When resolving `@cN`, count synthetic Fragment/Root/Anonymous wrappers "
        + "the same way `reactlynx tree --show-shells` does. No effect for numeric ids.",
      false,
    )
    .option(
      "--raw",
      "Send <value> verbatim as a string instead of parsing it as JSON",
      false,
    )
    .option(
      "--json",
      "Print the post-update `InspectData` as JSON instead of an ASCII summary",
      false,
    )
    .action(
      async (
        ref: string,
        userPath: string,
        rawValue: string,
        options: UpdateOptions,
      ) => {
        const path = buildUpdatePath(userPath);
        const value = parseUpdateValue(rawValue, { raw: options.raw ?? false });

        const { connector, clientId, sessionId } = await resolveClientAndSession(
          context,
          options,
        );

        let targetId: ID;
        const parsed = parseComponentRef(ref);
        if (parsed.kind === "label") {
          const snapshot = await runReactLynxSession({
            connector,
            clientId,
            sessionId: Number(sessionId),
            outbound: [buildOutboundFrame("refresh")],
          });

          if (snapshot.state.tree.size === 0) {
            process.stderr.write(
              `[reactlynx ${spec.name}] ${emptyTreeDiagnostic(snapshot)}\n`,
            );
            process.exitCode = 1;
            return;
          }

          const labels = formatTree(snapshot.state, {
            hideShells: !options.showShells,
          }).labels;
          const resolved = labels[parsed.index - 1];
          if (resolved === undefined) {
            process.stderr.write(
              `[reactlynx ${spec.name}] label ${ref} does not exist; tree has ${labels.length} labelled component(s).\n`,
            );
            process.exitCode = 1;
            return;
          }
          targetId = resolved;
        } else {
          targetId = parsed.id;
        }

        let confirmation: InspectResult | undefined;
        const session = await runReactLynxSession({
          connector,
          clientId,
          sessionId: Number(sessionId),
          outbound: [
            buildOutboundFrame<UpdatePayload>(spec.kind, {
              id: targetId,
              path,
              value,
            }),
          ],
          idleMs: 1_000,
          maxMs: 5_000,
          onEnvelope: (env: PreactEnvelope) => {
            if (
              env.type === "inspect-result"
              && env.data
              && typeof env.data === "object"
              && (env.data as { id?: number }).id === targetId
            ) {
              confirmation = env.data as InspectResult;
              return "stop";
            }
            return "continue";
          },
        });

        if (!confirmation) {
          const types = [...session.envelopeTypes].sort().join(",") || "(none)";
          process.stderr.write(
            `[reactlynx ${spec.name}] no confirmation \`inspect-result\` for id ${targetId} after `
              + `${session.framesSeen} frame(s) (types=${types}). Common causes:\n`
              + `  - the path is wrong (the App's setInCopy walks objects/arrays; non-existent intermediate keys are created, but typos still produce a no-op forceUpdate)\n`
              + `  - the id is stale (component unmounted between snapshot and update)\n`
              + `  - the App is running an old @lynx-js/preact-devtools that doesn't honor \`${spec.kind}\`\n`
              + `  - for update-state/update-context: the target is a function component (those have neither)\n`
              + `Rerun with DEBUG=devtool-mcp-server:reactlynx to see every frame.\n`,
          );
          process.exitCode = 1;
          return;
        }

        if (options.json) {
          process.stdout.write(JSON.stringify(confirmation, null, 2) + "\n");
          return;
        }

        process.stdout.write(formatInspectResult(confirmation, ref) + "\n");
      },
    );
}
