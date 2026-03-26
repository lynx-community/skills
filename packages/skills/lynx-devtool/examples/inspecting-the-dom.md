# Inspecting the DOM

1. List sessions to find the target session ID.
   ```bash
   node <path_to_the_skill>/scripts/index.mjs list-sessions
   ```
2. Request the document.
   ```bash
   node <path_to_the_skill>/scripts/index.mjs cdp -m DOM.getDocument -s <sessionId>
   ```
3. Request details of a node.
   ```bash
   node <path_to_the_skill>/scripts/index.mjs cdp -m DOM.describeNode -s <sessionId> '{"nodeId": 1}'
   ```
