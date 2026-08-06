---
'@lynx-js/devtool-connector': patch
---

Remove the internal `xdb` protocol types from the public type surface.

`XdbJsbRequest`, `XdbJsbResponse`, `XdbGlobalPropsRequest` and
`XdbGlobalPropsResponse`, along with their `CustomizedResponseMap` and
`Response` entries, described a ByteDance-internal DevTool protocol. The
commands that spoke it are not part of the public CLI, so the types had no
consumer here and only leaked internal protocol names into the published
`.d.ts`.
