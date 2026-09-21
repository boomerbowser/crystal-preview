/* What the documentation website owes the library it installs.
 *
 * These two checks came from Crystal's own `tests/core-contracts.cjs` and moved
 * here with the site they are about. Both compare something this repository
 * authors against something `@crystal-ui/core` publishes, which is only
 * possible where both are present — and this is the only place they are.
 *
 *   node tests/site-contracts.cjs
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'website');
const CORE = path.join(ROOT, 'node_modules/@crystal-ui/core');

const results = [];
const check = (name, fn) => {
  try { fn(); results.push({ name, status: 'pass' }); }
  catch (error) { results.push({ name, status: 'fail', detail: error.message }); }
};

/* The preview's own layout is what the layout tokens were derived from, which is
   why nothing can drift *yet* — and why it will, the first time a token changes
   and the stylesheet does not. Lengths are var() references now. Breakpoints
   cannot be: `@media (max-width: 1150px)` will not take a custom property, and
   no amount of wishing makes it. So they are checked instead.

   Every width in a `@media` query in site.css must either be one of Crystal's
   four shell breakpoints or be named below as something else — a component's own
   threshold, which is a different kind of number and not Crystal's to own. The
   allowlist is the point: it is short, each entry says what it is, and adding to
   it is a decision somebody makes rather than a literal nobody notices. */
const COMPONENT_WIDTHS = new Map([
  [1000, 'the documentation shell narrows its sidebar before the marketing shell does'],
  [860, 'the documentation shell drops its sidebar'],
  [700, 'the reference image strip goes from three across to two'],
  [450, 'the reference image strip goes to one'],
]);

