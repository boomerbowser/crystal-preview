# Forced colours — evidence

> **Superseded in part.** The leading selection mark visible in these frames was withdrawn at Meridian's direction later the same day, because it offset the very label it marked. Selection is label weight alone; see `../2026-09-17-light-and-rest-motion/README.md`. The frames are kept as the record of the run that produced them, not as a picture of how Crystal looks now.

Captured 17 September 2026, Chromium with `forced-colors: active` emulated in both the
light and dark high-contrast palettes.

## What was checked

| Check | Light | Dark |
| --- | --- | --- |
| Focus ring survives (box-shadow is discarded in forced colours) | 2px solid `Highlight` | 2px solid `Highlight` |
| Focus ring contrast against `Canvas` | 11.30:1 | 8.73:1 |
| Body text against `Canvas` | 21:1 | 21:1 |
| Elements still applying `backdrop-filter` | 0 | 0 |
| Selected segment label contrast (after fix) | 21:1 | 21:1 |

The focus ring matters most here: Crystal builds it from layered `box-shadow`, and forced
colours discards `box-shadow` entirely. The nine existing `forced-colors` blocks already
replaced it with an outline, and that outline correctly resolves to the system `Highlight`
in both palettes rather than an authored colour.

## Defect found and fixed

`forced-colours-dark.png` was captured before the fix and shows it: in the Appearance
segmented control, the selected **Light** segment renders as a solid black block with no
readable label.

The cause is not contrast arithmetic. `controls.css` styled the selected segment as
`background: Highlight; color: HighlightText`, which is the conventional pairing. But
Chromium paints an opaque **text backplate** in `Canvas` behind text runs in forced
colours, and that backplate sits above the element's own background. In the dark palette
`HighlightText` is black and `Canvas` is black, so the glyphs were painted black on a
black plate. `zoom-segmented-2x.png` shows the label reduced to a filled rectangle the
exact size of its text box — the shape of a backplate, not of letterforms.

Two candidates were tested against the live page:

- `candidate-B-forced-color-adjust-none.png` — legible, but `forced-color-adjust: none`
  opts the subtree out of forced colours altogether and restores Crystal's own colours.
  It only looks correct here because Crystal's cyan resembles this particular palette; on
  a user's custom high-contrast theme it would ignore the colours they chose. Rejected.
- `candidate-C-canvas-text-highlight-ring.png` — `CanvasText` on `Canvas` with a 2px
  `Highlight` ring at `-3px` offset. Legible by construction against the backplate, stays
  inside the system palette, and carries selection as a shape rather than a fill. Adopted.

This also makes the segmented control consistent with `.cr-dock`, which already used a
`Highlight` outline and no fill, and so never exhibited the defect.

`fixed-segmented-light.png` and `fixed-segmented-dark.png` show the result. The focus ring
sits outside the control and the selection ring inside it, so a focused selected item still
reads as both.

## Regression guard

The changed rule lives inside `@media (forced-colors: active)`, so it cannot affect normal
rendering — but that was verified rather than assumed.
`pre-fix-normal-light.png` and `post-fix-normal-light.png` were captured from the same
frame with the CSS reverted and reapplied, and compare identical:

    PASS  post-fix-normal-light.png: identical

## Files

- `forced-colours-light.png`, `forced-colours-dark.png` — full page, both palettes (dark is post-fix)
- `detail-controls-dark.png` — palette swatches and appearance control, pre-fix
- `zoom-segmented-group.png`, `zoom-segmented-2x.png` — the defect at element and device scale
- `candidate-B-*.png`, `candidate-C-*.png` — the two fixes tested
- `fixed-segmented-light.png`, `fixed-segmented-dark.png` — adopted fix, both palettes
- `pre-fix-normal-light.png`, `post-fix-normal-light.png` — normal-rendering regression guard

## Note on palette swatches

The six product-palette swatches become indistinguishable circles in forced colours, since
their only differentiator is the colour the palette strips. This is expected: the user has
asked for colour to be overridden. Selection remains conveyed without colour — the selected
swatch carries a 2px outline against 1px on the others, plus the selection rail — and every
swatch carries an accessible name (`Prism palette`, `Fuchsia palette`, …), so the
information is available both visually and non-visually.
