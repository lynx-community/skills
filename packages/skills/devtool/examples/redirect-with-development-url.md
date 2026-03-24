# Redirect with Development URL

Reload the page with URL from dev-server.

```bash
node <path_to_the_skill>/scripts/index.mjs list-sessions
# Find the sessionId to be redirected
node <path_to_the_skill>/scripts/index.mjs cdp --session <sessionId> -m Page.reload '{"url": "http://<host>:<port>/path/to/template.js"}'
```

> Note that the `url` in `list-sessions` would not change after `Page.reload`.
