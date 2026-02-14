# @lynx-js/benchx-cli (workspace wrapper)

This is a workspace-only package that provides the `benchx_cli` binary via npm.

## How it works

- During `pnpm install`, the `prepare` script downloads a pinned `benchx_cli` release asset from GitHub.
- The extracted binary is stored under `vendor/<platform>/benchx_cli`.
- The package exposes a `benchx_cli` command via `bin/benchx_cli.js`.

## Notes

- Supported platforms: Linux x86_64, macOS arm64.
- Windows is currently unsupported; the binary is not downloaded.
