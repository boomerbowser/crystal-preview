/* Prove that a state change on a real control actually plays its recipe.
 *
 * Crystal shipped fifty-nine motion recipes with two of them wired to anything. The
 * rest existed as data and played only from the catalogue's replay button, so a product
 * that had adopted Crystal got a press and a hover and nothing else. Static checks could
 * not see this: every recipe was well-formed, spring-fitted and incompressible, and none
 * of them ran.
 *
 * So the contract this file enforces is behavioural. Each case changes state the way a
 * user would — checking a box, focusing a field, opening a disclosure — and asserts that
 * the element carries a running animation of the expected recipe.
 *
 *   node tools/verify-interactions.mjs [--base http://127.0.0.1:4321]
 */
import { chromium } from 'playwright';

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://127.0.0.1:4321';

/* A scratch harness of plain controls. Deliberately not the page's own components: this
   tests the delegated wiring every adopter gets, not the studies suite's bespoke demos. */
const HARNESS = `<div id="probe">
  <input type="checkbox" id="cb">
  <input type="checkbox" role="switch" id="sw">
  <input type="range" id="rg" aria-describedby="rgv"><output for="rgv" id="out">0</output>
  <input type="text" id="tx">
  <button id="tg" aria-expanded="false" aria-controls="panel">toggle</button><div id="panel">panel</div>
  <details id="dt"><summary>summary</summary><p>body</p></details>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const response = await page.goto(`${BASE}/playground.html`, { waitUntil: 'load' });
if (!response || !response.ok()) {
  console.error(`Cannot reach ${BASE}/playground.html`);
  process.exit(1);
}
await page.evaluate(() => document.fonts.ready);
await page.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), HARNESS);

const CASES = [
  ['checkbox becomes checked', 'check', '#cb', p => p.click('#cb')],
  ['checkbox becomes unchecked', 'check-off', '#cb', p => p.click('#cb')],
  ['switch turns on', 'switch-on', '#sw', p => p.click('#sw')],
  ['switch turns off', 'switch-off', '#sw', p => p.click('#sw')],
  ['range value commits', 'slider-step', '#out',
    p => p.evaluate(() => { const r = document.getElementById('rg'); r.value = 40; r.dispatchEvent(new Event('change', { bubbles: true })); })],
  ['text field takes focus', 'field-focus', '#tx', p => p.focus('#tx')],
  ['aria-expanded opens a panel', 'menu-in', '#panel',
    p => p.evaluate(() => document.getElementById('tg').setAttribute('aria-expanded', 'true'))],
  ['aria-expanded closes a panel', 'menu-out', '#panel',
    p => p.evaluate(() => document.getElementById('tg').setAttribute('aria-expanded', 'false'))],
  ['field is marked invalid', 'field-invalid', '#tx',
    p => p.evaluate(() => document.getElementById('tx').setAttribute('aria-invalid', 'true'))],
  ['field becomes valid again', 'field-valid', '#tx',
    p => p.evaluate(() => document.getElementById('tx').setAttribute('aria-invalid', 'false'))],
  ['disclosure opens', 'accordion-in', '#dt p',
    p => p.evaluate(() => { document.getElementById('dt').open = true; })],
];

const failures = [];
for (const [label, recipe, selector, act] of CASES) {
  await page.evaluate(s => document.querySelector(s)?.getAnimations().forEach(a => a.cancel()), selector);
  await act(page);
  await page.waitForTimeout(110);
  const seen = await page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return { missing: true };
    return {
      name: el.dataset.crMotionName || '',
      running: el.getAnimations().some(a => a.playState === 'running' || a.playState === 'finished'),
      state: el.dataset.crMotionState || '',
    };
  }, selector);
  /* A short recipe can finish before this samples it, and a finished fill:none
     animation is no longer in getAnimations(). The durable evidence is the element's
     own motion state, which the runtime sets when it starts the recipe. */
  const played = ['running', 'finished', 'instant'].includes(seen.state) || seen.running;
  const ok = !seen.missing && seen.name === recipe && played;
  if (!ok) failures.push(`${label}: expected ${recipe}, saw ${JSON.stringify(seen)}`);
}

/* Reduced motion must still apply the state, and must apply it instantly. */
const reducedPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await reducedPage.emulateMedia({ reducedMotion: 'reduce' });
await reducedPage.goto(`${BASE}/playground.html`, { waitUntil: 'load' });
await reducedPage.evaluate(html => document.body.insertAdjacentHTML('beforeend', html), HARNESS);
await reducedPage.click('#cb');
await reducedPage.waitForTimeout(80);
const reduced = await reducedPage.evaluate(() => document.getElementById('cb').dataset.crMotionState);
if (reduced !== 'instant') failures.push(`reduced motion: expected an instant state, saw ${reduced || 'nothing'}`);

const report = {
  suite: 'interaction wiring',
  cases: CASES.length + 1,
  failures,
};
await browser.close();
console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
