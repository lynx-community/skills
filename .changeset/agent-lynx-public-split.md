---
'agent-lynx': minor
'@lynx-js/skill-lynx-devtool': minor
'@lynx-js/devtool-connector': minor
'@lynx-js/devtool-mcp-server': minor
---

Split the public Agent Lynx runtime out of the Skill package and sync all four
DevTool packages with the upstream 0.14.1 source.

- Add `packages/agent-lynx` (`agent-lynx`) as the CLI runtime owner, carrying the
  `agent-lynx` bin plus the `./bin`, `./connector` and `./package.json` exports.
- Reduce `@lynx-js/skill-lynx-devtool` to canonical Skill content (`SKILL.md`,
  references, examples, evals) with a thin `lynx-devtool` launcher, and publish it.
- Add the `./command` subpath and `Connector.openPage()` to
  `@lynx-js/devtool-connector`, and serve commands over the daemon with version
  negotiation.
- Point `@lynx-js/devtool-mcp-server` at `Connector.openPage()` and reach Lynx
  globals from a background `evaluate`.
