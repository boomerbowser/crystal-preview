# The materials page was stale, and no gate could see it

Captured 18 September 2026 against the local preview, 1280×900, Prism light.

`docs/materials.md` gained the `.cr-scroll-x` section when D-2 was closed. The published
page did not. The markdown said one thing and the HTML a reader opens said another, for a
whole commit, and both of the gates that exist passed over it:

- `validate-docs.cjs` reads the markdown and the tokens. It never opens the HTML.
- the CI drift gate — "a build must not change a committed file" — runs `npm test`, and
  `npm test` built the tokens and the catalogue. It did not build the pages. A gate that
  compares generated output against its source is worth nothing for output the build it
  runs never generates.

So `npm test` now runs `tools/build.py`, which is the superset: tokens, catalogue,
reference sections, the default theme CSS and all fourteen pages. The drift gate's reach
grew to match its name without a line of it changing. Proved by reverting
`docs/materials.html` to the stale committed copy and running `npm test`: the file came
back rewritten, and the drift step fails on it.

## The frame that moved

| File | Shows |
|---|---|
| `before-haze-in-resin.png` | The blessed baseline, taken against the stale page |
| `after-haze-in-resin.png` | The same composition against the rebuilt page |
| `diff-haze-in-resin-amplified.png` | The difference, brightness ×6 |

14,388 of 80,640 pixels differ, worst channel delta 237. Looked at side by side the two
images are the same picture. The amplified difference says why: every glyph is ghosted
against itself and the frame's edge has a thin halo — a sub-pixel vertical shift, not a
change of colour, geometry or material. Restoring the two paragraphs and the code block
above the composition moved it down the page by a fraction of a pixel, and text rendered
at a fractional offset rasterises differently.

The Haze-in-Resin recipe is untouched: 80% fill, 1.95px feather, the inset dark top edge
and light bottom edge under a light source above. What this frame guards did not change;
where on the page it sits did.

The frame is already clipped to `#haze-in-resin-demo` for exactly this reason, and the
clip is not enough — it fixes the region captured, not the sub-pixel origin the region is
rasterised from. Worth knowing before the next prose edit above a blessed composition.
