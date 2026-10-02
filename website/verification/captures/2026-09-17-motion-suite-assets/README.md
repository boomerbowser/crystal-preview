# The motion studies page lost its suite

Meridian reported the motion studies page as largely broken: animations not playing,
elements spaced too closely, elements not covered by their backgrounds, menus that would
not open, and menus that did open not rendering as Frost.

The five symptoms have one cause, which the shell restructure in `497450f` introduced.

## What happened

Moving the hand-authored pages into the generator meant re-declaring what each page loads.
That list was written by hand and never diffed against the original `<head>`. Three assets
were dropped from the motion studies page:

| Asset | What it provides |
| --- | --- |
| `assets/motion-suite.css` | The suite's own layout: panel spacing, backgrounds, the Frost menus |
| `assets/motion-preview.js` | The preview player that runs a recipe |
| `assets/motion-suite.js` | The suite chrome: tabs, menus, the recipe filters |

Every reported symptom follows from those three. Without the suite CSS the panels collapse
toward each other, their backgrounds no longer cover their contents and the menus lose
their Frost. Nothing animates without the preview player, and the menus do not open at all
without the suite script.

The page still returned 200 and logged nothing to the console, so the failure was silent.

`playground.html` was checked against its original and had lost nothing.

## The baseline was guarding the broken page

The `motion` frame was re-blessed in `497450f` along with everything else, so from that
commit onward the visual gate was holding the broken page as correct. This is the second
instance in two days of a blessed baseline recording a defect. The first was a screenshot
of a 404. Both are reasons for the rule that every re-blessed frame must be looked at.

## Why it cannot recur silently

Two changes prevent it.

**Page assets are now data.** They were inline arguments before. `PAGE_ASSETS` in
`tools/build.py` declares what each interactive page loads, with the two lists beside each
other so that a difference is visible when reading.

**`tools/validate.py` fails on an orphaned asset.** Every top-level file under `assets/`
must be referenced by at least one page. An asset nothing loads is either dead code or a
dropped reference, and the validator fails on both. This was proven by deleting the
`motion-suite.js` tag, after which the validator reported
`assets/motion-suite.js: referenced by no page`.

The check would have caught the original mistake when it was made.

## Checks

- `tools/validate.py`: 16 pages, 634 links, 1,011 icons, 0 errors
- Console clean on `motion.html`
- `npm run verify:visual`: the `motion` frame re-blessed to the working page; the other
  17 unchanged
