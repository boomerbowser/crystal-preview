# Visual regression baselines

These eighteen PNGs are the committed baselines for the frame set in
[`../../website/verification/frames.json`](../../website/verification/frames.json).
They are generated, never hand-edited.

## Running the gate

    python3 tools/serve.py &                 # the frames are captured over HTTP
    npm run verify:visual                    # capture and compare; non-zero on any difference

`npm run capture:frames -- --out <dir>` captures without comparing, and
`--only <frame-id>` limits it to one frame.

## Why a tolerance exists, and why it is safe

Captures are not bit-identical between runs on the same machine: GPU rasterisation
dithers gradients by a channel step or two, which moved roughly a hundred pixels of
`playground-opaque` between two otherwise identical runs. The gate therefore forgives
up to 400 pixels differing by more than a channel delta of 2.

That allowance cannot hide a real change. `compare-captures.py` fails on **any** pixel
whose delta exceeds `--visible-delta` (24) no matter how large the allowance is, and
[`../../tests/visual-gate-contracts.py`](../../tests/visual-gate-contracts.py) proves
it: one black pixel on a grey field still fails with the allowance set to a million,
and a channel delta of 24 is forgiven where 25 is not, whatever the allowance says.

That file was cited here and did not exist. It was lost when this site moved to its
own repository, so for some time the safety argument for the only gate that looks at
Crystal's appearance rested on a proof nobody could run — which is D-13 in miniature:
the check was believed rather than executed. It is back, and CI runs it.
The gates elsewhere in this project (G1–G4) run the comparison in its default exact
mode, where nothing is forgiven.

## Re-blessing

Do not replace a baseline to make the gate quiet. The procedure is in
`frames.json` under `reblessing`; in short: look at both images, satisfy yourself the
change is intended, write down why in the capture directory's README, and commit the
replaced baselines in the same commit as the change that caused them.

    npm run verify:visual -- --bless

## Provenance

Captured with Chromium via `tools/capture-frames.mjs` at a device scale factor of 1.
Preferences are seeded into `localStorage` before the page's first script runs rather
than clicked through the interface, because clicking animates and an animation in
flight makes a capture depend on timing. Fonts are awaited before every screenshot.

## Re-blessed 21 September 2026 — and what each frame was

D-13 recorded this gate as red on nine frames for an unknown length of time, and
deliberately did not bless them: two of the nine differed *visibly* and nobody had
looked at them. They have now been looked at, one at a time, which is what the entry
asked for.

**`catalogue.png` — a real change, and a correct one.** All 2,626 visibly-changed
pixels fall in a single 15px band at `y 461–475`, and the band is one line of prose:
the page used to say the chapter is generated from `tokens/catalogue/` and now says
`core/tokens/catalogue/`. That is the repository restructure, which moved the library
into `core/`. The worst channel delta of 229 is dark text on a light ground, which is
what a text change looks like. The baseline predates the restructure.

**`playground-dark.png` — not a change.** 11,358 pixels past the visible threshold,
worst delta 52, spread across `x 404–1213, y 348–808` rather than clustered. Cropped
and magnified, the two densest regions — the card-stack illustration behind the
headline, and the segmented control — are indistinguishable. Both are multi-stop
gradients on a near-black ground, which is exactly where GPU rasterisation dithers,
and where a fixed absolute threshold of 24 corresponds to no visible difference at
all: the same channel step that is obvious on a light field is invisible at low
luminance. The threshold is right for the other seventeen frames and wrong for this
one, and rather than weaken it for everything, the frame is re-captured.

**The other seven** — `components-light`, `motion`, `playground-light`,
`playground-narrow`, `playground-opaque`, `playground-reduced-transparency`,
`playground-rtl` — had **no pixel past the visible threshold at all**, worst deltas
11 to 19. Sub-threshold drift of the kind a pixel baseline captured on one machine
always eventually reports on another.

`haze-in-resin.png` was replaced too and was never failing: `--bless` re-captures the
whole set rather than only the frames that differ. Worth knowing before reading a
blessing commit's diff.

**What changed so this cannot go unwatched again.** The gate was manual, and a manual
gate is one nobody runs — that is the specific way it stayed red. It now runs in CI
on every push, alongside `tests/visual-gate-contracts.py`, which proves the allowance
cannot hide what the gate is for.
