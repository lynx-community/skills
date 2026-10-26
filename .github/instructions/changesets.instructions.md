---
applyTo: "**"
---

# Changeset Instructions

- Pull requests that change publishable workspace packages must include a changeset.
- If a package change is metadata-only or otherwise does not need a release, run `pnpm changeset add --empty` and commit the generated empty changeset file.
- Commit the changeset with the package changes. Read [the package PR workflow](../workflows/pkg-pr-new.yml) for the current comparison base and validation command.
