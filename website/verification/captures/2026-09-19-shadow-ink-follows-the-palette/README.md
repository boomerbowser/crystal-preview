# The last eleven shadow literals follow the palette

**D-9's remaining half, 19 September 2026.**

## What changed

`assets/controls.css` carried eleven hard-coded shadow colours — `#080b2426`,
`#080b2433`, `#080b241c`, `#0002`, `#fffc` and one `rgba(39,24,68,.15)`. They are
a fixed dark navy, and it is not the ink Crystal uses anywhere else.

Crystal's shadow ink is palette-tinted and mode-aware: the base violet mixed with
the palette's companion colour, so the ink differs between palettes and darkens
in dark mode.

```
prism  light   rgba(107, 40, 112, .15) / .18
ion    light   rgba( 46, 39, 123, .15) / .18
prism  dark    rgba( 96, 29,  79, .50) / .55
```

A literal can do neither. Those eleven shadows were the one part of the preview
that did not follow the palette: in Ion the surfaces were tinted cyan-indigo and
their shadows stayed violet-navy.

The resolver now exports the two inks the composed shadows are already built
from — `--cr-shadow-contact` and `--cr-shadow-cast` — which makes fixing the
literals a substitution rather than an invention, and each was matched on alpha:

| literal | alpha | replaced with | alpha |
|---|---|---|---|
| `#080b2426` ×4 | .149 | `--cr-shadow-contact` | .15 |
| `#080b2433` ×3 | .200 | `--cr-shadow-cast` | .18 |
| `#080b241c` | .110 | `--cr-shadow-contact` | .15 |
| `rgba(39,24,68,.15)` | .15 | `--cr-shadow-contact` | .15 |
| `#0002` | .133 | `--cr-shadow-contact` | .15 |
| `#fffc` | .80 | `--cr-rim` | .85 — a highlight, not a shadow |

## What moved, and why it is explainable

`playground-before.png` and `playground-after.png`, Prism light at Crystal's
defaults, 1280×1400.

```
10,999 of 1,792,000 pixels differ (0.6138%), worst channel delta 15
```

Only shadow pixels, and only on the controls that used a literal — the switch
track and thumb, the range track and thumb, the checkbox and radio, the file
button, the field shell's outer cast, the selected dock pill, the indicator
badge and the table row hover.

**The action buttons are pixel-identical**, which is the check that this is the
change it claims to be: they were already built from `--cr-shadow-float`, so
nothing about them should move, and nothing did.

## Why this is an improvement rather than a difference

The standing constraint is that material specifications may be improved and never
regressed. A shadow that follows the palette and the appearance mode is what the
rest of Crystal already does; these eleven were the exception. The alphas move by
at most .04 and the worst channel delta is 15 of 255.

## What this does not do

`validation/baselines/` was captured manually — the driver that walks
`frames.json` is still unwritten (crystal-2.0 plan, task 14) — so those frames
have not been re-captured here. Any of them showing a switch, a slider, a
checkbox, a dock pill or a table will differ by the amount above. They should be
re-captured when the driver exists, and this README is the explanation that
belongs beside them when they are.

Two literals remain in `controls.css`: `#ffffff30` and `#ffffff0a`, the two white
stops of the optical sheen gradient. They are highlight, not ink, and they are
white in every palette, so they are not the same defect. Naming them is a
separate decision.
