# Screenshot Coordinates Are Not Click Coordinates

Plain screenshots (`take-screenshot` or unannotated `screenshot`) are useful for visual inspection, but raw pixel coordinates should not be passed to `Input.emulateTouchFromMouseEvent`.

For agent click automation, prefer `agent-lynx snapshot` or `agent-lynx screenshot --annotate` (where label `[N]` maps directly to `agent-lynx tap @eN`; see [Annotated Screenshots](../references/screenshot-annotate.md)). When raw CDP touch events are needed, compute coordinates from CDP DOM methods instead.

## Recommended replacement

1. Find the target node with `DOM.querySelector`, `DOM.performSearch`, or `DOM.getDocument`.
2. Call `DOM.scrollIntoViewIfNeeded` if needed.
3. Call `DOM.getBoxModel` for the target node.
4. Compute the center of `model.content` or `model.border`.
5. Validate the point with `DOM.getNodeForLocation`.
6. Send `Input.emulateTouchFromMouseEvent` with the same `x/y`.

## Minimal command flow

```bash
agent-lynx cdp -c <client_id> -s <session_id> -m DOM.getDocument '{"depth":0}'
agent-lynx cdp -c <client_id> -s <session_id> -m DOM.querySelector '{"nodeId":<root_node_id>,"selector":"[lynx-test-tag=\"target\"]"}'
agent-lynx cdp -c <client_id> -s <session_id> -m DOM.scrollIntoViewIfNeeded '{"nodeId":<target_node_id>}'
agent-lynx cdp -c <client_id> -s <session_id> -m DOM.getBoxModel '{"nodeId":<target_node_id>}'
agent-lynx cdp -c <client_id> -s <session_id> -m DOM.getNodeForLocation '{"x":<center_x>,"y":<center_y>}'
agent-lynx cdp -c <client_id> -s <session_id> -m Input.emulateTouchFromMouseEvent '{"type":"mousePressed","x":<center_x>,"y":<center_y>,"timestamp":0,"button":"left","clickCount":1}'
agent-lynx cdp -c <client_id> -s <session_id> -m Input.emulateTouchFromMouseEvent '{"type":"mouseReleased","x":<center_x>,"y":<center_y>,"button":"left","clickCount":1}'
```

If a screenshot and DOM disagree, trust the DOM-derived point for clicking. For deeper debugging, see [Click Coordinate Troubleshooting](../references/troubleshooting/click-coordinates.md).
