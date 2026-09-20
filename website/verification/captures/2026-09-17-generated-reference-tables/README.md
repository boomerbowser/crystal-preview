# Six more hand-maintained tables, generated

Meridian asked whether any other parts of the documentation were hand-maintained but would
be better generated. Six were, and one more was already stale before the question.

| Was | Now generated from |
| --- | --- |
| `motion-components.md` — a 54-row copy of the recipe catalogue | `tokens/motion-recipes.json` |
| `materials.md` — recommended defaults | `semantic.range.*`, `semantic.default.*` |
| `materials.md` — material recipe values (new table) | `tokens/crystal.json` resolved material values |
| `colors.md` — the six palette seeds | `primitive.palette.*` |
| `components.md` — the focus layer table | `--cr-focus-ring` in `assets/controls.css` |
| `accessibility.md` — the contrast figures | `validation/token-checks.json` |
| `icons.md` — the icon counts and grid | `assets/icons/manifest.json` |

Two of these were provably drifting. The recipe catalogue had already fallen five recipes
behind. The focus layer table had to be hand-corrected earlier the same day when the halo
spread was halved, and a table that needs hand-correcting is a table that will eventually
not get it.

The defaults table gained a **valid range** column, which was in the token descriptions all
along and had never been surfaced. The palette table gained companion and glow columns for
the same reason.

The contrast figures now carry the date of the run and the lowest normal-text result
alongside the lowest result of any kind — both computed from the record rather than
remembered. The full ISO timestamp was deliberately trimmed to the date: a generated file
that changes on every build churns its own diff and trains people to ignore it.

## What was deliberately not generated

Prose that quotes a value in context — "an 80% content fill with a 1.95px feather" — stays
prose. Generating values inline would wreck the writing, and the writing is the point of a
specification.

Those quotations can still go stale, so `tools/validate-docs.cjs` asserts the other
direction: every material recipe value, both engine versions, the recipe and category
counts, and the contrast total must appear in the chapter that documents them. Change a
token without touching the prose and `npm test` fails. Proven by moving Frost's diffusion
to 45px and watching it report `docs/materials.md: no mention of 45px`.

The check is one-directional and says so in its own header. It catches a token that moved
and prose that did not. It cannot catch a sentence that became wrong for some other reason,
and does not pretend to.

## Why three frames moved

`docs-menu-light` and `docs-menu-forced-colours` are `docs/materials.html`, which gained the
valid-range column and the material recipe table. `icons` is `docs/icons.html`, which gained
its source and grid table. All three are content additions; nothing about the shell,
the menu or the materials changed.

## Checks

- `npm test` now includes the documentation drift suite — 27 core contracts, 1,716 contrast
  cases, 59 recipes in 10 categories, 20 drift checks, 0 failures
- `tools/build-reference.cjs` is idempotent: a second run changes no byte
- `tools/validate.py` — 16 pages, 0 errors
- `npm run verify:visual` — 18 frames, three re-blessed for the content above
