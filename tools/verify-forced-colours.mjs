/* Prove that nothing keeps a backdrop blur under forced colours (D-36).
 *
 * A forced-colours rule that loses the cascade does not do what it says, and a
 * static reading of the cascade got this wrong once: the surface-recipes
 * generator reported rims and shadows that the browser's own forced-colours
 * adjustment removes, and missed the one property it does not adjust,
 * `backdrop-filter`. So this gate measures. Chromium emulates
 * `forced-colors: active`, and every element on each page must compute
 * `backdrop-filter: none`, in light and in dark.
 *
 * The pages are the ones that wear Crystal's surfaces, plus a harness of every
 * surface the installed `surfaces.json` names (its class and its `also`
 * selectors) and the controls D-36 found keeping a blur: the status badge, the
 * tag, the count, the native choices and the range. The harness is built from the
 * installed vocabulary, so a surface added to Crystal is checked without
 * editing this file.
 *
 * It is not vacuous: without forced colours the same pages must show at least
 * one blur, or the gate fails for measuring nothing.
 *
 * Seen failing on @crystal-ui/core 2.3.1 and passing on 2.4.0 (C-R3).
 *
 *   node tools/verify-forced-colours.mjs [--base http://127.0.0.1:4321]
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:4321';
const PAGES = ['playground.html', 'docs/components.html', 'docs/materials.html', 'motion.html'];

/* An element for each surface selector a page can be given. A selector made of
   one compound (`.cr-frost.bar`, `a.cr-button`, `button`) becomes that element;
   a pseudo-element or a descendant selector names something a harness cannot
   wear on its own and is skipped, and the page specimens cover it. */
const surfaces = JSON.parse(readFileSync(resolve(ROOT, 'node_modules/@crystal-ui/core/tokens/surfaces.json'), 'utf8')).surfaces;
const selectors = [...new Set(surfaces.flatMap((s) => [s.class, ...(s.also ?? [])]))];
const elementFor = (selector) => {
  if (/::|[\s>+~]|\[/.test(selector)) return null;
  const match = /^([a-z][a-z0-9]*)?((?:\.[\w-]+)*)$/i.exec(selector);
  if (!match) return null;
  const tag = match[1] ?? 'div';
  const classes = match[2].split('.').filter(Boolean).join(' ');
  return `<${tag} class="${classes}" data-probe="${selector}"${tag === 'a' ? ' href="#"' : ''}>${selector}</${tag}>`;
};
const HARNESS = `<div id="forced-colours-probe">
  ${selectors.map(elementFor).filter(Boolean).join('\n  ')}
  <span class="cr-status" data-status="info" data-probe=".cr-status">status</span>
  <span class="cr-tag cr-resin-haze" data-probe=".cr-tag">tag</span>
  <span class="cr-resin-haze count" data-probe=".cr-resin-haze.count">3</span>
  <label><input type="checkbox" data-probe="checkbox"> checkbox</label>
  <label><input type="radio" data-probe="radio"> radio</label>
  <label><input type="checkbox" role="switch" data-probe="switch"> switch</label>
  <label><input type="range" data-probe="range"> range</label>
</div>`;
const skipped = selectors.filter((s) => !elementFor(s));

/* Every element on the page whose computed backdrop filter is not `none`. */
const blurred = () => [...document.querySelectorAll('body *')]
  .map((el) => {
    const cs = getComputedStyle(el);
    const value = cs.backdropFilter !== 'none' ? cs.backdropFilter : cs.webkitBackdropFilter;
    if (!value || value === 'none') return null;
    const name = el.dataset.probe
      ?? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${[...el.classList].map((c) => '.' + c).join('')}`;
    return `${name}: ${value}`;
  })
  .filter(Boolean);

const browser = await chromium.launch();
const failures = [];
const report = { pages: PAGES.length, surfaceSelectors: selectors.length, skipped, checked: 0, blurredWithoutForcedColours: 0 };

for (const path of PAGES) {
  for (const scheme of ['light', 'dark']) {
    for (const forced of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme, forcedColors: forced ? 'active' : 'none' });
      const page = await context.newPage();
      const response = await page.goto(`${BASE}/${path}`, { waitUntil: 'load' });
      if (!response || !response.ok()) {
        console.error(`Cannot reach ${BASE}/${path}`);
        process.exit(1);
      }
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate((html) => document.body.insertAdjacentHTML('beforeend', html), HARNESS);
      const found = await page.evaluate(blurred);
      if (forced) {
        report.checked += await page.evaluate(() => document.querySelectorAll('body *').length);
        for (const f of found) failures.push(`${path} (${scheme}): ${f}`);
      } else {
        report.blurredWithoutForcedColours += found.length;
      }
      await context.close();
    }
  }
}
await browser.close();

if (!report.blurredWithoutForcedColours) failures.push('No element has a backdrop filter even without forced colours: the gate measured nothing.');
console.log(JSON.stringify({ ...report, failures }, null, 2));
process.exit(failures.length ? 1 : 0);
