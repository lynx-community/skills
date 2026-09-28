---
name: lynx-tasm-codec
description: |
  Use the Lynx TASM CLI to convert between template JSON and tasm binaries (encode and decode).

  Trigger scenarios:
  - The user explicitly mentions `lynx-tasm`, `@lynx-js/tasm`, `encode/decode tasm`, `json to tasm`, `tasm to json`, or `decompile/decode tasm`
  - The user requests a specific `@lynx-js/tasm` version or explicitly asks to use the CLI instead of the Node API
  - During a task, the agent discovers that it needs to read, generate, write back, or compare `.tasm` files, or convert between `.json` and `.tasm`
  - The agent is troubleshooting common tasm issues, such as a template binary that cannot be inspected directly, a `.tasm` file that must be decoded for analysis, a modified result that must be re-encoded for verification, suspected output differences between tasm versions, or uncertainty about whether an input is JSON or tasm
---

# Lynx TASM CLI

Use this skill for TASM encoding and decoding tasks performed through the CLI. Do not rewrite the solution to use the Node API unless the user explicitly requests it.

## When to Use

Use this skill when the user wants to do any of the following:

- Encode template JSON into `.tasm`
- Decode `.tasm` back into JSON
- Run the conversion with a specific `@lynx-js/tasm` version
- Receive or execute a `lynx-tasm` / `npx @lynx-js/tasm` command directly

Also use this skill proactively when the user does not mention `lynx-tasm` directly but the agent encounters any of the following during a task:

- The repository contains a `.tasm` file whose contents must be understood
- Template JSON has been modified and a new `.tasm` must be generated
- Two `.tasm` outputs need to be compared, and decoding them to JSON is the better approach
- Different `@lynx-js/tasm` versions may have produced different encoded results
- An error indicates that the input file type may not match the selected subcommand

## Default Strategy

Choose the execution method in this order:

1. Use `npx @lynx-js/tasm` by default
2. When the user requests a specific version, use `npx @lynx-js/tasm@<version>`
3. Use `npm i -g` only when the user explicitly requests a global installation

Do not recommend a global installation by default, and do not add the dependency to the project.

## Command Format

The CLI exposed by `@lynx-js/tasm` supports two subcommands:

- `encode`: JSON -> tasm
- `decode`: tasm -> JSON

This skill does not require installation by default. Run it directly with `npx`:

```bash
npx @lynx-js/tasm encode -i <input.json> -o <output.tasm>
npx @lynx-js/tasm decode -i <input.tasm> -o <output.json>
```

Always pass the `-i` and `-o` input and output arguments explicitly.

When the user specifies a version:

```bash
npx @lynx-js/tasm@<version> encode -i <input.json> -o <output.tasm>
npx @lynx-js/tasm@<version> decode -i <input.tasm> -o <output.json>
```

Use the `lynx-tasm` form only when the user explicitly requests a global command:

```bash
lynx-tasm encode -i <input.json> -o <output.tasm>
lynx-tasm decode -i <input.tasm> -o <output.json>
```

## Workflow

Follow this sequence:

1. Determine whether the user needs `encode` or `decode`
2. Confirm the input and output file paths
3. Prefer absolute paths; interpret relative paths from the current working directory
4. Choose the execution method with the smallest impact
5. Run the command and preserve the original error output
6. On success, clearly report the output file path

If the input or output path is missing, do not guess a filename. Obtain the complete paths before running the command.

## Finding the Correct Input

Before running the command, determine whether the task requires `encode` or `decode`, then locate an input of the corresponding type.

### `encode`

The input to `encode` must be JSON. Look in this order:

1. A JSON file path supplied directly in the user's request
2. A template JSON file that was just generated, modified, or explicitly mentioned in the current task context
3. A `.json` file in the target output directory with the same or a similar name

Before running the command, confirm that:

- Both the input file extension and its contents are valid JSON
- The file exists
- If the repository contains multiple JSON candidates, do not guess. Prefer the file most closely connected to the current change, and ask the user if the choice remains ambiguous

### `decode`

The input to `decode` must be a `.js` or `.bundle` file. Look in this order:

1. A `.js` or `.bundle` file path supplied directly in the user's request
2. A `.js` or `.bundle` artifact that must be analyzed, compared, or decompiled in the current task context
3. The target `.js` or `.bundle` file in a build output directory, temporary directory, or release package mentioned by the user

Before running the command, confirm that:

- The input is the target `.js` or `.bundle` artifact to analyze, not another intermediate artifact
- The file exists
- If multiple `.js` or `.bundle` candidates exist, prefer the most recently generated file, the closest name match, or the file most directly related to the current issue

### General Rules

- Use absolute paths whenever possible
- Interpret relative paths from the current working directory
- Do not infer the file type from the filename alone; use the extension, context, and file origin when necessary
- If no unique input can be identified, narrow the candidates before running the command instead of trying multiple files blindly

## Installation and Version Selection

Always prefer `npx`. Do not recommend installing the package in the project.

Default:

```bash
npx @lynx-js/tasm --help
```

Global installation, only when explicitly requested by the user:

```bash
npm i -g @lynx-js/tasm --registry https://registry.npmjs.org
lynx-tasm --help
```

When only verifying that the command is available, run `npx @lynx-js/tasm --help` instead of installing it globally first.

## Troubleshooting

- The error reports a missing `--input` or `--output`
  The command arguments are incomplete. Add both `-i` and `-o`.
- The error reports that the input file does not exist
  Check the path and the current working directory, and use an absolute path if necessary.
- `encode` reports a JSON parse failure
  The input is not valid JSON. Fix the JSON before encoding it.
- `decode` or `encode` reports a format error
  The subcommand and input file type usually do not match: `encode` reads JSON, while `decode` reads `.tasm`.
- The user requests a fixed version to reproduce an issue
  Use `npx @lynx-js/tasm@<version>` instead of an unversioned global command.

## Examples

```bash
# Encode
npx @lynx-js/tasm encode \
  -i /abs/path/input.json \
  -o /abs/path/output.tasm

# Decode
npx @lynx-js/tasm decode \
  -i /abs/path/output.tasm \
  -o /abs/path/output.json
```
