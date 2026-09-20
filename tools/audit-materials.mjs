/* Material stacking audit.
 *
 * Crystal prohibits Resin on Resin. Resin is a translucent, backdrop-blurring
 * material; stacking one inside another makes a second 20px blur read through
 * the first, and the result is the illegibility that translucent interfaces are
 * routinely and fairly criticised for. The rule is that any layer sitting above
 * a Resin surface — a label, a badge, an indicator — is a Haze content fill:
 * an 80% fill with a 1.95px feather on its background layer, leaving text crisp.
 *
 * The fix is always to change the upper layer. Softening Resin to compensate
 * would disturb a material specification, which the standing constraint forbids.
 *
 * This checks the rendered DOM rather than the stylesheet, because the defect is
 * a composition of computed styles: an element does not have to carry a Resin
 * class to be Resin in substance. It only has to carry a backdrop-filter.
 *
 *   node tools/audit-materials.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:4321';

// Discovered, not listed. A hand-maintained list silently stops covering pages as
// the site grows — `playground.html`, the richest composition here, went unaudited
// for exactly that reason.
const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
// Every page belongs to the website; the library has no pages.
const SITE = path.join(ROOT, 'website');
const PAGES = [
  ...fs.readdirSync(SITE).filter(f => f.endsWith('.html')),
  ...['docs', 'verification'].flatMap(dir =>
    fs.readdirSync(path.join(SITE, dir))
      .filter(f => f.endsWith('.html')).map(f => `${dir}/${f}`)),
].sort();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const violations = [];
const unreachable = [];

for (const path of PAGES) {
  const response = await page.goto(`${BASE}/${path}`, { waitUntil: 'load' }).catch(() => null);
  if (!response || !response.ok()) { unreachable.push(path); continue; }
  await page.waitForTimeout(350);

  const found = await page.evaluate(() => {
    const describe = (el) =>
      (el.className || '').toString().trim().split(/\s+/).slice(0, 3).join('.') || el.tagName.toLowerCase();

    /* Classify by recipe, not by class name: an element does not have to carry a
       Resin class to be Resin in substance, and Crystal's hierarchy is
       Plastic -> Frost -> Resin, so Resin inside Frost is the *intended* layering
       and must not be reported. Only Resin inside Resin is the prohibited case.
       The two materials are told apart by their blur radius, read from the live
       token values so this cannot drift from the theme. */
    const root = getComputedStyle(document.documentElement);
    const px = (name, fallback) => {
      const v = parseFloat(root.getPropertyValue(name));
      return Number.isFinite(v) ? v : fallback;
    };
    const RESIN_BLUR = px('--cr-resin-blur', 20);
    const FROST_BLUR = px('--cr-frost-blur', 40);
    /* Half the distance between the two recipes: wide enough to tolerate a
       product tuning its blur slightly, narrow enough never to confuse them. */
    const TOLERANCE = Math.abs(FROST_BLUR - RESIN_BLUR) / 2;

    const blurOf = (el) => {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.webkitBackdropFilter;
      if (!bf || bf === 'none') return null;
      const m = /blur\(([\d.]+)px\)/.exec(bf);
      return m ? { radius: parseFloat(m[1]), filter: bf } : { radius: null, filter: bf };
    };

    const isResin = (el) => {
      const b = blurOf(el);
      if (!b || b.radius === null) return false;
      return Math.abs(b.radius - RESIN_BLUR) < TOLERANCE;
    };

    /* The material assignment table is explicit about which material an overlay is:
       Frost covers "intermediate task frames, transient panels and overlays"; Resin is
       "one clustered navigation or control plane". A menu, popover, tooltip or toast is
       a transient overlay, so Resin on one is a misassignment even though it nests
       legally. The suite's menu, popover, tooltip and toast were all Resin. */
    const TRANSIENT = '[role=menu],[role=tooltip],[role=listbox],[popover],' +
      '.cr-menu,.cr-popover,.cr-tooltip,.cr-toast,[class*=suite-menu],[class*=suite-pop],' +
      '[class*=suite-toast]';

    const out = [];
    for (const el of document.querySelectorAll(TRANSIENT)) {
      if (!isResin(el)) continue;
      out.push({
        rule: 'overlay-material',
        inner: describe(el),
        outer: '(transient overlay)',
        innerFilter: (blurOf(el) || {}).filter?.slice(0, 40),
        text: (el.textContent || '').trim().slice(0, 24),
      });
    }

    for (const el of document.querySelectorAll('*')) {
      if (!isResin(el)) continue;
      let parent = el.parentElement;
      while (parent) {
        if (isResin(parent)) {
          out.push({
            rule: 'resin-in-resin',
            inner: describe(el),
            outer: describe(parent),
            innerFilter: (blurOf(el) || {}).filter?.slice(0, 40),
            outerFilter: (blurOf(parent) || {}).filter?.slice(0, 40),
            text: (el.textContent || '').trim().slice(0, 24),
          });
          break;
        }
        parent = parent.parentElement;
      }
    }
    return out;
  });

  for (const hit of found) violations.push({ page: path, ...hit });
}

await browser.close();

console.log(JSON.stringify({
  audit: 'material stacking',
  rules: ['Resin may not contain Resin; an upper layer over Resin is a Haze content fill',
          'Transient overlays — menus, popovers, tooltips, toasts — are Frost, not Resin'],
  pagesChecked: PAGES.length - unreachable.length,
  unreachable,
  violations,
}, null, 2));

if (violations.length) {
  console.error(`\n${violations.length} Resin-on-Resin violation(s).`);
  console.error('Change the upper layer to a Haze content fill. Do not soften Resin.');
  process.exit(1);
}
