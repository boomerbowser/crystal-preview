# Resin never contains Resin

Meridian observed instances of Resin stacked on Resin in the preview screenshots and set the
rule: any layer above a Resin element — a label, a badge, an indicator — is a **Haze content
fill**. Resin itself is not to be adjusted to compensate, because that would disturb a
material specification.

The rule matters because it is the specific failure translucent interfaces are most often
criticised for: a 20px backdrop blur reading through another 20px backdrop blur, until
nothing on the surface is legible. Haze exists for exactly this job — an 80% fill with a
1.95px feather on the background layer only, leaving text crisp.

## What was found

`tools/audit-materials.mjs` checks the **rendered DOM**, not the stylesheet, because an
element does not need a Resin class to be Resin in substance; it only needs a
`backdrop-filter`. The audit classifies each blurring element by its blur radius against the
live `--cr-resin-blur` and `--cr-frost-blur` tokens.

That distinction is essential. Crystal's hierarchy is **Plastic → Frost → Resin**, so Resin
inside Frost is the *intended* layering and must not be reported. A first version of the
audit flagged any blur inside any blur and produced ten findings, six of which were the
hierarchy working correctly.

Four genuine violations remained, all on `motion.html`: Resin buttons inside a Resin popover,
a Resin menu (twice) and a Resin toast. The dock was never among them — it already set
`backdrop-filter: none` on its buttons.

## The fix

Two changes, both to the upper layer, none to Resin:

1. **`.cr-indicator` is now a Haze content fill.** It previously carried `--cr-resin-fill`
   and a full Resin backdrop blur, so every indicator sitting on a Resin control was a
   second blur stacked on the first.
2. **A structural rule**: any control inside a Resin surface has its backdrop filter
   removed. This is a rule rather than four patched instances, so it holds for markup nobody
   has written yet.

The rule deliberately assigns **no background**. An intermediate version gave those controls
a Haze fill and broke the selected dock item, whose fill is painted by a `::before` beneath
the element's own background box; the added fill covered it. Removing the second blur is the
whole of the fix.

`isolation: isolate` accompanies the filter removal, because `backdrop-filter` silently
creates a stacking context and these controls' `z-index: -1` pseudo-elements rely on it.
Dropping the filter alone would let them escape to the nearest ancestor context and paint
behind their own parent's background.

## Result

| Check | Result |
| --- | --- |
| Resin-on-Resin violations across 13 pages | 0 |
| Contrast checks | 1716, 0 failures |
| Reference frames unchanged | 11 of 12 |

## Why one baseline moved

`playground-dark` differs by 17 visible pixels in a 19×7 region at x 1181–1199, y 836–842 —
the indicator badge, the one element whose material deliberately changed. Re-blessed.

## A note on method

While investigating, the selected dock label appeared to have gone white-on-white in the
browser used for debugging, and it survived reverting the stylesheet, which made no sense.
It was an artefact of that long-lived browser: injected experiment styles and init scripts
from earlier probes had accumulated in the context. Captured through
`tools/capture-frames.mjs`, the same code renders the purple pill correctly. Verification
belongs in the clean reproducible path, not in the session browser being poked at.
