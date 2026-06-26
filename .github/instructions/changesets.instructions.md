---
applyTo: "**"
---

# Changeset Instructions

- Pull requests that change publishable workspace packages must include a changeset.
- If a package change is metadata-only or otherwise does not need a release, run `pnpm changeset add --empty` and commit the generated empty changeset file.
- The CI changeset check runs `pnpm changeset status --since=origin/main`, so untracked changeset files do not count until they are added to git.
