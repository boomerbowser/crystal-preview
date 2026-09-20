#!/usr/bin/env node
/* The scroll contract.
 *
 * A team member found this on a phone, which is where it shows: every
 * horizontally scrollable table on the specification pages had
 * `overscroll-behavior: auto`, so a swipe that reached the end of a table
 * scrolled the page underneath instead. That reads as the table refusing to
 * move, and it is invisible on a desktop with a mouse.
 *
 * Four things every scroll container in Crystal owes, checked on a phone
 * viewport and a desktop one because the failures differ:
 *
 *   1. It does not chain. `overscroll-behavior: contain` keeps a swipe inside
 *      the thing being swiped.
 *   2. It does not shift. `scrollbar-gutter: stable` stops content jumping when
 *      a scrollbar appears, which is what makes a growing list jitter. Asked of
 *      vertical scrollers only: the gutter is reserved on the inline edge, so on
 *      a horizontal-only scroller it reserves space against a scrollbar that
 *      never arrives and shifts nothing.
 *   3. It carries a Crystal scrollbar, not the operating system's. One of two:
 *      Frost for panels and reading surfaces, Resin for control planes.
 *   4. It actually scrolls. A container styled as scrollable that has nothing to
 *      scroll is a container whose overflow is a mistake.
 *
 * Run: node tools/verify-scroll.mjs   (needs the preview server on 4321)
 */
import { chromium, devices } from 'playwright';

const ORIGIN = process.env.CRYSTAL_ORIGIN || 'http://localhost:4321';
const PAGES = [
  'index.html', 'playground.html', 'motion.html',
  'docs/materials.html', 'docs/components.html', 'docs/tokens.html', 'docs/catalogue.html',
];

/* The two Crystal scrollbars, by the thumb colour each resolves to. Checking the
   resolved value rather than the class name is what makes this a check of what
   renders rather than of what was written. */
const CRYSTAL_SCROLLBAR = /rgba?\(/;

const browser = await chromium.launch();
const failures = [];
let checked = 0;

for (const [label, contextOptions] of [
  ['phone', devices['iPhone 13']],
  ['desktop', { viewport: { width: 1280, height: 900 } }],
]) {
  for (const page of PAGES) {
    const context = await browser.newContext(contextOptions);
    const tab = await context.newPage();
    await tab.goto(`${ORIGIN}/${page}`, { waitUntil: 'load' });
    await tab.waitForTimeout(700);

    /* A closed dialog has no layout, so a contract checked only on what is on
       screen never sees one — and a dialog is a scroll container with a material
       of its own. `show` rather than `showModal` because only one dialog may be
       modal at a time and the page may have several; what is being measured is
       the container, not the modality. */
    await tab.evaluate(() => {
      for (const dialog of document.querySelectorAll('dialog')) {
        if (!dialog.open) dialog.show();
      }
    });
    await tab.waitForTimeout(200);

    const found = await tab.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        const scrollsY = el.scrollHeight > el.clientHeight + 2;
        const scrollsX = el.scrollWidth > el.clientWidth + 2;
        const declared = /(auto|scroll|overlay)/.test(cs.overflowX + cs.overflowY);
        if (!declared || (!scrollsX && !scrollsY)) continue;
        /* The document itself is the page scroll and is the browser's to own. */
        if (el === document.documentElement || el === document.body) continue;
        out.push({
          name: (el.className || el.tagName).toString().trim().slice(0, 40),
          overscrollBehavior: cs.overscrollBehavior,
          scrollbarGutter: cs.scrollbarGutter,
          scrollbarColor: cs.scrollbarColor,
          scrolls: [scrollsX && 'x', scrollsY && 'y'].filter(Boolean).join('+'),
          /* Not "is it wide", but "can it ever scroll down": a gutter reserved
             on a surface whose block axis is clipped is space nothing will use. */
          canScrollY: !/(hidden|clip)/.test(cs.overflowY),
        });
      }
      return out;
    });

    for (const container of found) {
      checked += 1;
      const where = `${label} · ${page} · ${container.name}`;
      if (!/contain|none/.test(container.overscrollBehavior)) {
        failures.push(`${where}: chains its scroll (overscroll-behavior: ${container.overscrollBehavior})`);
      }
      if (container.scrolls.includes('y') && container.scrollbarGutter === 'auto') {
        failures.push(`${where}: no stable scrollbar gutter, so content shifts when the scrollbar appears`);
      }
      /* The other half of the same contract, and the one that had no gate: a
         gutter reserved against a scrollbar that can never appear. A container
         that scrolls across and not down is a horizontal scroller, and the 12px
         it holds on the inline edge prevents no shift — `overflow-x: auto` alone
         makes `overflow-y` compute to `auto`, which is how the gutter gets there
         without anybody asking for it. `.cr-scroll-x` is how a horizontal-only
         scroller says what CSS cannot work out.

         Deliberately not "does not scroll down *yet*": a short list that may grow
         is exactly what the gutter is for, and such a list does not scroll across
         either, so it cannot reach this branch. */
      const horizontalOnly = container.scrolls === 'x';
      if ((horizontalOnly || !container.canScrollY) && container.scrollbarGutter !== 'auto') {
        failures.push(`${where}: reserves a gutter it cannot use (scrollbar-gutter: ${container.scrollbarGutter} on a horizontal scroller) — add .cr-scroll-x`);
      }
      if (!CRYSTAL_SCROLLBAR.test(container.scrollbarColor)) {
        failures.push(`${where}: uses the operating system's scrollbar (scrollbar-color: ${container.scrollbarColor})`);
      }
    }
    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.error(`${failures.length} scroll contract failure(s):\n`);
  for (const failure of failures) console.error('  - ' + failure);
  console.error('\nEvery scroll container takes .cr-scroll-frost or .cr-scroll-resin, or is a');
  console.error('Crystal surface that already carries one.');
  process.exit(1);
}
console.log(`${checked} scroll containers across ${PAGES.length} pages, on phone and desktop: all within the contract.`);
