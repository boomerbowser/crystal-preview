# Light, shadows that carry it, and materials that move at rest

Meridian cited JolyUI's Liquid Metal button as an illustration of "more motion", restated
the optical rules each material should follow, and separately directed that the selection
rail be removed. Both are recorded here because both touch every frame, and blessing the
same eighteen baselines twice in an hour would be wasted work.

## What the reference transfers

Liquid Metal's sweeping bands are anisotropic reflection, a metal phenomenon. Crystal is
glass: its optical model is edge lensing, and surface waves are already recorded as
rejected. What transfers is the behaviour: the surface is alive at rest, the light through
it is chromatic, and interaction adds energy to an effect that is already running.

Its shader runs at 0.6 at rest, 1 on hover and 2.4 on press. That is the part to copy, and
it contradicted what this repository had shipped hours earlier.

## What this changes in the specification

Ambient motion becomes the material's declared rest state. "Edges that appear to move on
their own" means at rest, by default. That contradicts `CONTRACT.md` §7 "never at rest"
and the memory's "nothing autoplays". Both are rewritten, with no exception carved out,
because the owner has authorised a specification change.

Reference frames seed ambient off, beside palette and mode, through a single
`data-ambient="off"` switch that disables both the CSS and the script paths. A moving
surface cannot be captured deterministically, so the gate photographs the material still.
That is a property of the camera rather than an exemption from the rule, and gate G8
enforces it: with WebGL2 absent and ambient off, every page must render exactly these
baselines.

Interaction energises the motion. The ambient tier shipped that morning paused every loop
on `pointerdown`, `keydown`, `focusin` and `wheel`. That was the wrong direction: a
material going still the moment it is touched reads as broken. Rest is 0.6, hover 1, press
2.4, decaying back after 900ms. The one exception is text entry, because a field being
typed into is the one place motion competes with the task, so ambient pauses on `focusin`
for a text field and nowhere else. WCAG 2.2.2 is satisfied by reduced motion and
`stopAmbient`; stopping on every click is not needed for it.

## Per material, with physics deciding "different ways"

Haze and Stone are defined by their feathered edge, so their rest motion is that edge
travelling outward and inward. `haze-settle`, `stone-contour` and `haze-tide` had been
authored that morning as opacity oscillations, and opacity pulsing does not move the edge.
They are boundary motion now, on the isolated paint layer, so the edge and its feather
travel together and the text above never moves. A recipe may declare the `layer` it paints
on; `CrystalMotion.ambient` honours it.

The motion is a uniform scale of a paint layer. The incompressibility rule governs the
two-argument squash and does not apply here: a boundary breathing outward changes the area
it covers, because it is an edge moving and not a fluid being squeezed.

Plastic emits light, because it is opaque and cannot refract it. It carries
`--cr-atmosphere-glow`, the palette's own glow at the intensity the active scheme's
atmosphere setting asks for, drifting across the foundation over 38 seconds. Only the
gradient's centre moves; nothing reflows and nothing above it repaints.

Shadows carry the light. The light a material refracts is the light that reaches the
surface beneath it, so a shadow is no longer neutral grey: the palette's companion mixes
into it at 34% in light mode and 40% in dark. Prism's shadow ink moves from
`rgba(39,24,68)` to `rgba(107,40,112)`. The mix is on the colour only. Each layer's alpha
is preserved exactly, because tinting a shadow must not also deepen it. The worst channel
delta across a reference frame is 13, below the visible-delta ceiling of 24, which no
change may cross. All six palettes were checked, and the 1,716 contrast cases are
unchanged at zero failures with the same 3.7157 minimum.

## The selection rail is gone

Meridian: "just like the underlines had to go, this side bar thing needs to go... this just
isn't in line with Crystal, is offsetting the label text, and must go."

It was in two places: `.cr-indicator[data-kind=selection]` for components, and `.menu-rail`
in the side menu. Both are removed, along with the palette-card variant that repositioned
it and the menu's compensating padding.

