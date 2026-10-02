/* Drive a real browser over the frame set in validation/frames.json.
 *
 * The frame set is data: this script only knows how to realise the axes it
 * declares. Adding a frame is editing JSON; only a new axis needs a change
 * here.
 *
 * The output is compared pixel for pixel, so the capture has to be
 * deterministic. Preferences are seeded into localStorage before the page's first
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
   same capture path; a bespoke script would differ from the baselines for
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

/* Two browsers, because one Chromium switch decides whether this gate can see a
   scrollbar at all. Playwright pushes `--hide-scrollbars` whenever `headless` is
   true, so a frame captured that way has no scrollbar in it (D-4). Drop the
   flag and Chromium paints a classic 15px scrollbar, and `.cr-scroll-frost` and
   `.cr-scroll-resin` become photographable like anything else.

   It is a second browser rather than the default for every frame because the
   other seventeen baselines were captured with scrollbars hidden, and a
   page-level screenshot that gains a document scrollbar would reflow every one
   of them. Frames opt in. */
const browsers = new Map();
async function browserFor(frame) {
  const key = frame.scrollbars ? 'scrollbars' : 'default';
  if (!browsers.has(key)) {
    browsers.set(key, await chromium.launch(
      frame.scrollbars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {},
    ));
  }
  return browsers.get(key);
}
const failures = [];
const captured = [];

for (const frame of frames) {
  const context = await (await browserFor(frame)).newContext({
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
       * initial empty document, whose documentElement is then replaced by the parsed
       * one, so setting the attribute once succeeds and leaves an RTL frame that is
       * byte-identical to its LTR twin. */
      const applyDirection = () => {
        if (!document.documentElement) return;
        document.documentElement.setAttribute('dir', direction);
        /* Ambient motion was withdrawn from Crystal 2.0, and no stylesheet reads
           these attributes now, so they change nothing in a 2.x capture. They
           stay so that frames remain deterministic if ambient motion returns:
           a frame either turns it off or pins its clock at a chosen instant. */
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
    /* A 404 still fires 'load', so without this check a mistyped path would be
       captured as a baseline and the gate would then guard an error page. */
    if (!response || !response.ok()) {
      throw new Error(`HTTP ${response ? response.status() : 'no response'} for ${url}`);
    }
    /* Every declared face loaded, then one layout with all of them, before
       anything is photographed. `document.fonts.ready` alone resolves as soon as
       nothing is loading at that moment, and a face the page has not asked for
       yet is not loading. D-17: under forced colours a <select> is laid out
       natively, and one run in twenty it kept a text baseline measured before
       Manrope was in use: the glyphs painted in Manrope, 0.8px high, inside a
       box whose width did not move, so nothing reflowed around it. */
    await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((face) => face.load().catch(() => null)));
      await document.fonts.ready;
      /* A native <select> lays its own text out, and one run in twenty keeps a
         layout from before the page settled, the text 0.8px off inside a box
         that did not move. Taking each one out of the layout and putting it
         back makes the browser lay it out again, now. */
      for (const select of document.querySelectorAll('select')) {
        const display = select.style.display;
        select.style.display = 'none';
        void select.offsetHeight;
        select.style.display = display;
      }
      void document.body.offsetHeight;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    if (frame.anchor) {
      /* Re-apply the anchor: the hash is consumed before styles settle. */
      await page.evaluate((hash) => {
        const target = document.querySelector(hash);
        if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      }, frame.anchor);
    }
    await page.waitForTimeout(frame.settleMs);

    /* A frame may photograph a focused control. Without this axis nothing in
       the frame set holds focus, and a change to the ring passes every frame
       at zero tolerance.

       `:focus-visible` follows keyboard modality, so pressing Tab first is
       required: a bare `.focus()` gives `:focus` without `:focus-visible` and
       the ring does not paint. The state is then verified rather than assumed,
       as with the 404 guard above, so no frame becomes a baseline without the
       state it asked for. */
    if (frame.focus) {
      await page.keyboard.press('Tab');
      const ok = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return 'missing';
        el.focus();
        return el.matches(':focus-visible') ? 'ok' : 'not-focus-visible';
      }, frame.focus);
      if (ok !== 'ok') throw new Error(`focus target ${frame.focus}: ${ok}`);
      await page.waitForTimeout(frame.settleMs);
    }

    /* Nothing moving when the picture is taken. A settle time is a guess about
       how long motion lasts; the page can say whether any is still running. Every
       finite animation and transition is awaited, CSS and Web Animations alike,
       which is what `getAnimations` returns, bounded so a stuck one cannot hang
       the run. An infinite one is skipped: in Crystal only continuous indicators
       of pending work loop, and none is in a frame. D-17: one run in sixty
       photographed a button's rim a sub-pixel into a transition. */
    const settle = async () => page.evaluate(async () => {
      const running = document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity);
      await Promise.race([
        Promise.all(running.map((animation) => animation.finished.catch(() => null))),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await settle();

    const file = `${OUT}/${frame.id}.png`;
    /* A frame may photograph one specimen instead of the viewport. The material
       studies sit far below the fold of every 1280x900 frame, so a viewport
       frame never sees them. */
    if (frame.clip) {
      const element = await page.waitForSelector(frame.clip, { timeout: 10000 });
      await element.scrollIntoViewIfNeeded();
      await page.waitForTimeout(frame.settleMs);
      await settle();
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

for (const b of browsers.values()) await b.close();

console.log(JSON.stringify({
  base: BASE,
  webgl2: NO_WEBGL ? 'blocked' : 'available',
  out: OUT.replace(`${ROOT}/`, ''),
  captured: captured.length,
  frames: captured,
  failures,
}, null, 2));

/* A frame that could not be captured fails the run, so no frame drops out of
   the gate silently. */
if (failures.length) process.exit(1);
