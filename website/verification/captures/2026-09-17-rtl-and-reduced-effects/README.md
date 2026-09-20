# Visual evidence — right-to-left and reduced effects

> **Superseded in part.** The leading selection mark visible in these frames was withdrawn at Meridian's direction later the same day, because it offset the very label it marked. Selection is label weight alone; see `../2026-09-17-light-and-rest-motion/README.md`. The frames are kept as the record of the run that produced them, not as a picture of how Crystal looks now.

Two axes the earlier gates did not cover. Adding them immediately found a real defect.

| File | Shows |
|---|---|
| `rtl-conversation-light.png` | Right-to-left: layout mirrors, range tracks fill from the trailing edge, selection rails move to the trailing edge, the authored bubble's tight corner mirrors, and there is no horizontal overflow |
| `regression-reduced-transparency.png` | A defect this axis caught: under reduced transparency, selected controls rendered as blank pills — white label on a white fill, a contrast ratio of 1:1 |
| `after-reduced-transparency.png` | After the fix: selected controls keep their primary fill and label at 5.93:1 |

## The defect

Removing 144 `:root body` specificity prefixes lowered the specificity of the rule that fills a selected dock or segmented control. The reduced-effect rules kept a `body` in their selectors, so they gained relative weight and began overriding it — leaving the label's `on-primary` white on a surface that had become white. Full-effects rendering was unaffected, which is why the cascade-layer gate passed: its four frames were all full-effects.

The fix removes the now-redundant `body` from the reduced-effect selectors, restoring the original precedence. Full-effects rendering remains pixel-identical.

## Right-to-left

Directional properties in the shipped primitives are logical. The bubble's tight corner, the selection rail, the range track fill, field badges and drawer edges all mirror. The preview site's own layout carried ten physical properties with directional meaning; those are now logical too.

These are captures of the adaptations working. They are not a conformance certification, and they do not cover assistive technology or native platforms.