The rail existed to satisfy WCAG 1.4.1, which says selection must not rest on colour
alone. Removing it does not remove that obligation, and label weight already meets it:
weight is typographic rather than chromatic, and it survives every palette, dark mode and
colour vision difference. The rail was a second non-colour signal stacked on a sufficient
one, and it cost label alignment. In forced colours the `Highlight` ring is untouched, and
that is where the requirement applies most.

`component.selection.railWidth` and `railHeight` are deprecated in place and not deleted,
so adopters can migrate without breaking. The catalogue sources and all six chapters that
described the rail were updated with them.

## Why every frame moved

The shadow tint touches every material on every page, and the rail appeared in the menu
and in every segmented control and dock. All eighteen frames moved for that one reason and
were blessed once.

## Checks

- `npm test`: 27 core contracts, 1,716 contrast cases at 0 failures, 59 recipes in 10
  categories, 20 documentation drift checks
- `tools/validate.py`: 16 pages, 0 errors
- `npm run verify:interactions`: 12 cases, 0 failures
- Ambient verified in a real browser: rest 0.6, press 2.4, paused while typing, resumed on
  blur, painting on `::before`, and refused outright under reduced motion

A nineteenth reason, found afterwards. `haze-in-resin` is anchored at a section of
`materials.md`, and adding the Light chapter above it moved that anchor down the page. The
composition itself is unchanged; the frame shows the same thing from a different scroll
offset.

Gate G8 passed at 18 of 18 with WebGL2 unavailable and ambient off. That is the check that
keeps ambient an enhancement: every page renders correctly without it.

---

# The shader tier (task 26)

## Frost refracts colour

Frost's shader varied diffusion but was effectively monochrome. It now samples the same
field at three slightly separated points, one per channel, which resolves into a slow
warm-to-cool wander across the surface.

The separation is wide because of what the diffusion radius does. A narrow offset produces
a visible fringe, which is Resin's behaviour; a wide one produces a gradient of colour
temperature, which is what 40px of diffusion does to light. The diffusion radius decides
which is correct: turning Resin's dispersion down produces weak Resin, and never Frost.

No uniform was added. Per-channel sampling of an existing field gives dispersion without a
new input, and every new uniform is a contract change for three platforms.

## Interaction advances the clock

Ambient surfaces keep their own clock, and interaction advances it faster. Rest is 0.6,
hover 1, press 2.4, decaying after 900ms. That is what "faster light" physically means: the
light moves quicker, and there is no more of it. Raising brightness instead would have
been the wrong translation.

## Bounded, because a browser has few contexts

Chromium starts discarding WebGL contexts around sixteen and a Crystal page has dozens of
material surfaces. Ambient shaders are capped at six, given only to surfaces intersecting
the viewport, and released on `visibilitychange`. Haze, Stone and Plastic never take a
context: their rest motion is CSS, which is cheap enough to run everywhere.

## Calibrated against what a person can see

The first ambient Frost measured a worst-channel delta of 3 against a still surface. It
attached, ran and passed every check, and it could not be seen. That is the same failure
as the eleven hollow recipes and as `hover` at 1.2%. Raising the intensity moves the delta
to 11, where the shader's own alpha ceiling takes over. Past that point nothing changes, so
the figure is the material's low-amplitude rule holding, and no one chose it by eye.

## Two gates, still green

`verify:visual` is 18 of 18 with ambient shaders live, because captures disable ambient.
Gate G8 (WebGL2 unavailable and ambient off) is 18 of 18, which keeps the whole tier an
enhancement that no page depends on.

A bug in the probe, recorded so it is not rediscovered: the first compile check reported
all four shaders refused. The cause was an 800px viewport, where the Frost side menu
collapses to `display:none` and `attach` correctly refuses a zero-size element. The
runtime was right and the test was wrong.
