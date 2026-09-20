# Crystal

Crystal is Meridian's shared visual language: a token source of truth, a set of material
primitives, a headless interaction core, a 119-component catalogue and about a thousand
icons. It is one system with several renderings — the web reference in this repository,
and the platform libraries that must match it.

This site is both the specification and a working copy of the system. Every specimen on
these pages is live: the same CSS that ships is the CSS drawing the examples, so a rule
that has stopped being true shows it here first.

<div class="docs-grid">
<a class="doc-link" href="playground.html"><strong>Open the Playground</strong><p>Change palette, atmosphere, elevation and material depth on a real interface, then export the configuration.</p></a>
<a class="doc-link" href="docs/principles.html"><strong>Read the foundations</strong><p>What the system is for, and the decisions that everything else follows from.</p></a>
<a class="doc-link" href="docs/adoption.html"><strong>Adopt it</strong><p>Install, build, theme, and the parity bar a platform library has to clear.</p></a>
</div>

## The material hierarchy

Crystal has three stacked materials and three named specials. The hierarchy runs
back to front — **Plastic → Frost → Resin** — and the order is not decorative. Each
layer forward is more translucent and more expensive, so each one has to earn its place
by being closer to the user's attention.

<div class="materials" markdown="1">

<div class="material-card" markdown="1">
<div class="material-scene"><div class="material-sample foundation"><span class="protected">Plastic</span></div></div>
<div class="material-info" markdown="1">
### Plastic
The opaque base. Everything readable starts here. Plastic has no backdrop filter, costs
nothing to composite, and is the correct answer whenever you are not sure.
</div>
</div>

<div class="material-card" markdown="1">
<div class="material-scene"><div class="material-sample cr-frost"><span class="protected">Frost</span></div></div>
<div class="material-info" markdown="1">
### Frost
40px blur at 125% saturation. The middle layer: panels, sidebars, sheets — surfaces that
persist while content moves behind them. The side menu on this page is Frost.
</div>
</div>

<div class="material-card" markdown="1">
<div class="material-scene"><div class="material-sample cr-resin"><span class="protected">Resin</span></div></div>
<div class="material-info" markdown="1">
### Resin
20px blur at 165% saturation over a fixed 20% fill. The front layer, reserved for things
that float above everything: docks, floating bars, the leading edge of an overlay.
</div>
</div>

</div>

Plus three specials that are not layers in the stack:

| Material | What it is | Where it belongs |
| --- | --- | --- |
| **Haze** | An 80% content fill with a 1.95px feather | Readable content sitting *inside* a translucent frame |
| **Stone** | A 55% (light) / 60% (dark) label backing | A label that must stay legible over an unknown backdrop |
| **Mirage** | The modal scrim | Behind a dialog, and nowhere else |

Feathering applies only to an isolated paint layer. Text, icons, hit areas and focus rings
stay crisp — a feathered glyph is a blurry glyph, and no amount of material intent makes
that acceptable.

[The full material specification →](docs/materials.html)

## Rules that catch people out

These are the ones adopters get wrong most often. Each is a real constraint with a real
failure behind it, not a style preference.

**Resin never contains Resin.** A translucent surface stacked on a translucent surface
blurs a blur, and the content stops being legible. When something has to sit on top of a
Resin element, it becomes a Haze content fill. The fix is always to change the upper
layer — never to weaken Resin.
[Why →](docs/materials.html#resin-never-contains-resin)

**A check mark means validated or informational — never "selected".** Selection is a
label weight. The side menu on this page is the pattern.
[Why →](docs/components.html#selection)

**Selection in forced colours is a ring, never a fill.** Chromium paints an opaque
`Canvas` backplate behind text runs, *above* the element's own background, so a filled
selected row loses its label completely.
[Why →](docs/accessibility.html#forced-colours)

**Action controls are pill-shaped.** Card-shaped buttons — a button that is really a
tappable card — keep the content radius instead. Those are the only two options.
[Why →](docs/components.html#geometry)

**Status colours are independent of brand palettes.** All six palettes change the brand
colours and none of them change what "error" looks like.
[Why →](docs/colors.html#status)

## Evidence

Claims on this site are bounded and checked. The [verification
report](verification/report.html) lists what was actually executed — contrast across all six
palettes in both modes, forced colours in both high-contrast palettes, reduced
transparency, right-to-left, and a twelve-frame visual regression gate — together with
what those checks do *not* cover.
