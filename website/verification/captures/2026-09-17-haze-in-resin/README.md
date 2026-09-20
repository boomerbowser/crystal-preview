# Haze filling a Resin frame

Meridian asked that neumorphic practice inform how Haze looks and feels — shadows,
feathering, light source — particularly when it fills a frame made of Resin.

## What was worth taking, and what was not

Soft UI's real contribution is a **discipline about light**: one consistent source, and
definition carried by a *pair* — a highlight where the light lands and a shadow where it is
occluded. Recession is expressed by inverting that pair rather than by adding contrast.

Its defining failure is the palette. Neumorphism fills an element with the same colour as
its background, so every bit of definition has to come from shadow, which is precisely why
it fails contrast checks and why almost nobody ships it now. Crystal takes the light model
and refuses the palette: Haze keeps its 80% fill and its verified text contrast. The probe
here measures **18.11:1** for body text on Haze inside Resin.

## What Crystal already had right

Crystal's light source is already consistent and overhead. Every shadow token offsets
straight down (`0 Npx`) and every highlight is `inset 0 1px 0` along the top edge:

| Token | Highlight | Shadow |
| --- | --- | --- |
| `--cr-shadow-panel` | `inset 0 1px 0` white | two downward |
| `--cr-shadow-float` | `inset 0 1px 1px` white | two downward |
| `--cr-shadow-content` | *none* | two downward |

`--cr-shadow-content` is the one Haze uses, and it is the only one of the three carrying no
paired highlight.

## The change

A Haze fill inside a Resin frame is a content well: it sits *in* the frame, and an outward
drop shadow says the opposite. With the source directly overhead, recession inverts the
pair — an inset shadow along the top edge where the frame occludes the light, and a
highlight returning along the bottom where it bounces off the far wall:

    box-shadow: inset 0 1px 2px rgba(39,24,68,.15), inset 0 -1px 0 var(--cr-rim);

Scoped to Haze **inside a Resin frame** only. A standalone Haze card genuinely is raised and
its existing recipe is correct, so the general material specification is untouched.

## Status of this change in the preview

All twelve reference frames are unchanged, because no composition in the current preview
puts a Haze fill inside a Resin frame. The rule is therefore correct and specified but not
yet exercised by the preview itself. `haze-in-resin.png` is that composition built
deliberately, to show the rule firing:

| Check | Result |
| --- | --- |
| `box-shadow` resolves to the inset pair | yes |
| Body text contrast on the fill | 18.11:1 |
| Reference frames changed | 0 of 12 |

A specimen belongs in the preview so this is covered by the visual gate rather than by a
one-off probe. That is recorded as outstanding in the request log.
