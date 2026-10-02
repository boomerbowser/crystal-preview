# Visual regression baselines

These twenty-three PNGs are the committed baselines for the frame set in
[`../../website/verification/frames.json`](../../website/verification/frames.json).
They are generated and must not be edited by hand.

## Running the gate

    python3 tools/serve.py &                 # the frames are captured over HTTP
    npm run verify:visual                    # capture and compare; non-zero on any difference

`npm run capture:frames -- --out <dir>` captures without comparing, and
`--only <frame-id>` limits it to one frame.

## Why a tolerance exists, and why it is safe

Two captures taken on the same machine are not bit-identical. GPU rasterisation
dithers gradients by a channel step or two, which moved roughly a hundred pixels of
`playground-opaque` between two otherwise identical runs. The gate therefore forgives
up to 400 pixels that differ by more than a channel delta of 2.

The allowance cannot hide a visible change. `compare-captures.py` fails on any pixel
whose delta exceeds `--visible-delta` (24), however large the allowance is.
[`../../tests/visual-gate-contracts.py`](../../tests/visual-gate-contracts.py) tests
this: one black pixel on a grey field fails with the allowance set to a million, and
a channel delta of 24 is forgiven where 25 is not.

This README cited that file while the file did not exist. It was lost when this site
moved to its own repository, so for some time nobody could run the proof behind the
only gate that looks at Crystal's appearance. D-13 records the same failure at a
larger scale: a check that was believed and not executed. The file has been restored,
and CI runs it.
The gates elsewhere in this project (G1 to G4) run the comparison in its default
exact mode, which forgives nothing.

## Re-blessing

Do not replace a baseline to make the gate pass. The procedure is in `frames.json`
under `reblessing`. Look at both images, confirm that the change is intended, write
the reason in the capture directory's README, and commit the replaced baselines in
the same commit as the change that caused them.

    npm run verify:visual -- --bless

## Provenance

The frames are captured with Chromium via `tools/capture-frames.mjs` at a device
scale factor of 1. Preferences are seeded into `localStorage` before the page's first
script runs. They are not clicked through the interface, because a click animates,
and an animation in flight makes a capture depend on timing. The harness waits for
fonts before every screenshot.

## Re-blessed 21 September 2026: what each frame was

D-13 recorded this gate as red on nine frames for an unknown length of time. It did
not bless them, because two of the nine differed visibly and nobody had looked at
them. Each of the nine has now been examined individually, as the entry asked.

**`catalogue.png`.** This frame changed, and the change is correct. All 2,626
visibly changed pixels fall in a single 15px band at `y 461–475`, and the band is one
line of prose. The page used to say the chapter is generated from `tokens/catalogue/`
and now says `core/tokens/catalogue/`. The cause is the repository restructure, which
moved the library into `core/`. The worst channel delta of 229 is dark text on a
light ground, as expected for a text change. The baseline predates the restructure.

**`playground-dark.png`.** This frame did not change. 11,358 pixels are past the
visible threshold, with a worst delta of 52, and they are spread across
`x 404–1213, y 348–808` without a cluster. The two densest regions are the card-stack
illustration behind the headline and the segmented control. Cropped and magnified,
the baseline and the capture are indistinguishable in both regions. Both are
multi-stop gradients on a near-black ground. GPU rasterisation dithers there, and a
channel step that is obvious on a light field is invisible at low luminance, so a
fixed absolute threshold of 24 corresponds to no visible difference. The threshold is
right for the other seventeen frames and wrong for this one. The frame was
re-captured so that the threshold did not have to be weakened for every frame.

**The other seven.** `components-light`, `motion`, `playground-light`,
`playground-narrow`, `playground-opaque`, `playground-reduced-transparency` and
`playground-rtl` had no pixel past the visible threshold, with worst deltas of
11 to 19. This is the sub-threshold drift that a pixel baseline captured on one
machine eventually reports on another.

`haze-in-resin.png` was replaced too, although it was never failing, because `--bless`
re-captures the whole set and not only the frames that differ. Expect this when you
read the diff of a blessing commit.

**The gate is still manual.** It was wired into CI on 21 September 2026 and taken out
again the same hour. The run that added it failed 16 of the 18 frames, with channel
deltas up to 255 and tens of thousands of visibly changed pixels:
`docs-menu-forced-colours` at 46,058 and `icons.png` at 25,866. The frames that
failed hardest are the text-heavy ones, which identifies the cause as font
rasterisation. These baselines are captured on a contributor's machine, and a GitHub
runner draws type differently, so a comparison on the runner measures the font stack
and not Crystal.

**These baselines are therefore machine-specific.** D-13 suspected this, and nobody
had demonstrated it before this run. Capture baselines where you compare them. A CI
gate needs a second baseline set, captured by a runner and committed from one. That
work is recorded as D-15 in Crystal's tracker, and no part of it was built here.

`tests/visual-gate-contracts.py` does run in CI. It compares synthetic PNGs that it
generates itself, so its result means the same thing on every machine.

## Re-blessed 21 September 2026: the dock regains its Stone label backing

