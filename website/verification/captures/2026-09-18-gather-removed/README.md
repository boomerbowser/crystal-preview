# Every reference to Gather removed from the docs and the site

Meridian asked for all references to Gather to be removed from the design system
docs and website. Twenty-four occurrences across fourteen files, rewritten rather
than deleted — striking the word out would have left sentences like "a custom
design system derived from , not a vendor-certified combination".

## What changed, by kind

**Prose describing provenance** became origin-neutral or Meridian's own:

| was | now |
| --- | --- |
| "extends Gather's approved Crystal styling into a product-neutral design system" | "Meridian Digital's Crystal design system: a product-neutral visual language" |
| "an independent, reusable extension of Gather's approved `crystal-03-balanced`" | "Meridian Digital's reusable design system, built out from the approved `crystal-03-balanced` design" |
| "a custom design system derived from Gather, not a vendor-certified combination" | "a custom design system, not a vendor-certified combination" |
| "Avoid copying Gather's feature requirements into unrelated products" | "Avoid copying one product's feature requirements into unrelated products" |
| "plus Gather's original Harbor" | "plus the original Harbor" |
| "No framework, network service, or Gather application dependency" | "No framework, network service, or host application dependency" |

**Token descriptions** at their source in `tokens/crystal.json`, then regenerated
through the DTCG tree and every platform export: the system `basis` and Harbor's
description. The round trip verified with no token value changed.

## The preserved source archive

Four files in `reference/` are immutable copies of the design Crystal was built
out from, kept with SHA-256 digests. Three are named for their origin and the
fourth records it as data.

**They are excluded from the published site and kept in the repository.** Editing
a provenance record to remove the name of the thing it records would not make the
record neutral, it would make it false — and a provenance record that has been
edited is not one. So the site no longer references or serves them, and the record
survives intact where a record belongs.

The verification report's link to the manifest is removed with them, and the
report now says the copies are kept rather than published.

**This is the one part of the request that is a judgment call rather than a
rewrite, and Meridian should confirm it.** If they want the archive gone from the
repository as well, that is a deletion rather than an edit, and it is theirs to
authorise.

## Frames

Three re-blessed, all looked at: `docs-menu-light`, `docs-menu-forced-colours`,
`docs-menu-narrow`. All three photograph `docs/materials.html`, whose opening
paragraph lost a clause and reflowed — about 3,500 pixels at 1280×900, and 12% of
the narrow frame because a reflow moves everything below it.

Fifteen frames are byte-identical. The other affected pages — the overview, the
playground, colours, principles, components and adoption — change below the fold
of their frames, which is worth noting as a limit of the gate rather than as
evidence that nothing changed there.