check('every breakpoint in site.css is a token or a named exception', () => {
  const css = fs.readFileSync(path.join(SITE, 'assets/site.css'), 'utf8');
  const tokens = JSON.parse(fs.readFileSync(path.join(CORE, 'tokens/crystal.tokens.json'), 'utf8'));
  const shell = new Set(Object.values(tokens.semantic.breakpoint)
    .map((leaf) => Number.parseInt(leaf.$value, 10)));
  assert.equal(shell.size, 4, 'expected four shell breakpoints');

  const stray = [];
  for (const query of css.match(/@media[^{]*/g) ?? []) {
    for (const [, width] of query.matchAll(/(?:max|min)-width:\s*(\d+)px/g)) {
      const value = Number(width);
      if (shell.has(value) || COMPONENT_WIDTHS.has(value)) continue;
      stray.push(`${value}px in ${query.trim()}`);
    }
  }
  assert.deepEqual(stray, [], 'breakpoints that match neither a token nor a named exception');
});

/* The site redefines no custom property the library already defines.
 *
 * This is the check D-11 asked for from the day it was opened and could not be
 * written until 21 September 2026, because writing it earlier would have frozen
 * an undecided divergence into a gate — which is how the halo's spreads got out
 * of step in the first place.
 *
 * What it replaces was narrower and is now pointless: a comparison of this
 * site's `--cr-focus-ring` against the library's, blur and spread only, first
 * four layers only. The site no longer defines `--cr-focus-ring` at all. The
 * library carries the six-layer recipe, the dark-mode feather alphas, the
 * Resin interaction surface and the five components this site used to hold
 * alone, so there is nothing left here to compare — and this check is what
 * keeps it that way.
 *
 * The rule is deliberately about *definition*, not about value. A site that
 * redefines a library property to the same value is still a site whose blessed
 * appearance can drift from what the library exports without anybody noticing,
 * which is exactly what D-9 and D-11 both were.
 */
const ALLOWED = new Map([
  /* Genuinely the site's own, with no library equivalent. A name here must be
     a property the library does not define; the check below proves that, so an
     entry cannot be used to smuggle an override past it.

     Empty as of the second adoption pass: `--cr-range-progress` was the last
     entry, and the range inputs it belonged to were never site furniture. The
     library styled no native control at all — no checkbox, radio, range, file
     button, select option or menu item — so every one of them lived here. They
     are Crystal's now, and the property went with them. */
]);

check('this site redefines no custom property the library already defines', () => {
  const defined = (file) => new Set(
    [...fs.readFileSync(file, 'utf8').matchAll(/(--cr-[a-z0-9-]+)\s*:/g)].map(([, name]) => name),
  );
  const library = new Set([
    ...defined(path.join(CORE, 'assets/crystal-theme.css')),
    ...defined(path.join(CORE, 'assets/crystal.css')),
  ]);
  assert.ok(library.size > 100,
    `read ${library.size} custom properties from the installed library, which is too few to be right `
    + '— the paths moved and this check is comparing against almost nothing');

  const site = [...defined(path.join(SITE, 'assets/controls.css'))];
  const clashes = site.filter((name) => library.has(name) && !ALLOWED.has(name));
  assert.deepEqual(clashes, [],
    'this site redefines library properties, so what it renders can differ from what the library '
    + 'exports and only a person reading both stylesheets would know');

  /* An allow-list entry for a property the library *does* define would silence
     a real clash. Fail on the entry rather than on the property. */
  const stale = [...ALLOWED.keys()].filter((name) => library.has(name));
  assert.deepEqual(stale, [],
    'these are on the allow-list and the library now defines them, so the exemption is hiding a clash');
});

/* This site styles nothing that is Crystal's.
 *
 * The property check above is about *values*. This one is about *scope*, and it
 * is the check that would have caught what the property check could not: after
 * the first adoption pass, `controls.css` still carried 75 rules and 238
 * declarations that were Crystal's — a `.cr-table-scroll` with the whole Resin
 * surface, a `.cr-dock` pill, a status chip at twice the library's padding, and
 * every native form control there is. None of it redefined a custom property,
 * so the gate above stayed green while the site quietly out-specified the
 * library it installs.
 *
 * The rule fails closed, which is the whole point: a selector stays here only
 * if it names a class or an id *outside* Crystal's `cr-` namespace. A rule with
 * no classes at all — `input[type=range]`, `[role=menu] button` — is Crystal's,
 * because the library claims bare elements. Anything this site wants to keep
 * that does not name furniture has to be argued for by name, below.
 */
const SITE_ONLY = /\.(?!cr-)[a-zA-Z_-][\w-]*|#[a-zA-Z_-][\w-]*/;

const ALLOWED_RULES = new Map([
  [/^\.cr-dock-inner(::before)?$/,
    'components.md says .cr-dock-inner shares the Stone recipe; materials.md says a label on a '
    + 'Resin dock takes its own chip. The library follows the first and this site the second, and '
    + 'this site\'s rule is also too broad — it blanks .cr-dock-inner.cr-stone, the "Stone on '
    + 'Resin" specimen on playground.html. Open in Crystal\'s tracker; do not adopt or delete '
    + 'this until it is decided.'],
]);

check('this site styles nothing that belongs to Crystal', () => {
  const css = fs.readFileSync(path.join(SITE, 'assets/controls.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  /* Selectors only. A regex cannot do this: `@media` preludes are heads too,
     and `:is(a, b)` holds a comma that is not a selector boundary. So the file
     is walked, at-rule preludes are skipped, and heads are split on commas at
     parenthesis depth zero. */
  const selectors = [];
  let head = '';
  let parens = 0;
  for (let i = 0; i < css.length; i += 1) {
    const c = css[i];
    if (c === '(') parens += 1;
    else if (c === ')') parens -= 1;
    if (c === '{') {
      const text = head.trim();
      head = '';
      if (!text || text.startsWith('@')) continue;
      let depth = 0;
      let part = '';
      for (const ch of text) {
        if (ch === '(') depth += 1;
        else if (ch === ')') depth -= 1;
        if (ch === ',' && depth === 0) { if (part.trim()) selectors.push(part.trim()); part = ''; }
        else part += ch;
      }
      if (part.trim()) selectors.push(part.trim());
    } else if (c === '}' || (c === ';' && parens === 0)) head = '';
    else head += c;
  }
  assert.ok(selectors.length > 20,
    `read ${selectors.length} selectors from controls.css, which is too few to be right — `
    + 'the file moved or the parse broke, and this check is looking at almost nothing');

  const crystal = selectors.filter((sel) =>
    !SITE_ONLY.test(sel) && ![...ALLOWED_RULES.keys()].some((r) => r.test(sel)));
  assert.deepEqual(crystal, [],
    'these selectors name nothing outside Crystal\'s namespace, so this site is specifying '
    + 'Crystal components in a stylesheet the library does not ship');

  /* An exemption for a selector the file no longer contains is a note about a
     decision nobody has to make any more. */
  const stale = [...ALLOWED_RULES.keys()]
    .filter((r) => !selectors.some((sel) => r.test(sel)))
    .map(String);
  assert.deepEqual(stale, [],
    'these exemptions match no rule in controls.css and should go');
});

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'what the site owes the library',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
