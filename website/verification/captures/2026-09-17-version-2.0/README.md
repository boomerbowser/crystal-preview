# Baseline re-blessing: the preview said 1.0

Meridian reported that the interactive preview on port 4321 still referred to Crystal 1.0
and asked whether that was a later step. It was not a later step; it was an oversight. The
2.0 work had changed the system without changing what the system called itself.

## What was stale

- The header version pill on `index.html` read **Crystal 1.0**
- The footers on `index.html`, `motion.html` and all ten generated specification pages
- The opening sentence of `docs/principles.md`
- `$meta.version` in `tokens/crystal.tokens.json`, still `1.0.0`

While fixing the token version I also removed a stray top-level `version` key I had just
added to the DTCG file. That was wrong: in DTCG a top-level key without a `$` prefix is a
token group, so a bare string there is invalid. The version belongs in `$meta`.

## Why the baselines changed

Eight of the twelve reference frames differ, by between 0.15% and 1.1% of their pixels.
Every visibly changed pixel in `playground-light` falls inside a single region — x 671 to
864, y 15 to 55 — which is the header version pill and nothing else. `version-pill-after.png`
shows it now reading **Crystal 2.0**.

The four unchanged frames are `components-light`, `motion`, `catalogue` and `icons`, none
of which have the pill or the footer inside their captured area.

This is an intended, fully accounted-for change, so the baselines were re-blessed with
`npm run verify:visual -- --bless`.

## A note on the round-trip guard

Bumping `$meta.version` made `tools/build-tokens.cjs` refuse to write, because its
round-trip assertion requires that nothing differ between the DTCG source and the flat
token file. That guard is doing its job — it exists so a material value cannot change
unnoticed during restructuring — but a version string is metadata that is *supposed* to
change, and would otherwise make every release look like a regression. `version` now joins
`schemaNote` in the small set of keys stripped before comparison. The exemption is
deliberately narrow: two named metadata keys, nothing that participates in a colour, a
size or a duration.
