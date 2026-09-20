# Ambient motion withdrawn from Crystal 2.0

Meridian: "remove ambient animations from the design system entirely. We'll
introduce them in a later version of Crystal."

Ambient was specified, built, measured and withdrawn inside two days. The work is
recorded in `proposals/crystal-2.0-requests.md` R17 through R21 rather than
deleted, because the next attempt should not start from nothing.

## What was removed

- The optical rest tier: `CrystalShaders` no longer attaches at rest, and the
  six-context cap, the virtual clock and the energy plumbing went with it.
  `attach` remains for motion a person starts, which is what §7 of the contract
  is about and is unaffected.
- `CrystalMotion.ambient` / `stopAmbient` / `ambientAll` and the rest/hover/press
  rate table.
- The travelling edge on Haze, and its four tokens.
- The `Ambient` recipe category — four recipes. **55 recipes in nine categories.**
- `tools/audit-ambient.mjs`, the `audit:ambient` script, and the two reference
  frames that photographed the rest state.

## What was kept, and why

**Plastic keeps its glow.** R17 asked for two different things in one sentence:
that Plastic *carry* a glow of its primary lifted by the scheme's tint, and that
materials move at rest. The first is a material property and stays; only the
drifting was ambient, so the gradient now holds at its resting position. Removing
it as well would have quietly reverted a material improvement nobody asked to
lose — the first pass did exactly that, and the frame diff is what caught it.

**The `u_radius` uniform stays.** Shaders mask to the surface's real corner radius
rather than a fixed 0.17 of the short side. That fixed the ghost box on Resin
pills and is correct for interaction-driven optical layers too.

## The ghost box, fixed before the removal

Meridian reported "a rectangular backing element" on Resin components, then that
it had "gotten worse". Both were real and they were two different faults.

1. The shader masked itself to a rounded rectangle of 0.17 × the short side. On
   the stage dock that rendered a 36px corner as a 12px one, so the optical layer
   drew a rounded rectangle inside a stadium. Every action control in Crystal is a
   pill, so it affected all of them. Fixed by reading the computed radius.
2. It then got worse because of the travelling edge: `inset: calc(-1 * width)`
   drew the ring **outside** the element, which is a halo box around it, and
   widening the trace from 1.5px to 7px made that box unmissable. A ring drawn
   outside an element is a ghost rectangle at any width. That was never right, and
   the layer is gone now regardless.

## Frames

Four re-blessed, all looked at: `playground-light`, `playground-dark`,
`playground-narrow`, `playground-rtl`.

`playground-light` differs by exactly 30262 pixels with 58 visible — the same
numbers, to the pixel, as when the trace was *added*. It is that change reversing.
Dark shows 566 visible pixels at a worst delta of 36, on the top edge of the Haze
project cards, where a dark fill makes the antialiasing shift easier to see; the
cards and their text were inspected at 3× and are crisp.

The other fourteen frames are byte-identical, which is the useful result: removing
an entire motion tier changed nothing about how Crystal looks at rest.
