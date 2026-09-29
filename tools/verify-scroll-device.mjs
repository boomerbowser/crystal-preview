#!/usr/bin/env node
/* The scroll contract, on a real phone (Crystal's D-4).
 *
 * `verify-scroll.mjs` checks every scroll container on an emulated phone and a
 * desktop. The phone leg proves behaviour — a swipe does not chain — but not
 * appearance, because Playwright's mobile emulation uses overlay scrollbars on
 * which `scrollbar-gutter` does nothing, and whatever a person's thumb meets on a
 * device is something emulation cannot answer. Meridian ruled on 29 September
 * 2026 that a real Android phone closes it.
 *
 * So this runs the same contract in Chrome on a connected phone, and adds the
 * one question only a device can answer: **does content shift when a scrollbar
 * appears?** That is what `scrollbar-gutter: stable` exists to prevent. Each
 * vertical scroll container's content width is measured as it is, and again with
 * its block overflow switched off; if the scrollbar the device draws takes room,
 * the two differ unless the gutter reserved it. On an overlay-scrollbar device
 * they are equal by construction, and the measurement says so rather than
 * assuming it. A screenshot of each page is kept for looking at.
 *
 * Needs, on the phone: USB debugging on and this computer allowed; Chrome, with
 * "Enable command line on non-rooted devices" turned on in chrome://flags
 * (Playwright's Android driver requires it). On this computer: `adb` on the
 * path, and the preview served on 4321 — the phone reaches it through
 * `adb reverse`, which this script sets up.
 *
 *   npm run verify:scroll:device [-- --keep <dir>]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { _android as android } from 'playwright';

const PORT = 4321;
const PAGES = [
  'index.html', 'playground.html', 'motion.html',
  'docs/materials.html', 'docs/components.html', 'docs/tokens.html', 'docs/catalogue.html',
];
const keepAt = process.argv.indexOf('--keep');
const KEEP = keepAt === -1 ? null : process.argv[keepAt + 1];
if (KEEP) mkdirSync(KEEP, { recursive: true });

const [device] = await android.devices();
if (!device) {
  console.error('No Android device is connected. Connect a phone with USB debugging on, allow this computer, and run again.');
  process.exit(2);
}
const MODEL = device.model();
execFileSync('adb', ['-s', device.serial(), 'reverse', `tcp:${PORT}`, `tcp:${PORT}`]);
console.log(`Device: ${MODEL} (${device.serial()}), reaching the preview on localhost:${PORT}.`);

await device.shell('am force-stop com.android.chrome');
const context = await device.launchBrowser();
const failures = [];
const measured = [];

for (const page of PAGES) {
  const tab = await context.newPage();
  await tab.goto(`http://localhost:${PORT}/${page}`, { waitUntil: 'load' });
  await tab.waitForTimeout(900);
  await tab.evaluate(() => {
    for (const dialog of document.querySelectorAll('dialog')) if (!dialog.open) dialog.show();
  });
  await tab.waitForTimeout(200);

  const found = await tab.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      if (el === document.documentElement || el === document.body) continue;
      const cs = getComputedStyle(el);
      const scrollsY = el.scrollHeight > el.clientHeight + 2;
      const scrollsX = el.scrollWidth > el.clientWidth + 2;
      if (!/(auto|scroll|overlay)/.test(cs.overflowX + cs.overflowY) || (!scrollsX && !scrollsY)) continue;
      /* Does a scrollbar appearing move the content? The content box as it is,
         and with the block overflow off, so no scrollbar can be drawn. */
      let shift = null;
      if (scrollsY) {
        const withBar = el.clientWidth;
        const before = el.style.overflowY;
        el.style.overflowY = 'hidden';
        const without = el.clientWidth;
        el.style.overflowY = before;
        shift = without - withBar;
      }
      out.push({
        name: (el.className || el.tagName).toString().trim().slice(0, 40),
        overscrollBehavior: cs.overscrollBehavior,
        scrollbarGutter: cs.scrollbarGutter,
        scrollbarColor: cs.scrollbarColor,
        scrollsY,
        shift,
      });
    }
    return out;
  });

  for (const container of found) {
    const where = `${MODEL} · ${page} · ${container.name}`;
    measured.push({ where, ...container });
    if (!/contain|none/.test(container.overscrollBehavior)) failures.push(`${where}: chains its scroll (overscroll-behavior: ${container.overscrollBehavior})`);
    if (!/rgba?\(/.test(container.scrollbarColor)) failures.push(`${where}: uses the operating system's scrollbar (scrollbar-color: ${container.scrollbarColor})`);
    if (container.scrollsY && container.shift !== 0) failures.push(`${where}: content shifts ${container.shift}px when its scrollbar appears (scrollbar-gutter: ${container.scrollbarGutter})`);
  }
  if (KEEP) await tab.screenshot({ path: `${KEEP}/${page.replace(/\//g, '-').replace('.html', '')}.png`, fullPage: false });
  await tab.close();
}

await context.close();
await device.close();

console.log(JSON.stringify({
  suite: 'the scroll contract, on a phone',
  device: MODEL,
  containers: measured.length,
  vertical: measured.filter((m) => m.scrollsY).length,
  shifting: measured.filter((m) => m.scrollsY && m.shift !== 0).length,
  failures,
}, null, 2));
if (failures.length) process.exit(1);
