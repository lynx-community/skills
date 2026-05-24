# Troubleshooting

Read this file when Lynx UI guidance or generated code is failing because of imports, setup, compatibility, snippet drift, or type mismatches.

## Debugging order

1. Confirm the chosen package matches the intended usage.
2. Confirm the generated pattern matches a real official Lynx UI docs page.
3. Confirm the issue is not caused by rewriting an official example too far away from the source pattern.
4. Confirm whether the issue is really a ReactLynx architecture problem.
5. Confirm whether the issue is really a Lynx TypeScript problem.

## Common failure mode: snippet drift

A frequent failure mode is starting from a real Lynx UI example and then rewriting it too far into generic React structure, local styling shortcuts, or a different animation model. When that happens, pull the answer back toward the official snippet shape first.

## Troubleshooting checklist

- Does the package import match the installation advice?
- Does the component choice map to a real official docs page?
- Did the answer preserve Luna tokens if the task was about theming?
- Did the answer explicitly choose motion vs motion-mini if animation was involved?
- Did the code assume unsupported web-only APIs?

## Escalation

- If the issue is architectural, consult `reactlynx-best-practices`.
- If the issue is type/config related, consult `lynx-typescript`.

## Output style

- Name the most likely mismatch.
- Point back to the official docs page that should anchor the fix.
- Keep the fix close to the official Lynx UI pattern before proposing deeper rewrites.
