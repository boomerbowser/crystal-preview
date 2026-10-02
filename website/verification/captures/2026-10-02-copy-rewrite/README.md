# The copy rewrite moves seven frames

Captured 2 October 2026 on the desk with Crystal 2.3.0 installed, before and
after the copy rewrite, with nothing else changed. Seven frames differ, and in
each one the only change is reworded text and the line breaks that follow from
it. No material, colour, radius or focus ring moves. Before and after for two of
the frames are beside this file.

| Frame | Visibly changed px | What changed |
|---|---|---|
| `overview-light` | 17572 | The introduction gives 284 components rather than 119, and two paragraphs are reworded |
| `overview-dark` | 18471 | The same text in dark mode |
| `components-light` | 13994 | The section introduction and the "Actions & focus" caption are reworded |
| `focus-ring-light` | 13994 | The same text; the focused "Open dialog" ring is pixel-identical |
| `focus-ring-dark` | 14512 | As above, in dark mode |
| `focus-ring-forced-colours` | 14967 | As above, under forced colours; the "Apply name" pill and the "Accessibility contract" link sit 1px lower because the paragraph above them reflowed |
| `motion` | 8190 | The page introduction gains "These studies show" |

The runner set in `validation/baselines-ci` was captured by the *Capture runner
baselines* workflow on this branch (run 37043805279) on the pinned
`ubuntu-24.04` image. The same seven frames, and only those, differ there, by
the same counts to within glyph rasterisation (overview-light 17492,
overview-dark 18386, the rest identical). Those seven runner frames are
committed with the desk frames.

Each changed frame was looked at before blessing.
