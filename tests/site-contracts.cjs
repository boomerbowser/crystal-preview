/* What the documentation website owes the library it installs.
 *
 * These two checks came from Crystal's own `tests/core-contracts.cjs` and moved
 * here with the site they are about. Both compare something this repository
 * authors against something `@crystal-ui/core` publishes, and this is the only
 * place both are present.
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

/* The layout tokens were derived from the preview's own layout, so nothing has
   drifted yet; it will, the first time a token changes and the stylesheet does
   not. Lengths are var() references now. Breakpoints cannot be:
   `@media (max-width: 1150px)` will not take a custom property. So they are
   checked instead.

   Every width in a `@media` query in site.css must either be one of Crystal's
   four shell breakpoints or be named below as a component's own threshold,
   which is not Crystal's to own. The allowlist is short and each entry says
   what it is, so adding a width is an explicit decision. */
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

/* This site overrides the library's focus halo, so the two can disagree and
   only a person reading both stylesheets would know. The halo was halved at
   Meridian's request, 2/6/12/22 to 1/3/6/11, in `controls.css`, which is what
   the site renders; the exported theme, which is what every consumer reads,
   has to carry the same spreads. Crystal React's appearance, theme and
   material gates pass with either value, because they check that
   `--cr-focus-ring` is defined rather than what it says.

   Blur and spread only, and only the first four layers. This site composes two
   further elevation layers on top of the halo and the library ships none;
   whether it should is a material question for Meridian, recorded in D-11 and
   not frozen here. The dark-mode feather alphas diverge for the same reason and
   are likewise not compared. */
check('the halo this site renders is the halo the library exports', () => {
  const geometry = (file, what) => {
    const value = /--cr-focus-ring:\s*([^;]+);/.exec(fs.readFileSync(file, 'utf8'));
    assert.ok(value, `${what} defines no --cr-focus-ring`);
    return [...value[1].matchAll(/0\s+0\s+(\d+)px\s+(\d+)px/g)].map(([, b, s]) => `${b}/${s}`);
  };
  const exported = geometry(path.join(CORE, 'assets/crystal-theme.css'), 'the installed library');
  const rendered = geometry(path.join(SITE, 'assets/controls.css'), 'this site');

  assert.equal(exported.length, 4, 'expected four halo layers in the installed theme');
  assert.deepEqual(exported, rendered.slice(0, 4),
    'this site renders a focus halo the installed library does not export');
});

/* The site does not write markup for a Crystal class the library withdrew.
 *
 * The other direction of the same rule. `core-contracts` stops `.cr-button.secondary`
 * coming back as a rule; this stops it surviving as markup. A class with no rule
 * renders as an ordinary action, so nobody notices it until somebody adds a rule
 * for it again.
 *
 * `.secondary` named a second action colour and Crystal defines one: the palettes
 * publish a single action pair, and the companion and glow hues are expressive
 * paint that `colors.md` says is never assumed to be text-safe. Meridian withdrew
 * the variant on 22 September 2026. An ordinary action is `.cr-button` and the
 * emphatic one is `.cr-button.primary`.
 *
 * Read from the hand-authored sources rather than the built pages, because the
 * built pages are output: fixing them without fixing the source puts the class
 * back on the next build.
 */
const WITHDRAWN = [
  { pattern: /\bcr-button\b[^"]*\bsecondary\b/, why: 'the .secondary button variant was withdrawn; an ordinary action is `cr-button` and the emphatic one is `cr-button primary`' },
];

check('the site writes no markup for a withdrawn Crystal class', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const dir = path.join(__dirname, '../website/src/pages');
  const pages = fs.readdirSync(dir).filter((name) => name.endsWith('.html'));
  assert.ok(pages.length > 0, `no hand-authored pages under ${dir}; this check is looking at nothing`);

  const found = [];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(dir, page), 'utf8');
    for (const { pattern, why } of WITHDRAWN) {
      for (const match of html.matchAll(new RegExp(pattern.source, 'g'))) {
        found.push(`${page}: ${match[0]} — ${why}`);
      }
    }
  }
  assert.deepEqual(found, [], 'withdrawn Crystal classes in the site\'s own markup');
});

const failures = results.filter((r) => r.status === 'fail');
console.log(JSON.stringify({
  suite: 'what the site owes the library',
  checks: results.length,
  failures: failures.map((f) => ({ name: f.name, detail: f.detail })),
}, null, 2));
if (failures.length) process.exit(1);
