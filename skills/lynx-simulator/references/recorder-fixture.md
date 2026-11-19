# Recorder fixture to editable case

Use this optional workflow when the user requests a Lynx Simulator case derived from
a Recorder artifact. For decoding or editing the fixture itself, use
`lynx-recorder-fixture` directly.

Load its published tools and references before reading the recording:

```bash
agent-lynx skills get lynx-recorder-fixture
```

Use that skill's `fixture_tool.py` decoder and its Action List and native-call
references. Keep the original fixture unchanged and work in a separate output
directory. Derive the case from the decoded recording:

- Find the intended `loadTemplate` in `Action List`. Extract its compiled `source`
  bytes with the documented encoding, and preserve required asset/URL relationships.
  Do not treat the encoded fixture itself as a page bundle.
- Read the initial template data and applicable `setGlobalProps` actions into
  `templateData` and `globalProps`, preserving their actual structures.
- Pair native invocations with callbacks using the recorded callback IDs. Use
  JSON bridge rules for fixed replies, or a per-page JS factory for stateful
  replies. Preserve parameter matching and response shapes.
- Identify dynamic components, custom native modules, events, and subsequent
  actions that need extra adaptation. Stop the conversion if required assets or
  responses cannot be recovered; report the specific missing input.

Save the extracted bundle/assets and environment in the case directory, then
follow [the Lynx Simulator workflow](../SKILL.md) to run and inspect them. Compare
against the supplied reference screenshot or behavior and report adaptations
and omissions. A case derived from initial data and mocks does not reproduce
the recording's complete action sequence or event timing.
