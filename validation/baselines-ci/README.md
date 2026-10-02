# Visual regression baselines: the runner's set

This directory holds the same twenty-three frames as [`../baselines`](../baselines),
captured on a GitHub runner instead of a contributor's machine. CI compares against
this set.

## Why there are two sets

A baseline means "what this renderer produced", and a contributor's machine and a
GitHub runner are two different renderers. Comparing the desk set on a runner fails
most of the frame set by a wide margin. The text-heavy frames fail worst, because
the difference is glyph rasterisation:

```
docs-menu-forced-colours.png   46,058 pixels visibly changed
icons.png                      25,866
playground-reduced-transp.png  12,297
overview-dark.png               7,531
```

A difference of this size is more than noise, and no tolerance can absorb it. An
allowance raised until these frames pass would leave a gate that could no longer see
a real change. D-15 recorded the diagnosis and left the gate out of CI because of
it. The fix is a second set of baselines: **capture where you compare.**

## Keeping this set current

The **Capture runner baselines** workflow generates these files. Do not produce them
by hand or on a contributor's machine. When a frame legitimately changes:

1. Land the change and re-bless [`../baselines`](../baselines) locally, looking
   at the images, as that directory's README requires.
2. Run the *Capture runner baselines* workflow on the branch.
3. Download the `runner-baselines` artifact into this directory and commit it in
   the same commit.

The runner image is pinned to `ubuntu-24.04` in both the capture workflow and
the job that compares against it, because this set is valid only while the renderer
stays the same. If the pin moves, this set is stale and the gate fails, which is the
correct result.
