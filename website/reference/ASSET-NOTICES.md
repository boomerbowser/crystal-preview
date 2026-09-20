# Asset notices

Manrope is bundled with `assets/fonts/Manrope-LICENSE.txt`; preserve that license when redistributing the font. The grain texture is copied from the original source reference. The geometric artwork and Crystal's thirteen original symbols in `assets/icons.svg` were authored within this package.

The wider icon set in `assets/icons/` is derived from Lucide, used under the ISC License, with the notice preserved at `reference/licenses/lucide-LICENSE.txt`. Each file is normalised to Crystal's icon contract — a 24px view box, 1.8px strokes, round caps and joins, and `currentColor` — and carries no stroke or fill of its own, because the stylesheet supplies those. Crystal's original symbols are authoritative and are never replaced by a sourced icon of the same name. Brand and trademark marks are excluded: a design system must not relicense another party's mark. Regenerate with `node tools/build-icons.cjs`; `assets/icons/manifest.json` records the source and licence of every icon.


The five original specifications and their source-relative links are preserved unchanged for historical fidelity. See `provenance.json` for SHA-256 digests. Crystal's current documentation defines its current recipes; historical terminology is not the current material API.

No new distribution license is assigned to the company's design-system material by this package.

Motion 13.4.0 and GSAP 3.15.0 are installed and bundled in `assets/vendor/crystal-engines.js`. Motion and its bundled MIT dependencies retain license copies in `reference/licenses/`. GSAP's copyright and Standard License link are retained in the generated bundle's legal-comment file and its package README; see [GSAP Standard License](https://gsap.com/community/standard-license/). GSAP is not represented as MIT-licensed. No premium plugins or remote CDN runtime are used.

The user-supplied visual references indexed in `reference/README.md` are preserved as reference material, with their original locations and hashes in `visual-references.json`. Third-party inspiration images are not represented as original Crystal artwork or assigned a new license by this package.
