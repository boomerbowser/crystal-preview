# A type scale, and a frame that stops moving

Two changes, one of which is a gate improvement rather than a design one.

## The scale

Crystal specified a reading rhythm — Manrope at 16/24 — and no scale, so Crystal
React derived six steps of its own: three tables of ratios, leadings and trackings
living in one platform library where no other platform could see them. That is
CONTRACT §1 by another route, and the derivation has moved here.

Ratios rather than sizes, because the derivation is the design decision: each step
is a multiple of the reading size, so moving `typography.readingSize` moves the
whole scale instead of leaving six literals behind. The steps reach CSS as
`--cr-text-<step>-size`, `-leading` and `-tracking`, and density tightens leading
and never size.

Six `crystal-allow-literal` markers in the React library reading "pending a
type-scale token" are now tokens. Two more entered with it: `component.icon.size`
(20px, which is what Crystal's own reset has always drawn an icon at) and
`component.icon.action` (24px, the catalogue's size for the single icon inside an
icon button). Both were literals — one in the reset, one in prose.

No generated theme CSS changed for any existing token. The new properties are
additive; every frame stayed identical through the token work.

## The frame

`haze-in-resin` is clipped to the composition it photographs rather than to the
page it sits on.

It was anchored to a heading part-way down the materials documentation, so **any**
prose added above it moved the anchor to a different fractional scroll offset and
the whole page re-rasterised. Over this change and the two before it the frame was
re-blessed three times for reasons that had nothing to do with what it guards:
1826 visible pixels, then the same 1826, then 24 inside a single closing brace,
and finally 34408 when the offset happened to land near half a pixel.

A baseline that changes for reasons unrelated to what it guards is a baseline
nobody reads carefully, which is the failure mode this project has already met
five times. The frame's own `why` says it exists for "the recess that makes the
Haze fill read as the frame's content", so it now captures exactly that: 420×192
of Resin frame and recessed Haze, with the inset dark top edge and the light
bottom edge visible at full size rather than as part of a page.

The clip is `#haze-in-resin-demo`, an id added to the composition in the
documentation source. The frame is 1280×900 no longer, which is why the comparison
reports a dimension change rather than a pixel count — that is the intended
replacement, and the new baseline was looked at.

The other seventeen frames are byte-identical.
