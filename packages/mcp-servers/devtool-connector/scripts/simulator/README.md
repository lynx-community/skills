# Lynx Simulator bind hook

`bind.c` redirects DebugRouter's IPv4 TCP ports 8901–8920 to the loopback port in
`AGENT_LYNX_SIMULATOR_PORT`. After a successful bind it creates the file named by
`AGENT_LYNX_SIMULATOR_BOUND`. Other binds pass through unchanged. Linux uses
`LD_PRELOAD`; macOS uses dyld interposition through `DYLD_INSERT_LIBRARIES`.

Run `pnpm --filter @lynx-js/devtool-connector build:simulator` after `pnpm install`.
The pinned `@zigc/cli` build dependency supplies Zig, libc headers and linker stubs
through the npm registry. A Linux host builds Linux x64 (glibc 2.17+) and macOS
x64/arm64 (11.0+) libraries without Xcode, an Apple SDK or a separate tool download.
The normal package build also runs this step, and Turbo caches all three outputs.

Only source and build instructions belong in Git. Generated libraries under
`public/simulator/` are ignored by Git and included in the npm package; consumers
need no compiler. Keep the three filenames in sync with `src/transport/simulator.ts`.
