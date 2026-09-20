# Resin at rest: a lens pinned open

Meridian reported "another resin-on-resin issue where the neumorphic effects that
apply exclusively to Haze and Stone are applied directly to Resin", with an
embossed indent inside every Resin control and a fill leak on the Haze card.

It was neither Resin-on-Resin nor the Haze recess rule. Both were ruled out by
measurement before anything was changed: the recess selector matches exactly one
element on the whole site, and removing `.cr-stone` from the specimen left the
emboss untouched. Blocking `motion-shaders.js` removed it completely.

The cause is the ambient Resin shader added in 021e0a0. It was attached with
`progress: 1` — not a rest state but the peak of a press — so `edgeLens` painted
a full-strength band a fifth of the panel deep, with its own `rim * 0.13` dark
inner shade, permanently, on every Resin surface. `intensity: 2.2` had been
calibrated against Frost's alpha ceiling and drove Resin's `hard-light` layer
straight to its 0.72 clamp. A second fault compounded it: panel geometry was
measured in 0..1 uv, so on a 216x113 control the lens band was twice as deep
along the top edge as along the side and its contour could not follow the element.

## Why three gates were green

- `verify:visual` sets `data-ambient=off` on every frame, so no reference frame
  had ever contained an ambient surface.
- The material specimens sit far below the fold of every 1280x900 frame.
- `validate-motion` checks that recipes move. A shader is not a recipe.

## New frames

Both photograph the rest state with `data-ambient-clock` pinned at 6.5s, and both
clip to a specimen rather than the viewport.

| Frame | What it guards |
| --- | --- |
| `materials-at-rest` | Plastic, Frost and Resin side by side, each holding a Stone label. The regression is unmissable here: the Resin card's label became a glowing magenta well inside a multi-ring emboss while its two neighbours stayed clean. |
| `resin-dock-at-rest` | Resin and Frost in one composition with a Stone label inside the Resin frame. Guards that an optical rest layer stays at the rim and never reaches the surface a label is read on. |

## Measured, not judged by eye

`npm run audit:ambient` differences each surface against a still capture of
itself. Worst-channel delta:

| | rim mean | rim max | interior mean |
| --- | --- | --- | --- |
| as shipped in 021e0a0 | 48.73 | 81 | 9.35 |
| Resin at rest, now | 1.90 | 34 | 0.02 |
| Frost at rest, now | 1.51 | 26 | 0.80 |

Limits are interior mean 2.0, rim mean 8.0, rim max floor 6. Each has been shown
to fail on demand: reintroducing `progress: 1` trips the rim mean at 11–23, and a
first attempt at the fix that measured rim max 2 was invisible to a person and
trips the floor. The floor exists because the opposite failure is just as real.

Nothing about the material specification changed. The press response at
`progress: 1` is identical: the new `thickness` term resolves to the original
0.20 there, and the geometry correction only makes radius and band depth mean the
same thing on both axes.

## Second pass: the animation tier had the same fault

Fixing the shader and then starting `haze-settle` and `stone-settle` reproduced the
original mistake one tier down — motion shipped without anyone looking at it. Three
things were wrong, and each was found by measurement rather than by reading the code:

- **`data-ambient-clock` froze only the shader.** The Web Animations tier ran at whatever
  phase the capture landed on. The frames passed because a sub-pixel shrink falls under
  the comparison tolerance, which is stability by luck, not a gate. `ambient()` now pins
  and pauses at the same clock, and a pinned clock outranks interaction energy.
- **`stone-settle` was animating a layer that cannot paint.** `.cr-dock-inner` carries
  `.cr-stone`, but `controls.css` sets `display:none` on its `::before`, because the dock
  frame's own Haze fill at `inset:8px` already does that job. The animation attached,
  reported itself through `getAnimations()`, and rendered nothing at any amplitude —
  including a deliberate `scale(0.6)` test. `ambient()` now refuses a layer whose computed
  `content` or `display` is `none`, and the material mapping is corrected: a dock, a
  segmented control and a tab strip breathe with **Haze**, because that is what their
  fill is.
- **One clock is a phase-dependent measurement.** `stone-settle` runs 1600ms alternating,
  so a 3200ms cycle puts t=6.5s just 100ms in, at identity. Measured there it read as
  invisible at *every* amplitude tested, including obviously wrong ones. The audit now
  samples two well-separated phases, takes presence from the better of them, and reports
  the travel between them — which for an edge is the more direct question.

The audit also measures one tier at a time. A Resin panel usually has a Haze or Stone fill
sitting on it, and that fill now breathes too, so differencing the panel against a still
capture attributed the label's movement to the panel's shader: the Resin interior reading
flapped between 0.02 and 2.37 across runs. Shader surfaces are captured with their subtree
marked `data-cr-motion="manual"`, the opt-out `ambientAll` already honours.

Final, with both tiers covered and isolated:

| surface | rim max | rim mean | interior mean | travel |
| --- | --- | --- | --- | --- |
| Resin control plane | 34 | 1.90 | 0.02 | 11 |
| Resin floating dock | 27 | 2.24 | 1.26 | 7 |
| Resin stage dock | 25 | 1.49 | 0.00 | 7 |
| Frost study pane | 26 | 1.51 | 0.80 | 7 |
| Haze content fill | 19 | 1.14 | 0.04 | 15 |
| Stone label backing | 9 | 1.95 | 0.00 | 9 |

`materials-at-rest` moves by 750 pixels at a worst delta of 7: the three Stone backings
now sit at a defined phase instead of an arbitrary one. Looked at before blessing.

Stone's amplitude was raised from 1.4% to 3.2% because 1.4% measured below the visibility
floor on a label-sized pill. At 3.2% the backing draws in while still clearing the label
with margin, and the text stays crisp — the interior figure of 0.00 is the evidence that
what moves is the edge and not the fill, which is the rule Haze and Stone exist to keep.
