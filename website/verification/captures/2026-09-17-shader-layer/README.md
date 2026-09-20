# The optical shader layer — evidence

Captured 17 September 2026, Chromium with WebGL2.

## What the layer is

A transparent canvas over a surface, composited with `mix-blend-mode`, painting only
while a motion is in flight. It is an enhancement of an already-correct material and is
never required: every surface renders completely without it.

## Two corrections worth recording

**The optical model was wrong the first time.** The initial implementation radiated
concentric ripples from the contact point. Meridian rejected it, and the rejection was
correct: that is what water does when something is dropped into it, and it read as a pond
rather than as a solid transparent material. Contemporary glass interfaces work the other
way round — the interior is shrunk and the edges stretched outward, so refraction is
concentrated in a band just inside the boundary and the centre stays clear enough to read
through. Glass does not oscillate; it bends light where it curves, which is at its rim.

The rebuilt shader derives everything from a signed-distance field: a steep edge-lens
falloff, a defined bright edge line, a specular band that tracks the direction of travel
rather than sitting still, and chromatic separation only where the lens is steep.
`resin-liquid-glass.png` is the result.

**The blend mode was a no-op.** The first version used `screen`, then `overlay`, and
measured a worst channel delta of 5 — effectively invisible. Neither is a mistake in the
shader: on a white surface both are mathematically inert. Overlay resolves to
`1 - 2(1-b)(1-s)`, which is `1` for *every* source colour when the backdrop is white, so
the compositor was discarding a layer that was painting correctly the whole time.
`hard-light` swaps the operands and lets the shader's own luminance decide — below
mid-grey it multiplies and darkens, above it screens and brightens — which is also what a
curved transparent surface does. The shader's output is centred on 0.5 for exactly this
reason. Worst delta went from 5 to 65.

## Measured properties

| Property | Result |
| --- | --- |
| All four shaders compile and link on WebGL2 | yes |
| Refraction visibly changes the surface | 77.3% of pixels, worst channel delta 65 |
| Caustics fall as sparse arcs, not a wash | 12.3% of pixels, 241 visibly changed |
| **Label glyphs with the layer on vs off** | **identical** |
| Detaching restores the resting surface | identical |
| Gate G6: all 12 baselines with WebGL2 blocked | 12 of 12 identical |

The label result is the one that matters most. The optical layer sits at a negative
`z-index` inside an isolated stacking context, which places it between the material's
background and its content — where light physically belongs. An earlier version appended
the canvas above the content, which would have put a translucent wash over text whose
contrast is verified. Crystal does not trade verified contrast for an effect, so the
label's own pixels are compared with the layer on and off and must be identical.

The white plate behind the label in these captures is Crystal's Stone material doing its
documented job: "label retains its own crisp paint."

## A calibration note

The caustic scale had to be re-derived after the optical model changed. The constant was
tuned for the old radial wave field, whose second derivatives were orders of magnitude
larger; against the edge-lens field it produced values around 0.0007 and the caustics were
invisible. The divergence peak was measured at 7.74 for the current lens profile and the
scale set from that, rather than guessed again.

## Files

- `resin-liquid-glass.png` — edge lensing, specular band, defined edge
- `resin-caustics.png` — sparse arcs along the rim
- `resin-resting.png`, `resin-after-detach.png` — the resting surface, before and after
- `label-without-shader.png`, `label-with-shader.png` — the contrast guarantee
