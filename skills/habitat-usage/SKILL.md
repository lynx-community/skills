---
name: habitat-usage
description: Guidance on using Habitat to manage multi-repo source and asset dependencies via .habitat/DEPS and hab sync, plus troubleshooting common sync failures.
---

# Habitat Usage Guide

Habitat is a dependency-sync tool for mono-repo-like layouts built from multiple Git repos and asset downloads. This skill provides setup guidance, copy-pastable config snippets, and a troubleshooting checklist for common sync failures.

## When to Apply

- Setting up a “main repo + dependency repos/assets” workspace using `.habitat` + `DEPS`
- Adding or changing dependency types: git repos, nested solutions, HTTP downloads, or custom actions
- Debugging `hab sync` failures related to config, auth, network, or integrity checks

## Troubleshooting Inputs

When sync fails (fetch errors, permission issues, timeouts), collect:

- Habitat version and distribution (`./hab` wrapper in repo, `hab.pex`, etc.)
- OS and architecture (darwin/windows/linux + arm64/x86_64)
- The exact command and full error output (do not paste any secrets)
- Relevant config snippets:
  - `.habitat`
  - `DEPS` (or the file pointed to by `deps_file` in `.habitat`)

## Installation and Versioning

Prefer committing the Habitat wrapper (`hab`) and config files (`.habitat`, `DEPS`) into the repository so developers and CI use the same version and configuration.

Avoid downloading `releases/latest` in automation, because it is not reproducible. Instead, pin to a specific release version (tag) and keep that pinned version consistent across developers and CI.

```bash
HABITAT_VERSION="0.3.145"
curl -L -o hab "https://github.com/lynx-family/habitat/releases/download/${HABITAT_VERSION}/hab"
chmod +x hab
```

If you just want to try Habitat locally (not recommended for CI), you can download the latest release:

```bash
curl -L -o hab "https://github.com/lynx-family/habitat/releases/latest/download/hab"
chmod +x hab
```

If you need integrity verification, pin an expected SHA-256 for `hab` in your repo/CI and verify after download:

```bash
EXPECTED_SHA256="<fill-me>"

if command -v shasum >/dev/null 2>&1; then
  echo "${EXPECTED_SHA256}  hab" | shasum -a 256 -c -
else
  echo "${EXPECTED_SHA256}  hab" | sha256sum -c -
fi
```

## Multi-Repo Setup (solutions + deps)

### 1) Generate `.habitat` (solution config)

Generate the Habitat config at the main repo root:

```bash
./hab config <repo remote uri>
```

`.habitat` describes one or more solutions. Minimal example:

```python
solutions = [
    {
        "name": ".",
        "deps_file": "DEPS",
        "url": "git@github.com:namespace/repo.git",
    }
]
```

Fields:

- `name`: solution name, typically `"."` for the main repo
- `deps_file`: dependency manifest path (relative to the main repo root)
- `url`: the main repo remote URL (used by the tool/CI)

### 2) Write `DEPS` (dependency manifest)

In `DEPS`, define `deps = { ... }`. The key is the destination path in the main repo, and the value describes the dependency type and parameters.

#### 2.1 git deps (source repositories)

```python
deps = {
    "lib/example": {
        "type": "git",
        "url": "git@github.com:namespace/lib.git",
        "branch": "dev",
    }
}
```

Notes:

- Prefer stable refs (e.g., commit) for reproducibility; use branches when you want rolling updates.
- If the destination directory already exists and contains local changes, decide whether overwriting is acceptable before syncing.

#### 2.2 solution deps (nested solutions)

If a dependency has its own dependency tree, you can bring it in as a solution and sync recursively:

```python
deps = {
    "third_party/some_solution": {
        "type": "solution",
        "url": "git@github.com:namespace/solution_repo.git",
        "branch": "main",
        "deps_file": "DEPS",
    }
}
```

#### 2.3 http deps (assets/archives/binaries)

Use this to download archives, toolchains, model files, etc. Prefer providing integrity checks for verifiability and reproducibility:

```python
deps = {
    "third_party/tooling": {
        "type": "http",
        "url": "https://example.com/tooling.zip",
        "sha256": "SHA256_HEX",
    }
}
```

#### 2.4 action deps (custom sync actions)

Use this to run extra steps during sync (generate files, copy assets, apply patches, etc.). Example:

```python
def example_function():
    from pathlib import Path
    import shutil

    dest_dir = Path("scripts/sync_something")
    dest_dir.mkdir(parents=True, exist_ok=True)
    src = dest_dir / "input.txt"
    dst = dest_dir / "output.txt"
    src.write_text("example\n", encoding="utf-8")
    shutil.copyfile(src, dst)


deps = {
    "scripts/sync_something": {
        "type": "action",
        "function": example_function,
    }
}
```

## Sync Dependencies (hab sync)

Run at the main repo root:

```bash
./hab sync .
```

After sync, dependencies are materialized into the paths specified by the keys in `DEPS`.

## Track Config in Version Control

Commit the wrapper and config files to enable one-command bootstrapping for developers and CI:

```bash
git add hab .habitat DEPS && git commit -m "Add habitat to manage dependencies."
```

## FAQ / Common Failures

### 1) git permission/auth failures

Symptoms:

- Errors like `Permission denied`, `Authentication failed`, or `Could not read from remote repository`

Fix:

- Ensure the dependency `url` protocol matches your environment (SSH/HTTPS).
- For SSH, confirm your SSH key is configured and has access to the target repo.
- In CI, confirm the runner is provisioned with the right credentials.

### 2) http integrity check failures (sha256 mismatch)

Symptoms:

- Download succeeds but integrity verification fails

Fix:

- Check whether `url` content changed or redirects to different content.
- Recompute sha256 for the actual artifact and update `sha256` in `DEPS`.
- If the URL is rolling (e.g., “latest”), prefer an immutable, versioned URL.

### 3) Sync hangs/timeouts

Fix:

- Identify which dependency is slow (temporarily comment out others and bisect).
- Check proxy settings, DNS, and network reachability.
- For large git deps, consider pinning to a commit and reducing unnecessary history (if supported by your setup).

## Response Format (when assisting users)

When a user asks for help configuring deps, fixing errors, or speeding up sync, respond in this order:

1) Conclusion first (root cause + fix)
2) Minimal copy-pastable commands/snippets (`.habitat` / `DEPS` / `./hab sync .`)
3) Call out risky operations (overwriting local dirs, rolling deps harming reproducibility, etc.)
4) If it can still fail, list the next required inputs (version, full error log, relevant config snippets)
