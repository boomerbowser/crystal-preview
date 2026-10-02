# Six more hand-maintained tables, generated

Meridian asked whether any other parts of the documentation were hand-maintained but would
be better generated. Six were, and one more was already stale before the question.

| Was | Now generated from |
| --- | --- |
| `motion-components.md`: a 54-row copy of the recipe catalogue | `tokens/motion-recipes.json` |
| `materials.md`: recommended defaults | `semantic.range.*`, `semantic.default.*` |
| `materials.md`: material recipe values (new table) | `tokens/crystal.json` resolved material values |
| `colors.md`: the six palette seeds | `primitive.palette.*` |
| `components.md`: the focus layer table | `--cr-focus-ring` in `assets/controls.css` |
| `accessibility.md`: the contrast figures | `validation/token-checks.json` |
| `icons.md`: the icon counts and grid | `assets/icons/manifest.json` |

Two of these were already drifting. The recipe catalogue had fallen five recipes behind.
The focus layer table had to be corrected by hand earlier the same day, when the halo
spread was halved.

The defaults table gained a valid range column. The ranges were in the token descriptions
all along and had never been shown. The palette table gained companion and glow columns for
the same reason.

The contrast figures now carry the date of the run, and the lowest normal-text result
beside the lowest result of any kind. Both are computed from the record. The full ISO
timestamp is trimmed to the date, because a generated file that changes on every build
produces a diff on every build, and people learn to ignore it.

## What was deliberately not generated

Prose that quotes a value in context, such as "an 80% content fill with a 1.95px feather",
stays prose. Generating values inline would damage the writing, and the writing is what a
specification is for.

Those quotations can still go stale, so `tools/validate-docs.cjs` asserts the other
direction: every material recipe value, both engine versions, the recipe and category
counts, and the contrast total must appear in the chapter that documents them. If a token
changes and the prose does not, `npm test` fails. This was proven by moving Frost's
diffusion to 45px, after which the check reported `docs/materials.md: no mention of 45px`.

The check works in one direction, and its own header says so. It catches a token that
moved while the prose stayed. It cannot catch a sentence that became wrong for any other
reason.

## Why three frames moved

`docs-menu-light` and `docs-menu-forced-colours` are `docs/materials.html`, which gained the
valid-range column and the material recipe table. `icons` is `docs/icons.html`, which gained
its source and grid table. All three are content additions. The shell, the menu and the
materials did not change.

## Checks

- `npm test` now includes the documentation drift suite: 27 core contracts, 1,716 contrast
  cases, 59 recipes in 10 categories, 20 drift checks, 0 failures
- `tools/build-reference.cjs` is idempotent: a second run changes no byte
- `tools/validate.py`: 16 pages, 0 errors
- `npm run verify:visual`: 18 frames, three re-blessed for the content above
