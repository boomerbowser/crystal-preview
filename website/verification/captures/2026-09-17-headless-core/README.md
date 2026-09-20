# Visual evidence — declarative controls

> **Superseded in part.** The leading selection mark visible in these frames was withdrawn at Meridian's direction later the same day, because it offset the very label it marked. Selection is label weight alone; see `../2026-09-17-light-and-rest-motion/README.md`. The frames are kept as the record of the run that produced them, not as a picture of how Crystal looks now.

Removing the DOM-mutating runtime must not change what the preview renders. These three frames are pixel-identical to the same frames captured before the change, compared with `tools/compare-captures.py`.

| File | Shows |
|---|---|
| `after-components-light.png` | Components section: field shells, indicators and focus all authored in markup |
| `after-playground-light.png` | Playground: selection rails, ranges and swatches driven by the headless core |
| `after-playground-dark.png` | The same in dark mode |

The behavioural evidence is stronger than the visual evidence here. With `document.createElement` and `MutationObserver.observe` instrumented, re-running `controls.js` against a loaded page creates **zero elements**, starts **zero observers**, and leaves the DOM element count unchanged. The script's source contains neither API.
