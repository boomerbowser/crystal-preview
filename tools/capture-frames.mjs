/* Drive a real browser over the frame set in validation/frames.json.
 *
 * The frame set is data, not code: this script only knows how to realise the
 * axes it declares. Adding a frame is editing JSON; adding an *axis* is the
 * only thing that needs a change here.
 *
 * Determinism is the whole point, because the output is compared pixel for
 * pixel. Preferences are seeded into localStorage before the page's first
 * script runs rather than clicked through the interface: clicking animates,
 * and an animation in flight makes the capture depend on timing. Fonts are
 * awaited for the same reason.
 *
 *   node tools/capture-frames.mjs --out validation/captures/<dir>
 *   node tools/capture-frames.mjs --out <dir> --only forced-colours-dark
 *   node tools/capture-frames.mjs --out <dir> --base http://127.0.0.1:4321
 */
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

const BASE = arg('base', 'http://127.0.0.1:4321');
const OUT = resolve(ROOT, arg('out', 'website/verification/captures/latest'));
const ONLY = arg('only', null);
/* Gate G6: prove the optical shader layer is an enhancement by capturing the
   whole frame set with WebGL2 made unavailable. The result must match the
   committed baselines exactly, which is only meaningful if it runs through this
   same capture path — a bespoke script would differ from the baselines for
   reasons that have nothing to do with shaders. */
const NO_WEBGL = process.argv.includes('--no-webgl');

const set = JSON.parse(readFileSync(resolve(ROOT, 'website/verification/frames.json'), 'utf8'));
const frames = set.frames
  .map((f) => ({ ...set.defaults, ...f }))
  .filter((f) => !ONLY || f.id === ONLY);

if (!frames.length) {
  console.error(ONLY ? `No frame named "${ONLY}".` : 'The frame set is empty.');
  process.exit(1);
}

/* The preview stores preferences under this key and normalises them on load,
   so an out-of-range value here cannot produce an undefined rendering. */
const STORAGE_KEY = 'crystal-design-system-v1';

const preferencesFor = (frame) => ({
  palette: frame.palette,
  mode: frame.mode,
  density: frame.density,
  /* "opaque" is the product-level fallback and is a stored preference.
     "reduced-transparency" is the operating system asking, and is emulated
     as a media feature below instead. */
  reduced: frame.effects === 'opaque',
  reduceMotion: false,
});

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const failures = [];
const captured = [];

for (const frame of frames) {
  const context = await browser.newContext({
    viewport: frame.viewport,
    colorScheme: frame.mode === 'dark' ? 'dark' : 'light',
    forcedColors: frame.forcedColors === 'active' ? 'active' : 'none',
    deviceScaleFactor: 1,
  });

  await context.addInitScript(
    ([key, prefs, direction, ambient, clock]) => {
      try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* private mode */ }
      /* Set before first paint so no frame renders in the wrong direction.
       *
       * This has to be re-applied on DOMContentLoaded. An init script runs against the
       * initial empty document, whose documentElement is then REPLACED by the parsed
       * one — so setting the attribute once succeeds, silently does nothing, and leaves
       * an RTL frame that is byte-identical to its LTR twin. That is exactly what had
       * happened: the direction axis guarded nothing until this was fixed. */
      const applyDirection = () => {
        if (!document.documentElement) return;
        document.documentElement.setAttribute('dir', direction);
        /* Ambient motion is a material's declared rest state, so by default these
           surfaces are moving, and a moving surface cannot be captured
           deterministically. Most frames therefore photograph the material still.
           That was once true of ALL of them, which meant no reference frame had
           ever contained an ambient surface — and a Resin rest shader pinned at
           full press deformation reached the preview with every gate green.
           A frame may now instead pin the ambient clock, which freezes the effect
           at a chosen instant and makes it as reviewable as anything else. */
        if (ambient === 'rest') {
          document.documentElement.setAttribute('data-ambient-clock', clock);
          /* The CSS tier seeks by negative delay, so it needs the value as a time. */
          document.documentElement.style.setProperty('--cr-ambient-clock', clock + 's');
        }
        else document.documentElement.setAttribute('data-ambient', 'off');
      };
      applyDirection();
      document.addEventListener('DOMContentLoaded', applyDirection);
    },
    [STORAGE_KEY, preferencesFor(frame), frame.direction, frame.ambient, String(frame.ambientClock)],
  );

  if (NO_WEBGL) {
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (String(type).startsWith('webgl')) return null;
        return original.call(this, type, ...rest);
      };
    });
  }

  const page = await context.newPage();

  /* prefers-reduced-transparency has no emulateMedia option, so ask the
     protocol directly. Anything emulateMedia does cover is set on the context. */
  if (frame.effects === 'reduced-transparency') {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
    });
  }

  const url = `${BASE}/${frame.page}${frame.anchor || ''}`;
  try {
    const response = await page.goto(url, { waitUntil: 'load' });
    /* A 404 still fires 'load', so without this a mistyped path is captured as a
       baseline and the gate then guards an error page forever. That is not
       hypothetical: the icons frame pointed at icons.html instead of
       docs/icons.html and its committed baseline was a screenshot of the
       server's 404. A capture harness must never bless a page it did not get. */
    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response ? response.status() : 'no response'} for ${url}`);
    }
    await page.evaluate(() => document.fonts.ready);
    if (frame.anchor) {
      /* Re-apply the anchor: the hash is consumed before styles settle. */
      await page.evaluate((hash) => {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, frame.anchor);
    }
    await page.waitForTimeout(frame.settleMs);

    const file = `${OUT}/${frame.id}.png`;
    /* A frame may photograph one specimen instead of the viewport. The material
       studies sit far below the fold of every 1280x900 frame, so nothing that
       happens to them has ever been visible to this gate. */
    if (frame.clip) {
      const element = await page.waitForSelector(frame.clip, { timeout: 10000 });
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(frame.settleMs);
      await element.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file });
    }
    captured.push(frame.id);
  } catch (error) {
    failures.push({ id: frame.id, url, error: error.message.split('\n')[0] });
  } finally {
    await context.close();
  }
}

await browser.close();

console.log(JSON.stringify({
  base: BASE,
  webgl2: NO_WEBGL ? 'blocked' : 'available',
  out: OUT.replace(`${ROOT}/`, ''),
  captured: captured.length,
  frames: captured,
  failures,
}, null, 2));

/* A frame that could not be captured is a failure, not a skipped test: a
   regression harness that silently drops frames stops guarding them. */
if (failures.length) process.exit(1);
