# The motion studies page lost its suite

Meridian reported the motion studies page as largely broken: animations not playing,
elements spaced too closely, elements not covered by their backgrounds, menus that would
not open, and menus that did open not rendering as Frost.

Five symptoms, one cause, and it was introduced by the shell restructure in `497450f`.

## What happened

Moving the hand-authored pages into the generator meant re-declaring what each page loads.
That list was written by hand and never diffed against the original `<head>`. Three assets
were dropped from the motion studies page:

| Asset | What it provides |
| --- | --- |
| `assets/motion-suite.css` | The suite's own layout — panel spacing, backgrounds, the Frost menus |
| `assets/motion-preview.js` | The preview player that actually runs a recipe |
| `assets/motion-suite.js` | The suite chrome — tabs, menus, the recipe filters |

Every reported symptom follows directly. Without the suite CSS the panels collapse toward
each other and their backgrounds no longer cover their contents, and the menus lose their
Frost. Without the preview player nothing animates. Without the suite script the menus do
not open at all.

The page still returned 200 and logged nothing to the console. That is the defining
property of this failure: it is entirely silent.

`playground.html` was checked against its original and had lost nothing.

## The baseline was guarding the broken page

The `motion` frame was re-blessed in `497450f` along with everything else, so from that
commit onward the visual gate was holding the broken page as correct. This is the second
instance in two days of a blessed baseline recording a defect — the first was a screenshot
of a 404. The rule that every re-blessed frame must be looked at is not bureaucracy.

## Why it cannot recur silently

Two changes.

**Page assets are data, not inline arguments.** `PAGE_ASSETS` in `tools/build.py` declares
what each interactive page loads, with the two lists beside each other so a difference is
visible when reading.

**`tools/validate.py` fails on an orphaned asset.** Every top-level file under `assets/`
must be referenced by at least one page. An asset nothing loads is either dead code or a
dropped reference, and both are worth failing on. Proven by deleting the `motion-suite.js`
tag and watching the validator report `assets/motion-suite.js: referenced by no page`.

This would have caught the original mistake at the moment it was made.

## Checks

- `tools/validate.py` — 16 pages, 634 links, 1,011 icons, 0 errors
- Console clean on `motion.html`
- `npm run verify:visual` — the `motion` frame re-blessed to the working page; the other
  17 unchanged
