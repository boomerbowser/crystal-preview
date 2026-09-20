/* Copy the library into the website, so the website can be served as one tree.
 *
 * `core/` and `website/` are separate folders at the repository root, because
 * the library is not part of the website and never was. A browser, however,
 * cannot follow `../core/` out of the deployed site: whatever is uploaded is
 * the whole world. So the build places a copy of the library inside the site,
 * at `website/vendor/@crystal-ui/core/`, and every page addresses it there.
 *
 * `vendor/@crystal-ui/core/` stays the site path permanently, because a static
 * deployment uploads `website/` and `node_modules/` is not inside it — a page
 * cannot load from a directory that was never uploaded. What changes when the
 * library is published is the *source* of this copy, one constant below:
 * `../core` becomes `node_modules/@crystal-ui/core`. No page, stylesheet,
 * script or specification link changes, which is why the copy is named after
 * the package rather than after the folder it currently comes from.
 *
 * Node built-ins only, and no arguments. Vercel runs this as the whole build
 * with no install step, so anything this needed to be installed first would
 * have to be installed on Vercel, and the only honest way to keep that true is
 * to need nothing.
 *
 *   node tools/assemble-site.mjs
 */
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, 'website');
const VENDOR = resolve(SITE, 'vendor/@crystal-ui/core');

/* The installed package first, the sibling folder second. In this repository
   the library is `core/` beside the website; in the website's own repository it
   will be a dependency and there will be no `core/` to find. Asking in this
   order means the same script is correct in both, and the split does not have
   to edit it — which is the whole reason the vendored copy is named after the
   package rather than after the folder it happens to come from today. */
const CANDIDATES = [
  resolve(ROOT, 'node_modules/@crystal-ui/core'),
  resolve(ROOT, 'core'),
];
const LIBRARY = CANDIDATES.find((path) => existsSync(path));

if (!LIBRARY) {
  console.error('No library to build the site against. Looked in:');
  for (const path of CANDIDATES) console.error(`  ${path}`);
  console.error('Install @crystal-ui/core, or run this beside the library.');
  process.exit(1);
}

/* Removed rather than merged. A copy that only ever adds cannot notice a file
   the library has deleted, and a site serving a stylesheet the library no
   longer ships is a site testing something that does not exist. */
rmSync(VENDOR, { recursive: true, force: true });

/* What the site loads is `assets/`, plus `tokens/` for the pages that read the
   token source directly, `licenses/` for the attribution the icons page links,
   and `docs/` — the specification itself, which belongs to the library and is
   rendered by the site rather than owned by it. Not `exports/`: those are for
   consumers of the package, not for a browser. Not `package.json`, which
   describes a package nobody installs from here. Listed rather than inferred,
   so adding something to the library does not silently enlarge the site. */
const COPIED = ['assets', 'tokens', 'licenses', 'docs'];

for (const part of COPIED) {
  const from = resolve(LIBRARY, part);
  if (!existsSync(from)) {
    console.error(`The library has no ${part}/. Expected at ${from}.`);
    process.exit(1);
  }
  cpSync(from, resolve(VENDOR, part), { recursive: true });
}

console.log(JSON.stringify({
  assembled: 'website/vendor/@crystal-ui/core',
  from: LIBRARY.startsWith(resolve(ROOT, 'node_modules')) ? 'node_modules/@crystal-ui/core' : 'core',
  parts: COPIED.map((part) => `${part}/ (${readdirSync(resolve(VENDOR, part)).length} entries)`),
}, null, 2));
