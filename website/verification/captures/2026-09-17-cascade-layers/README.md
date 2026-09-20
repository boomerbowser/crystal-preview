# Visual evidence — cascade layers

Moving Crystal into cascade layers and removing 144 `:root body` specificity prefixes must not change rendering. Four frames were compared pixel by pixel with `tools/compare-captures.py`; all four are identical.

| File | Shows |
|---|---|
| `before-docs-specification.png` | The specification page before layering |
| `regression-unlayered-inline-style.png` | A regression the comparison caught: the page's inline `<style>` was unlayered, so it beat Crystal's component layer and the sidebar pills reverted to rounded rectangles |
| `after-docs-specification.png` | After declaring that inline style into `crystal.base`; pixel-identical to the before frame |

The regression frame is kept deliberately. It is the clearest illustration of the rule that unlayered CSS beats every layer, which is the behaviour products depend on when overriding Crystal and the behaviour a page's own scaffolding must opt out of.