Eight frames changed: `playground-{light,dark,narrow,opaque,reduced-transparency,rtl}`
and `forced-colours-{light,dark}`. The cause is Crystal D-16. This site's
`controls.css` carried these rules:

```css
.cr-dock-inner{background:transparent;padding:0;isolation:auto;}
.cr-dock-inner::before{display:none;}
```

They switched off the Stone backing. Three places require that backing:
`components.md` ("Stone label backing … `.cr-dock-inner` shares the recipe"), the
prose of `materials.md`, and the table in `materials.md`, which puts "a Haze content
fill, or Stone if the backdrop is unknown" in its **Right** column. Suppressing the
backing regressed a documented material. The second selector matched the class and
not the context, so it also blanked `.cr-dock-inner.cr-stone`, the "Stone on Resin"
specimen on `playground.html`.

**What the frames show.** In the six normal frames the dock gains the protected
label group that `components.md` names in its Resin-toolbar row: a Stone tray
behind the labels, 55% white with the 1.95px feather, inside the Resin pill.
Before the fix the dock had no protected label group. In the two forced-colours
frames the Stone layer stays hidden, because the library correctly suppresses
`.cr-dock-inner::before` there. The only difference in those two frames is geometry:
removing the site's `padding:0` restores the library's `padding:3px`. Both states
were checked on the running page before blessing:

```
forced-colors:none     padding:3px  ::before display:block  background:rgba(255,255,255,0.55)
forced-colors:active   padding:3px  ::before display:none
```

Every changed pixel is inside the dock, in the band y 617 to 688, x 403 to 829 on
`playground-light`. Nothing else moved in any frame.

## Five frames added 22 September 2026: focus and scrollbars

The frame set described itself as covering both, and covered neither.

**Focus.** The `why` of `playground-light` said it guards "the material hierarchy,
pill geometry and focus ring", and the `why` of `forced-colours-light` said "the
focus ring must survive as an outline". No frame in the set had ever held focus, so
neither frame guarded a ring. This was demonstrated: 2.1.0 changed the recipe from
four halo layers to six, and all eighteen frames passed at zero tolerance.

`focus-ring-light`, `focus-ring-dark` and `focus-ring-forced-colours` focus
`#open-dialog` before the screenshot is taken. `:focus-visible` follows keyboard
modality, so the harness presses Tab first and then checks
`el.matches(':focus-visible')`. If the check is false, the frame fails. The 404 guard
follows the same rule: never bless a frame that did not get the state it asked for.

**Scrollbars.** D-4 recorded that "headless Chromium paints no scrollbar at all,
so no reference frame contains one". The cause is a Playwright flag and not the
browser: Playwright pushes `--hide-scrollbars` whenever `headless` is true. Without
the flag, Chromium paints a classic 15px bar. `scrollbar-resin` and `scrollbar-frost`
opt in with `"scrollbars": true`, which puts them on a second browser. The other
frames keep the flag, because a document scrollbar in a page-level screenshot would
reflow every one of them.

`.cr-scroll-resin` appears on this site only as escaped sample code, so the live
Resin scroller is `.cr-table-scroll`, and it overflows only when the viewport is
narrow. `scrollbar-resin` is therefore 390px wide. It is anchored to the
`#component-chip` heading and not to an index, because `.cr-table-scroll` matches
thirty-two elements on that page.

### What these five were shown to catch

Each change below was planted in the resolver, the listed frames were seen to fail,
and the change was then reverted:

| Planted in `crystal.js` | Frames that failed |
| --- | --- |
| The two focus elevation layers withdrawn, which is exactly what 2.1.0 added | `focus-ring-light`, `focus-ring-dark` |
| Halo spreads back to the withdrawn 2/6/12/22 | `focus-ring-light`, `focus-ring-dark` |
| Resin scrollbar thumb from 80% to 50% | `scrollbar-resin` |
| Frost scrollbar thumb from ink to primary | `scrollbar-frost` |
| One feather alpha from 46% to 40% | None, which is correct |

The last row is the expected result. A six-point alpha shift on one feather moves a
channel by about eight, and this gate fails only above twenty-four.
`tests/visual-gate-contracts.py` pins that boundary. This gate does not cover a
change too small to see. The contrast gate holds the alphas, with 1,788 checks
across twelve palette-and-mode combinations.

`focus-ring-forced-colours` did not fail on either halo mutation, which is also
correct. Forced colours discards `box-shadow`, so that frame guards the outline,
which survives forced colours, and cannot see the halo.

### The focus baselines are 2.0.0's

These were first captured against a working copy of 2.1.0 and then re-blessed
here against the published 2.0.0, which is the version the site installs. Exactly
two frames moved, `focus-ring-light` and `focus-ring-dark`, because the 2.0.0 theme
exports a four-layer `--cr-focus-ring` and the 2.1.0 theme exports six layers.
Nothing else in the set differed between the two libraries.

The gate caught the change it was built for, across a real difference between two
versions of the library and not a planted one, five minutes after the planted
changes showed that it could. When 2.1.0 is published and `adopt-crystal-2.1.0`
merges, these two frames will move again, and the commit that moves them should say
so.
