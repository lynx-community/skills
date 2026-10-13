# Transport Guidelines

## AbortSignal and Connection Lifetime

- Do not attach a self-created timeout signal to a connection after `connect()` has succeeded. A timeout used for connection establishment must be detached before returning the `Connection`.
- Keep connection-establishment timeouts separate from request/stream lifetime cancellation. Request timeouts belong in the caller or connector layer; transport connect timeouts should only cover the handshake, tunnel setup, or socket-open phase.
- If a transport needs a local timeout while dialing a socket, wire the abort handler manually and remove it on `"connect"` before returning the socket-backed stream. Avoid passing a timeout signal directly to APIs such as `net.createConnection()` when the returned socket will be reused as a long-lived connection.
- Daemon-backed device connections are pooled and can outlive the request that created them. A timeout signal that remains attached to such a connection can close it later and surface as a fast `No response found` error in an unrelated request.
- Daemon connection attempts still need bounded establishment behavior. Prefer transport-local setup timeouts that stop hanging dials, but never let those setup timers own the established stream.
