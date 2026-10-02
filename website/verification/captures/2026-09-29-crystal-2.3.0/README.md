# The site moves from Crystal 2.0.0 to 2.3.0

Captured 29 September 2026 by the "Capture runner baselines" workflow on the
pinned `ubuntu-24.04` image (run 36592709102), which is where the gate compares
(D-15), after the capture harness learned to wait until a frame has settled
(D-17). Before and after for three of the frames are beside this file.

The site had vendored 2.0.0 while the library shipped 2.1.0, 2.2.0 and 2.3.0, so
Crystal React's material gate compared against a Crystal that no longer existed
(Crystal's D-25). Five of the twenty-three runner frames change visibly; the
same five, with the same pixel counts, changed on the desk. Installing 2.0.0
again on the same branch makes every frame match the old baselines, so none of
the five is the branch's own markup.

| Frame | Visibly changed px | Why |
|---|---|---|
| `catalogue` | 2187 | The page says 284 components (2.3.0 removed a duplicate) and gains the motion column 2.2.0's catalogue carries |
| `components-light` | 3821 | "Open dialog" is tinted: the site marked it `.primary` for 2.1.0's opt-in primary, which 2.0.0 never painted |
| `focus-ring-light` | 6241 | The same button, focused; the ring is intact around the new pad |
| `focus-ring-dark` | 7816 | As above, in dark mode's primary |
| `playground-dark` | 112 | The palette swatches' rims |

`playground-light` and `playground-rtl` also move, by at most 9 of 255 on any
channel, which is below the gate's visible threshold; they were blessed with the
rest.

Each changed frame was looked at before blessing.

## The desk set, caught up on 2 October 2026

The runner set above was re-blessed on 29 September; the desk set in
`validation/baselines` was not, so `npm run verify:visual` failed locally on
these seven frames from then on. Captured on the desk at this commit's tree with
2.3.0 installed, the five visibly changed frames differ from the old desk
baselines by exactly the pixel counts in the table (2187, 3821, 6241, 7816 and
112), and `playground-light` and `playground-rtl` again move only below the
visible threshold. The seven were looked at and blessed; no other frame differs.
