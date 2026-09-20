# Eleven recipes that animated nothing, and fifty-seven that nothing triggered

Meridian reported the animations as far too sparse — "and if they aren't, we are unable to
see them although they can be calculated from the specifications". That last clause is
exactly right, and it describes two separate defects.

## Eleven of fifty-four recipes were hollow

Their keyframes were `[{"opacity":1},{"opacity":1}]`: `hover`, `slider-step`,
`field-focus`, `field-valid`, `breadcrumb`, `highlight`, `attention`, `progress-change`,
`busy`, `haze-tide` and `stone-contour`. Each occupied a duration, carried a fitted spring,
satisfied incompressibility and animated nothing. Twenty per cent of the motion system was
a placeholder that shipped, and it dates from the 1.0 restructure rather than from 2.0.

One of them was `hover` — one of only two recipes wired to a live control. So of the two
things that could animate in an adopting product, one did nothing.

Every check passed because the only keyframe contract was `keyframes.length >= 2`.
Counting keyframes is not the same as requiring movement. `tools/validate-motion.cjs` now
asserts that some keyframe differs from the others, and the test is deliberately not
"first differs from last": a pulse (`press`) and a shake (`field-invalid`) correctly return
to where they started, and a contract that flagged them would be wrong.

The eleven were authored within the vocabulary already in use — `transform`, `opacity`,
`clipPath` — and not with `filter`, because those three map cleanly to SwiftUI and Compose
and `filter` does not. A recipe that only works on the web is not a portable primitive.
Every two-argument scale conserves area, and signature governs overshoot: `feather` and
`caustic` settle, `coalesce` and `meniscus` carry momentum into the target.

## Fifty-seven of them were wired to nothing

`assets/motion-interactions.js` — the installer an adopting product uses — bound `press`
and `hover` and nothing else. Every other recipe played only from the catalogue's replay
button. The studies suite demonstrates many of them, but it does so by element id, in its
own script, on its own page. In an application that had adopted Crystal, checking a
checkbox, throwing a switch, focusing a field or opening a disclosure produced no motion at
all.

Each recipe already carried a `use` field saying what should trigger it. That field was the
wiring instruction and had never been acted on.

**Motion binds to state, not to clicks.** A checkbox animates when `checked` changes, not
when it is pressed, so a keyboard user and a screen reader user get the motion a pointer
user gets. Binding to `pointerdown` is how a system ends up with animations that are real
in the demo and absent in use.

Two guards were needed, and the first was found by the test rather than by reasoning:

- The initial restart guard was per element — "do not play if this element is already
  animating". It broke `check`, because clicking a checkbox focuses it first, `field-focus`
  began, and the guard then swallowed the state change the user had actually made. The
  guard is per recipe now.
- `field-focus` was matching checkboxes, radios and switches. It is about a field accepting
  input; it now excludes controls that express focus through their own state recipe.

A page that drives a component itself marks that subtree `data-cr-motion="manual"` so the
delegated wiring does not fire the same recipe twice. The studies suite is marked.

## Ambient motion did not exist

Meridian asked for ambient animations for platforms able to take advantage of them. There
were none. `Ambient` is now a tenth category: `resin-breathe`, `frost-drift`, `haze-settle`
and `mirage-current`, plus `check-off` in Controls so unchecking is a motion rather than a
disappearance.

Three rules constrain the category, and they come from the existing specification rather
than from preference. Ambient is a capability tier, not a default — declared, opt-in, and
degrading to a static surface, the same shape the shader layer already uses. It runs on the
rim and the fill and never on a surface being read, which is the edge-lensing argument
again. And it is the first motion `prefers-reduced-motion` removes, because WCAG 2.2.2
requires that anything moving for more than five seconds can be stopped, and an ambient
loop never stops on its own.

The catalogue's orphan check refused the five new recipes, which was correct: every
animation must belong to a documented component. Ambient is exempt by category for the
same stated reason material choreography already was — it animates a material, so any
component made of that material inherits it. `check-off` was given its contract on
`checkbox`, and `check`/`check-off` were added to `radio`, whose contract had listed no
motion at all despite `check` naming radio indicators in its own `use` field.

## No existing spring was retuned

`tools/fit-springs.cjs --write` filled springs for the five new recipes. Verified against
the previous commit: every pre-existing spring is byte-identical. The springs were fitted
and the derived overshoot table proves them; this work changed keyframes and wiring, not
physics.

## Checks

- `npm test` — 27 core contracts, 1,716 contrast cases, 0 failures, 59 recipes in 10 categories
- `npm run verify:interactions` — 12 cases, 0 failures, including that reduced motion still
  applies the state instantly
- `tools/validate.py` — 16 pages, 0 errors
- `npm run audit:materials` — 15 pages, 0 violations
- `npm run verify:visual` — 18 of 18 identical; no frame moved, because none of this
  changes a resting appearance

## The overlays were Resin, and the specification says Frost

Meridian noted that the menus which did open "don't seem to be using Frost as they should".
That was correct, and it is a conformance defect rather than a preference. The material
assignment table in `docs/materials.md` is explicit:

- **Frost** — "Intermediate task frames, **transient panels and overlays**, with Haze
  reading/input surrounds"
- **Resin** — "**One** clustered navigation or control plane"

The suite's menu, popover, tooltip and toast all carried `cr-resin-haze`, rendering at
20px / 165% — Resin. A menu is not a clustered navigation plane and a tooltip is not a
control plane; both are transient overlays, so both are Frost. They now render at
40px / 125%.

This nested legally, which is why the existing audit never saw it: the rule it enforced
was that Resin may not contain Resin, and none of these did. Legal nesting and correct
assignment are different questions, and only the first was being asked.

`tools/audit-materials.mjs` now asks the second as well: anything matching `[role=menu]`,
`[role=tooltip]`, `[role=listbox]`, `[popover]` or the menu/popover/tooltip/toast classes
must not classify as Resin. Proven by reverting one overlay and watching the audit report
`overlay-material` against `suite-pop.cr-resin-haze` with its 20px filter.

Contrast is unchanged by the move — 1,716 cases, 0 failures, minimum 3.7157, identical to
before. Frost is the more opaque of the two recipes at 45% fill against Resin's fixed 20%,
so a label on it is better protected, not worse.
