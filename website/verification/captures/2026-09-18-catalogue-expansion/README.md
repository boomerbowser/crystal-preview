# The catalogue page catches up with the catalogue

`catalogue.png` re-blessed. The page is generated from `tokens/catalogue/`, and it
still said **174 components across 10 categories** while the source said 285
across 14 — the two catalogue extensions that followed the parity correction (R23)
regenerated `parity.json` but the site was not rebuilt afterwards.

The visual gate is what caught it. `npm test` regenerates the manifest and the
chapter markdown; the HTML comes from `build.py`, which had not been run since.
Nothing else in the frame moved: the change is the count, the category list and
the four coverage rows visible at 1280×900.

Looked at before blessing, which is how the staleness was identified rather than
the number simply being accepted as new.

| | before | after |
| --- | --- | --- |
| stated total | 174 components, 10 categories | 285 components, 14 categories |
| navigation | 15 | 17 |
| inputs | 44 | 52 |
| data display | 31 | 37 |

The remaining 17 frames are byte-identical.
