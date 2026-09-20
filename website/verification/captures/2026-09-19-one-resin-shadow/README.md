# Crystal had two Resin shadows, and a platform library could only have one

Captured 19 September 2026 against the local preview, 1280×900, Prism light, at
Crystal's own defaults.

Meridian sent Crystal's playground and said none of Crystal React's components
looked like it. Chasing that found two recipes for the same material inside
Crystal:

| | recipe |
|---|---|
| `--cr-shadow-float`, the exported token | `inset 0 1px 1px` highlight, `inset 0 -1px 1px` **contact**, `0 5px 8.75px`, `0 25px 50px`, palette-tinted |
| `controls.css`, what the preview renders | `inset 0 2px 1px` highlight, `inset 0 -1px 1px` **highlight**, `0 5px 9px #080b2412`, `0 16px 30px #080b2420` |

The second is what the approved baseline shows, because the baseline was captured
from the preview. The first is what every platform library gets, because
`controls.css` is not exported — that was D-1's fix. So a library following
Crystal's own token could not reproduce Crystal's own appearance, and the parity
bar in `libraries/CONTRACT.md` could not be met by following Crystal.

This is the D-1 hazard a second time: `controls.css` shaped the appearance that
got blessed, and the exported surface said something else.

## What changed

One recipe. `controls.css` reads `var(--cr-shadow-float)` and the token is
reconciled with the appearance that was actually approved — because each side was
right about something.

**The rims are the blessed ones.** 2px of light along the top where it catches,
and a light edge returning underneath. The token's lower inset used the *contact*
colour, which reads as an inner shadow at the bottom of the control rather than as
the underside of a piece of glass.

**The elevation is the token's.** Palette-tinted like every other Crystal shadow —
`controls.css` hard-coded a near-black `#080b24`, so a control's shadow was the
only one on the page that did not respond to the palette — and scaled by the
elevation control, which the literal also ignored. Moving the elevation slider
did nothing to any control in the playground before this.

The coefficients are the blessed distances divided by the default 125%: `4e`/`7.2e`
and `12.8e`/`24e`. At the default the preview renders what was approved; away from
it, the slider now moves.

| File | Shows |
|---|---|
| `before-playground-light.png` | The blessed baseline: two recipes, controls untinted and fixed |
| `after-playground-light.png` | One recipe, controls tinted and elevation-responsive |

Twelve of eighteen frames moved. The largest is `components-light` at 3.2% of
pixels with a worst channel delta of **19 of 255** — a shadow that is a little
softer, a little larger and now carries the palette's tint. Side by side the two
playgrounds are the same picture, which is the intent: this unifies a recipe, it
does not restyle anything.

1,788 contrast cases still pass. Crystal React, which followed the token all
along, now matches Crystal's own rendering exactly — verified by
`scripts/verify-materials.mjs`, which renders the same material in both and
compares the computed style.
