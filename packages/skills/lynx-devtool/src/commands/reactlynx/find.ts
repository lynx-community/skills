// Copyright 2025 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
import type { Command } from "commander";
import { CLIENT_NAME_OPTION, CLIENT_OPTION, type Context, resolveClientAndSession, SESSION_OPTION } from "../utils.ts";
import { formatTree } from "./format.ts";
import { type DevNodeType, typeTag } from "./protocol.ts";
import type { ID, RendererState } from "./protocol.ts";
import { buildOutboundFrame, emptyTreeDiagnostic, runReactLynxSession } from "./transport.ts";

interface FindOptions {
  client?: string;
  session?: string;
  regex?: boolean;
  showShells?: boolean;
  json?: boolean;
  limit?: number;
}

export interface FindMatch {
  label: string;
  id: ID;
  name: string;
  type: DevNodeType;
  key: string;
  ancestors: Array<{ label: string; name: string }>;
}

export function findComponents(
  state: RendererState,
  matcher: (name: string) => boolean,
  options: { hideShells: boolean; limit: number },
): FindMatch[] {
  const formatted = formatTree(state, { hideShells: options.hideShells });
  const idToLabel = new Map<ID, string>();
  formatted.labels.forEach((id, idx) => {
    idToLabel.set(id, `@c${idx + 1}`);
  });

  const matches: FindMatch[] = [];
  for (const id of formatted.labels) {
    const node = state.tree.get(id);
    if (!node) continue;
    if (!matcher(node.name)) continue;

    const ancestors: Array<{ label: string; name: string }> = [];
    let cursorId = node.parent;
    while (cursorId !== undefined && cursorId !== -1) {
      const cursor = state.tree.get(cursorId);
      if (!cursor) break;
      const label = idToLabel.get(cursorId);
      if (label) ancestors.unshift({ label, name: cursor.name });
      cursorId = cursor.parent;
    }

    matches.push({
      label: idToLabel.get(id) ?? "@c?",
      id: node.id,
      name: node.name,
      type: node.type,
      key: node.key,
      ancestors,
    });

    if (matches.length >= options.limit) break;
  }
  return matches;
}

export function buildSubstringMatcher(pattern: string): (name: string) => boolean {
  const needle = pattern.toLowerCase();
  return (name) => name.toLowerCase().includes(needle);
}

export function buildRegexMatcher(pattern: string): (name: string) => boolean {
  let re: RegExp;
  try {
    re = new RegExp(pattern);
  } catch (err) {
    throw new Error(
      `--regex pattern is invalid: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }
  return (name) => re.test(name);
}

export function registerFindCommand(reactlynx: Command, context: Context): void {
  reactlynx
    .command("find <pattern>")
    .description(
      "Find components by display name. Default match is case-insensitive substring; "
        + "use --regex for a JavaScript regular expression.",
    )
    .option(...CLIENT_OPTION)
    .option(...CLIENT_NAME_OPTION)
    .option(...SESSION_OPTION)
    .option("--regex", "Treat <pattern> as a JavaScript regular expression", false)
    .option(
      "--show-shells",
      "Include the synthetic Fragment/Root/Anonymous wrappers ReactLynx inserts",
      false,
    )
    .option(
      "--limit <n>",
      "Maximum number of matches to print (default: 50)",
      (v) => {
        const n = Number.parseInt(v, 10);
        if (!Number.isFinite(n) || n < 1) {
          throw new Error(`--limit must be a positive integer (got ${v})`);
        }
        return n;
      },
      50,
    )
    .option(
      "--json",
      "Emit a JSON array `[{ label, id, name, type, key, ancestors: [{label, name}] }]`",
      false,
    )
    .action(async (pattern: string, options: FindOptions) => {
      const matcher = options.regex
        ? buildRegexMatcher(pattern)
        : buildSubstringMatcher(pattern);

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
        process.stderr.write(`[reactlynx find] ${emptyTreeDiagnostic(result)}\n`);
        process.exitCode = 1;
        return;
      }

      const matches = findComponents(result.state, matcher, {
        hideShells: !options.showShells,
        limit: options.limit ?? 50,
      });

      if (matches.length === 0) {
        process.stderr.write(
          `[reactlynx find] no components match ${options.regex ? "regex" : "substring"} ${JSON.stringify(pattern)} `
            + `(searched ${result.state.tree.size} components${options.showShells ? "" : ", shells hidden"})\n`,
        );
        process.exitCode = 1;
        return;
      }

      if (options.json) {
        process.stdout.write(JSON.stringify(matches, null, 2) + "\n");
        return;
      }

      process.stdout.write(formatMatches(matches) + "\n");
    });
}

export function formatMatches(matches: FindMatch[]): string {
  const lines: string[] = [];
  for (const match of matches) {
    let header = `${match.label} [${typeTag(match.type)}] ${match.name}`;
    if (match.key) header += ` key=${match.key}`;
    lines.push(header);
    if (match.ancestors.length > 0) {
      lines.push(
        "  in "
          + match.ancestors.map((a) => `${a.label} ${a.name}`).join(" > "),
      );
    }
  }
  return lines.join("\n");
}
