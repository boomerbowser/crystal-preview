# Two Crystal scrollbars, and the scroll contract behind them

Meridian: "Crystal both in the design system and in Crystal React needs
comprehensive scrolling support with two custom scrollbars (one in Frost, one in
Resin)." It was found by a team member opening the deployed site on a phone.

## What was actually wrong

Four faults, only the first of which was reported.

1. **Scroll chaining.** Every horizontally scrollable table carried
   `overscroll-behavior: auto`, so a swipe that reached the end of a table
   scrolled the page underneath instead. That reads as the table refusing to
   move, and it is invisible on a desktop with a mouse — which is why it survived
   to the phone.
2. **The operating system's scrollbars.** `scrollbar-color` was `auto`
   everywhere, so what appeared was the platform's, which on a phone is an
   overlay that is not there until you are already scrolling. Nothing said a
   surface could be scrolled.
3. **A gutter reserved against a scrollbar that never arrives.** The first fix
   put `scrollbar-gutter: stable` on every scroll container. `scrollbar-gutter`
   reserves space on the *inline* edge, where a vertical scrollbar appears; it
   does nothing for a horizontal one. On the tables — which scroll horizontally
   and never vertically — it cost 12px per table and prevented no shift. It is
   now on block-direction scrollers only, and `.cr-dialog` takes `both-edges` so
   centred dialog content stays centred.
4. **A thumb painted in the material's own colour.** The first version read
   "the scrollbar belongs to the material" literally and set the thumb to the
   material's surface colour: white at 62% over a white Frost panel. The
   contrast ratio was exactly 1.00. A scrollbar that cannot be seen is the bug
   that was reported, rebuilt with better intentions.

## The two scrollbars

The thumb is **ink, not material**. Which ink is what separates them, and it
follows the hierarchy rather than taste:

| | thumb | why |
|---|---|---|
| `.cr-scroll-frost` | palette ink at 55% | Frost is the intermediate surface. Its scrollbar belongs to the panel the way the panel's own text does. |
| `.cr-scroll-resin` | palette primary at 80% | Resin is the floating control plane. A scrollbar there is a control, so it is tinted like one. |

The track is the palette outline at 12%, a faint channel that lets the panel show
through. Under reduced transparency all three go solid.

Both clear **3:1 against surface, surfaceAlt and canvas in all six palettes and
both modes** — worst case 3.07 (Frost, harbor light) and 3.10 (Resin, ion light).
`tools/validate-tokens.cjs` asserts it, 72 new checks. Reverting the thumb to the
old value fails that gate at a ratio of 1.00, which is the whole point of adding
it: the defect was silent before and is loud now.

`.cr-dialog` takes the Frost scrollbar, because a dialog is a reading surface —
Haze over Mirage, not Resin. `.cr-table-scroll` takes the Resin one.

## One mechanism per engine

Chromium 121 and later ignore every `::-webkit-scrollbar` pseudo-element on a
container whose `scrollbar-width` or `scrollbar-color` is anything but `auto`,
and Crystal sets both on exactly those containers. Left unguarded, the webkit
rules are dead in the browser most people use and live in the one they do not —
one specification rendering two ways, which is the drift CONTRACT §1 forbids.

They now sit behind `@supports not (scrollbar-color: auto)`, so a browser takes
the standard properties or the pseudo-elements and never both. A new check in
`tests/core-contracts.cjs` fails if a webkit scrollbar rule is ever written
outside that guard; it is a source check because it cannot be a runtime one — a
branch that did not apply leaves nothing in the computed style to look at.

`--cr-scrollbar-width`, `--cr-scrollbar-inset` and `--cr-scrollbar-thumb-min`
reach only the older branch, because `scrollbar-width` takes `auto | thin | none`
and nothing finer. They are that branch's statement of the same intent, not a
second specification. A surface that needs the material in full uses the
scroll-area component, which draws its thumb as a real element.

## What is verified, and where

`tools/verify-scroll.mjs` checks four things on every scroll container across
seven pages, on a phone viewport and a desktop one: that it does not chain, that
it reserves a gutter if it scrolls vertically, that it carries a Crystal
scrollbar rather than the operating system's, and that it actually has something
to scroll. 36 containers pass. Reverting the fix produces 58 failures.

Two honest limits:

- The phone leg verifies **behaviour**, not appearance. Playwright's mobile
  emulation puts Chromium into overlay-scrollbar mode, where `scrollbar-gutter`
  is a no-op and no thumb is painted. What the phone leg proves is that swipes
  stop chaining.
- **The frames cannot see the scrollbars at all.** Headless Chromium paints no
  scrollbar even where it reserves the gutter, so no blessed frame contains one.
  The appearance was checked in a real browser at 1100×500 and 420×720, and what
  guards it from here is the contrast gate above, not a screenshot. That is the
  stronger guard anyway: it covers twelve palette-and-mode combinations rather
  than the two the frames photograph.

## Frames

Sixteen re-blessed, all looked at. Every difference is the side menu becoming
12px narrower, because it is the one container on every page that scrolls
vertically and now reserves its gutter. The menu appears on all eighteen frames;
the two that are unchanged are the narrow ones, where the menu collapses.

- The light frames differ by around 1000 pixels at a worst channel delta of 13
  and **nothing visible** — the menu pills' antialiased edges, one column over.
- `playground-dark` and `overview-dark` show 424 and 423 visible pixels, all of
  them inside x 239–265, y 123–166: the right edge of the single filled
  current-page pill, where a dark fill makes a 12px move easy to see.
- The three forced-colours frames show 3285–3778 visible pixels at delta 255,
  spread evenly down the menu column. In forced colours every pill is a 1px
  ring rather than a fill, so all thirteen rings move rather than one. Selection
  is still a ring and never a fill, which was checked in the frame.

The tables, which were shifting in the first version of this change, are now
byte-identical to their baselines.

`haze-in-resin` was blessed again, and this is worth understanding because it
will recur. The frame is anchored to a composition part-way down the materials
documentation, so **any** prose added above it moves the anchor to a different
fractional scroll offset and the page re-rasterises. Nothing about the
composition changes; sub-pixel text rendering does. It shows up only on the one
monospace code block on screen, which is the only text with enough contrast for
half a pixel to cross the visible threshold — the surrounding prose shifts by the
same amount and stays under it.

Three edits to that page during this change produced, in order: 1826 visible
pixels in x 346–897 / y 469–526, the same 1826 in the same rectangle (the frame
has two rasterisations and alternates between them with the document's height),
and finally 24 visible pixels in x 346–350 / y 515–526 — a single closing brace.
A diff that fits inside one glyph and matches no integer offset is a
re-rasterisation, not a layout move, and that distinction is the thing to check
rather than the pixel count. 1826 pixels cross the visible
threshold and all of them are inside x 346–897, y 469–526 — the one monospace
code block on screen, which is the only text with enough contrast for a
sub-pixel shift to register. Both crops were compared at 8×: the same glyphs,
the same recess, differently weighted antialiasing. No integer offset fits the
difference, which is what distinguishes a re-rasterisation from a layout move.
