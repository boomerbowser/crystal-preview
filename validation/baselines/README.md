# Visual regression baselines

These twelve PNGs are the committed baselines for the frame set in
[`../frames.json`](../frames.json). They are generated, never hand-edited.

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
it: one black pixel on a grey field still fails with the allowance set to a million.
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
