# DOM.getDocumentWithBoxModel

- `DOM.getDocumentWithBoxModel` - Get document with box model
- Input: None
- Output: `{result: {root: Node, nodes: Array<BoxModelNode>}}`
- Description: Returns document with layout box model information

## Important: compression behavior

- `DOM.getDocumentWithBoxModel` may return a compressed result in some cases.
- If you need the full, uncompressed JSON payload, call `DOM.enable` first with `{"useCompression": false}`.
- Recommended call order:
  1. `DOM.enable` with `{"useCompression": false}`
  2. `DOM.getDocumentWithBoxModel`
