# DOM.getDocument

- `DOM.getDocument` - Get document root node
- Input: None
- Output: `{result: {root: Node}}`
- Description: Returns the root node of the document tree

## Important: compression behavior

- `DOM.getDocument` may return a compressed result in some cases.
- If you need the full, uncompressed JSON payload, call `DOM.enable` first with `{"useCompression": false}`.
- Recommended call order:
  1. `DOM.enable` with `{"useCompression": false}`
  2. `DOM.getDocument`
