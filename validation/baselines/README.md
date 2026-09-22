# Visual regression baselines

These twenty-three PNGs are the committed baselines for the frame set in
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

**The gate is still manual, and the attempt to fix that failed usefully.** It was
wired into CI on 21 September 2026 and taken out again the same hour. The run that
added it failed **16 of the 18 frames**, with channel deltas up to 255 and tens of
thousands of visibly-changed pixels — `docs-menu-forced-colours` at 46,058,
`icons.png` at 25,866 — and the frames that failed hardest are the text-heavy ones.
That is font rasterisation: these baselines are captured on a contributor's machine,
and a GitHub runner does not draw type the same way, so comparing them there measures
the font stack rather than Crystal.

**These baselines are therefore machine-specific**, which D-13 suspected and nobody
had demonstrated. Capture them where you compare them. The route to a CI gate is a
second baseline set captured *by* a runner and committed from one, and it is recorded
as D-15 in Crystal's tracker rather than half-built here.

`tests/visual-gate-contracts.py` does run in CI, because it compares synthetic PNGs it
generates itself and means the same thing everywhere.

## Re-blessed 21 September 2026 — the dock regains its Stone label backing

Eight frames: `playground-{light,dark,narrow,opaque,reduced-transparency,rtl}`
and `forced-colours-{light,dark}`. The cause is Crystal **D-16**: this site's
`controls.css` carried

```css
.cr-dock-inner{background:transparent;padding:0;isolation:auto;}
.cr-dock-inner::before{display:none;}
```

which switched off the Stone backing that `components.md` ("Stone label backing
… `.cr-dock-inner` shares the recipe"), `materials.md`'s prose and
`materials.md`'s table all require — the table puts "a Haze content fill, or
Stone if the backdrop is unknown" in its **Right** column. Suppressing it was a
regression of a documented material, and because the second selector matched the
class rather than the context it also blanked `.cr-dock-inner.cr-stone`, the
"Stone on Resin" specimen on `playground.html`.

**What the frames show.** In the six normal frames the dock gains the protected
label group that `components.md` names in its Resin-toolbar row: a Stone tray
behind the labels, 55% white with the 1.95px feather, inside the Resin pill.
Before the fix there was no protected label group at all. In the two
forced-colours frames the Stone layer stays hidden — the library suppresses
`.cr-dock-inner::before` there, as it should — and the only difference is
geometry, because removing the site's `padding:0` restores the library's
`padding:3px`. Both were checked on the running page before blessing:

```
forced-colors:none     padding:3px  ::before display:block  background:rgba(255,255,255,0.55)
forced-colors:active   padding:3px  ::before display:none
```

Every changed pixel is inside the dock: band y 617-688, x 403-829 on
`playground-light`. Nothing else in any frame moved.

## Five frames added 22 September 2026 — focus and scrollbars

Both were gaps the frame set described itself as covering and did not.

**Focus.** `playground-light`'s own `why` said it guards "the material hierarchy,
pill geometry and focus ring", and `forced-colours-light`'s said "the focus ring
must survive as an outline". Nothing in the frame set had ever held focus, so
neither guarded any ring at all. That is not a suspicion: 2.1.0 changed the
recipe from four halo layers to six, and all eighteen frames passed at **zero
tolerance**.

`focus-ring-light`, `focus-ring-dark` and `focus-ring-forced-colours` focus
`#open-dialog` before the shutter. `:focus-visible` follows keyboard modality, so
the harness presses Tab first and then *verifies* `el.matches(':focus-visible')`,
failing the frame if it does not — the same rule as the 404 guard: never bless a
frame that did not get the state it asked for.

**Scrollbars.** D-4 recorded that "headless Chromium paints no scrollbar at all,
so no reference frame contains one". That is a fact about a flag, not a browser:
Playwright pushes `--hide-scrollbars` whenever `headless` is true. Drop it and
Chromium paints a classic 15px bar. `scrollbar-resin` and `scrollbar-frost` opt
in with `"scrollbars": true`, which puts them on a second browser — the other
frames keep the flag, because a page-level screenshot that suddenly gained a
document scrollbar would reflow every one of them.

`.cr-scroll-resin` appears on this site only as escaped sample code, so the live
Resin scroller is `.cr-table-scroll`, and it overflows only when the viewport is
narrow. `scrollbar-resin` is therefore 390px wide, anchored to the
`#component-chip` heading rather than to an index, because `.cr-table-scroll`
matches thirty-two elements on that page.

### What these five were shown to catch

Each was mutated at the resolver and watched go red, then restored:

| Planted in `crystal.js` | Frames that failed |
| --- | --- |
| The two focus elevation layers withdrawn — exactly what 2.1.0 added | `focus-ring-light`, `focus-ring-dark` |
| Halo spreads back to the withdrawn 2/6/12/22 | `focus-ring-light`, `focus-ring-dark` |
| Resin scrollbar thumb 80% → 50% | `scrollbar-resin` |
| Frost scrollbar thumb from ink to primary | `scrollbar-frost` |
| One feather alpha 46% → 40% | **none — correctly** |

The last row is the gate working, not failing. A six-point alpha shift on one
feather moves a channel by about eight, and this gate fails only above
twenty-four; `tests/visual-gate-contracts.py` pins that boundary. A change too
small to see is a change this gate is not for. The contrast gate, at 1,788
checks across twelve palette-and-mode combinations, is what holds the alphas.

`focus-ring-forced-colours` did not fail on either halo mutation, which is also
correct: forced colours discards `box-shadow`, so that frame guards the outline
that survives it, not the halo that does not.

### The focus baselines are 2.0.0's, and that is the point

These were first captured against a working copy of 2.1.0 and then re-blessed
here against the published **2.0.0** the site actually installs. Exactly two
frames moved — `focus-ring-light` and `focus-ring-dark` — because 2.0.0's theme
exports a four-layer `--cr-focus-ring` and 2.1.0's exports six. Nothing else in
the set differed between the two libraries.

That is the gate catching the change it was built for, across a real version
difference rather than a planted one, five minutes after being told it could.
When 2.1.0 is published and `adopt-crystal-2.1.0` merges, these two frames will
move again, and the commit that moves them should say so — that is the whole
mechanism working as intended.

