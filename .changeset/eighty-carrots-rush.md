---
"agent-lynx": patch
---

Add a `README.md` for the `agent-lynx` package.

The package manifest already listed `README.md` in its `files` field, but the file did not exist, so published tarballs shipped without any README and the package page showed no documentation. The new README covers installation, the client/session and snapshot-ref model, the daemon and direct transports, a grouped command reference, the bundled Agent Skills, the `agent-lynx/connector` export, and the supported environment variables.
