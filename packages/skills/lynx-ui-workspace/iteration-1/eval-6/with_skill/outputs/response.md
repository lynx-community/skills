The closest Lynx UI anchor here is the Lynx UI Introduction page, and the local reference I’d use first is `/Users/bytedance/workspace/skills/packages/skills/lynx-ui/references/foundation.md`.

From your description, this does not sound like a primary Lynx UI problem.

If the example is structurally correct but your ReactLynx project is failing on setup or types, the boundary is usually:

- `lynx-ui` handles whether you picked the right Lynx UI package, imports, component shape, and official example usage.
- `reactlynx-best-practices` should handle it if the real issue is ReactLynx architecture, thread-sensitive behavior, or project integration patterns.
- `lynx-typescript` should handle it if the real issue is TypeScript config, JSX typing, missing type packages, declaration files, or compiler errors.

Given the symptoms you described, I would hand this off mostly to `lynx-typescript`, and possibly `reactlynx-best-practices` if there is ReactLynx-specific setup drift.

Why I’m saying that:

- The Lynx UI skill’s setup guidance is intentionally minimal: install `@lynx-js/lynx-ui`, import from `@lynx-js/lynx-ui`, and stay close to the official example shape.
- Once the breakage is about project setup or types, the local skill docs explicitly treat that as a different class of problem.
- The `lynx-typescript` skill specifically covers the exact failure area you described: `tsconfig.json`, `jsxImportSource`, `@lynx-js/types`, `@lynx-js/react`, and `rspeedy-env.d.ts`.

So the practical answer I’d give you is:

This is probably not a Lynx UI component/composition issue unless your import path or package choice is wrong. If your example already looks structurally right, the next thing to inspect is your ReactLynx TypeScript environment.

The likely checks are:

- `@lynx-js/lynx-ui` is installed if you are using the default Lynx UI entrypoint.
- `@lynx-js/react` and `@lynx-js/types` are present for ReactLynx typing.
- `tsconfig.json` includes ReactLynx JSX settings such as `"jsx": "react-jsx"` and `"jsxImportSource": "@lynx-js/react"`.
- `isolatedModules` is enabled if your toolchain expects the Rspeedy/SWC-style setup.
- A project env declaration such as `src/rspeedy-env.d.ts` exists if your setup relies on Rspeedy-provided typings.

If those are what’s broken, another Lynx skill should take over:

- Use `lynx-typescript` for type errors, missing JSX intrinsic types, bad config, or compiler complaints.
- Use `reactlynx-best-practices` if the issue is that the example conflicts with ReactLynx runtime constraints or architecture rather than TypeScript itself.

So my diagnosis is: this is only partially a Lynx UI question at the boundary, but the actual troubleshooting owner is most likely `lynx-typescript`, with `reactlynx-best-practices` as the secondary fallback if the setup is architecturally incompatible rather than just mistyped.
