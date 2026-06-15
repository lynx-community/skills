# Evals for `rspeedy-bundle-size`

These evals follow the [skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) methodology, adapted for a **decision/methodology skill**: the skill's job is to make the agent reach the *right call* on a bundle-size question, so each eval is a realistic scenario and the `expectations` check the **decision**, not a built artifact. No real rspeedy build is needed to run them — they're fast text evals.

## Files (same layout as the other Lynx skills' `evals/`)
- `evals.json` — the task eval set. Top-level `skill_name` + `description` + `evals[]`; each eval is `{ id, name, prompt, expected_output, expectations[], files[] }`, where `expectations` are plain-string criteria graded independently. These are full tasks that should exercise the skill when loaded (with-skill vs baseline), **not** trigger queries.
- `trigger_eval.json` — the description/trigger-optimization set: a flat array of `{ query, should_trigger }` (~12 should-trigger / ~10 should-not). The negatives are deliberately tricky: Lynx-ecosystem questions that belong to *other* skills (runtime perf, `lynx-typescript`, `reactlynx-class2fc`, `lynx-tasm-codec`, heap analysis, deep `rsdoctor-analysis`) plus wrong-platform bundle questions (React-web webpack, Next.js). Feed this to skill-creator's `scripts.run_loop --eval-set trigger_eval.json` to tune the SKILL.md `description`.

## Why these scenarios
Each targets a **counter-intuitive, evidence-backed lesson** from the skill — the places where a no-skill baseline tends to give generic or wrong advice:

| # | Scenario | Lesson under test |
|---|---|---|
| 1 | 14MB bundle, 10MB media, user wants to start with lodash | measure-first; media is the biggest lever, not JS micro-tree-shaking |
| 2 | "who imports this 1388-icon lib?" (no source import) | NO GUESS — trace the real module graph (de-concat + `reasons`), never narrate a chain |
| 3 | main-thread.js 87% locale JSON, wants to lazy-load it | never lazy-split first-screen content; fix i18n bloat via `extractStr`/host-injection |
| 4 | `import()` made .lynx.bundle bigger and didn't shake the SDK | `import()` regresses .lynx.bundle; use a macro guard; last-reference rule |
| 5 | `typeof NativeModules` runtime check still bundles the SDK | promote runtime check → compile-time `__BACKGROUND__` macro for DCE |
| 6 | "does lazy reduce total app size?" | lazy is a first-screen lever; it *increases* total |
| 7 | "give me a big list of more JS wins" on a tidy project | report the wall honestly; don't manufacture marginal diffs |
| 8 | optimize a Lynx app in a repo with `rush.json` | use the Rush command surface, not raw `pnpm build` |
| 9 | "retarget to newer ES to save bytes?" | ES targets are fixed engine constants; don't retarget |
| 10 | de-concat treemap shows 870KB icons / 21KB package.json | de-concat over-counts; quote only real `.lynx.bundle` deltas |

## Running (with-skill vs baseline)
For each eval, run two arms **in parallel** (don't stagger):
- **with_skill** — agent is given the active `SKILL.md` and the skill directory path (so it can read `references/`), then the eval `prompt`.
- **baseline** — a fresh agent given only the eval `prompt` (no skill).

This isolates the skill's lift. Save each arm's final answer per eval.

## Grading
Grade **each `expectations` entry independently** against an arm's answer. Use exactly these fields (skill-creator viewer convention):
```json
{ "text": "<the expectation criterion>", "passed": true, "evidence": "<verbatim span from the answer that satisfies/violates it>" }
```
Rules:
- `passed` only if the answer *actively makes* the decision the expectation describes (not merely "doesn't contradict it").
- `evidence` must be a real quote from the graded answer (or "" with `passed:false` if absent).
- Grade with-skill and baseline by the **same** rubric.

## Pass criteria (this harness)
- **with_skill expectation pass rate ≥ 0.90**, and
- **lift over baseline ≥ 25pp** (skill must demonstrably help, not just ride the base model).

Iterate the skill on failing expectations, re-run, repeat until both hold or progress stalls.
