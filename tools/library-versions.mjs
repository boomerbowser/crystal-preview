/* The versions this site states, resolved from the npm registry.
 *
 * The site shows which component libraries Prismata has and what version each is
 * on. The list is Prismata's (`@prismata/core/libraries`, installed); a version
 * is the package's own and is not in that list, so it is asked of the registry
 * here and written to `website/src/library-versions.json`, which the page build
 * reads. It is committed, so a build is reproducible offline, and it is
 * refreshed by `.github/workflows/follow-prismata.yml`, which adopts a new
 * version the hour it is published.
 *
 *   node tools/library-versions.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'website/src/library-versions.json');
const { libraries } = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/@prismata/core/tokens/libraries.json'), 'utf8'));

/* The `latest` tag, or, for a package published only under a pre-release tag
   (an alpha), that tag's version. */
function published(name) {
  const tags = JSON.parse(execFileSync('npm', ['view', name, 'dist-tags', '--json'], { encoding: 'utf8' }));
  return tags.latest ?? Object.values(tags)[0] ?? null;
}

const packages = {};
for (const name of ['@prismata/core', ...libraries.map((l) => l.package).filter(Boolean)]) packages[name] = published(name);
const next = `${JSON.stringify({ $description: 'Published versions of Prismata and its component libraries, from the npm registry. Written by tools/library-versions.mjs; refreshed by follow-prismata.yml. Never edit by hand.', packages }, null, 2)}\n`;
let previous = '';
try { previous = readFileSync(OUT, 'utf8'); } catch { /* first run */ }
if (next !== previous) writeFileSync(OUT, next);
console.log(JSON.stringify({ packages, changed: next !== previous }, null, 2));
