/* Copy the library into the website, so the website can be served as one tree.
 *
 * `core/` and `website/` are separate folders at the repository root, because
 * the library is not part of the website. A browser cannot follow `../core/`
 * out of the deployed site: only what is uploaded exists. So the build places
 * a copy of the library inside the site, at `website/vendor/@crystal-ui/core/`,
 * and every page addresses it there.
 *
 * `vendor/@crystal-ui/core/` is the site path because a static deployment
 * uploads `website/`, and `node_modules/` is not inside it. The copy is named
 * after the package rather than the folder it comes from, so no page,
 * stylesheet, script or specification link depends on where the library was
 * installed.
 *
 * Node built-ins only, and no arguments. On Vercel the install step is
 * `npm ci --omit=dev`, which installs `@crystal-ui/core` and nothing else, and
 * this script is the whole build.
 *
 *   node tools/assemble-site.mjs
 */
import { cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, 'website');
const VENDOR = resolve(SITE, 'vendor/@crystal-ui/core');

/* The installed package first, a sibling `core/` folder second. This
   repository installs `@crystal-ui/core` from npm, so the first candidate is
   the one used. The second lets the same script assemble the site from a
   local checkout of the library. */
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
   the library has deleted, and the site would go on serving and testing a
   stylesheet the library no longer ships. */
rmSync(VENDOR, { recursive: true, force: true });

/* What the site loads is `assets/`, plus `tokens/` for the pages that read the
   token source directly, `licenses/` for the attribution the icons page links,
   and `docs/`, the specification, which belongs to the library and is rendered
   by the site. `exports/` is for consumers of the package, not for a browser,
   and `package.json` describes a package nobody installs from here. Listed
   rather than inferred, so adding something to the library does not silently
   enlarge the site. */
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
