# DevTool MCP tool tests

Use this guide when changing a tool or its coverage. Read the tool implementation and the nearest existing test before choosing a test layer.

- Device-independent behavior belongs in this directory: request parameters, response conversion, failures and cleanup. See [DOM_getDocument.test.ts](DOM_getDocument.test.ts) for a connector stub.
- Real protocol behavior belongs in [e2e/tools.test.ts](../../e2e/tools.test.ts) or the relevant specialized E2E suite. Reuse its shared client/session; opening pages or creating competing connections can disrupt other cases.
- [createToolContext](../utils/testTool.ts) owns schema-based ID injection and response decoding. Pass the suite's known session when available; inspect the helper for exact fallback behavior rather than copying it into each test.

Run the affected package's `test` script or focused `node:test` files for local checks. For E2E, first configure the target device/runtime and transport, then use the package's serial `test:e2e` entry or the selected suite with `--test-concurrency=1`. Report unavailable device coverage as not run.

Assert meaningful observable fields and failure/cleanup behavior. Use stubs for local boundaries and fault injection, and real CDP coverage when the change depends on device behavior.
