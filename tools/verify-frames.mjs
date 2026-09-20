/* Visual regression gate: capture the frame set now and compare it against the
 * committed baselines. Exits non-zero on any difference.
 *
 * A difference is not automatically a failure of the code — it may be an
 * intended change — but it is always a failure of *this check*, and the
 * re-blessing procedure in validation/frames.json says what to do next. The
 * point is that a pixel cannot change without somebody saying why.
 *
 *   node tools/verify-frames.mjs
 *   node tools/verify-frames.mjs --bless       (replace the baselines)
 *   node tools/verify-frames.mjs --no-webgl    (gate G8: prove the CSS floor)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const BASELINES = join(ROOT, 'validation/baselines');
const BLESS = process.argv.includes('--bless');
/* Gate G8: with WebGL2 unavailable, every page must still render exactly the
   committed baselines — the optical layer is an enhancement on top of a complete
   CSS floor, never a requirement.
   This used to be run by passing a capture directory to this script, which it
   has never accepted: the flag was ignored, the frames were recaptured with
   WebGL available, and the gate reported a pass that asserted nothing. */
const NO_WEBGL = process.argv.includes('--no-webgl');
if (BLESS && NO_WEBGL) {
  console.error('Refusing to bless baselines captured without WebGL2.');
  process.exit(2);
}

/* Frames that deliberately photograph the optical layer cannot be compared with
   that layer switched off — they are the enhancement being disabled. They are
   named and skipped rather than quietly passing. */
const frameSet = JSON.parse(readFileSync(join(ROOT, 'website/verification/frames.json'), 'utf8'));
const ambientFrames = new Set(
  frameSet.frames.filter((f) => f.ambient === 'rest').map((f) => `${f.id}.png`),
);

const work = mkdtempSync(join(tmpdir(), 'crystal-frames-'));
execFileSync('node', [join(HERE, 'capture-frames.mjs'), '--out', work, ...(NO_WEBGL ? ['--no-webgl'] : [])], { stdio: 'inherit' });

const all = readdirSync(work).filter((f) => f.endsWith('.png')).sort();
const skipped = NO_WEBGL ? all.filter((f) => ambientFrames.has(f)) : [];
const shots = all.filter((f) => !skipped.includes(f));
const differing = [];
const missing = [];

for (const name of shots) {
  const baseline = join(BASELINES, name);
  if (!existsSync(baseline)) { missing.push(name); continue; }
  try {
    /* The allowance absorbs GPU rasterisation dither on gradients, which varies
       between runs on the same machine. It cannot absorb a visible change:
       compare-captures.py fails on any pixel past --visible-delta however few
       there are, and tests/visual-gate-contracts.py proves that. */
    execFileSync('python3', [join(HERE, 'compare-captures.py'), baseline, join(work, name),
      '--tolerance', '2', '--max-differing', '400'], { stdio: 'pipe' });
  } catch (error) {
    differing.push({ name, detail: (error.stdout?.toString() || '').trim().split('\n').pop() });
  }
}

if (BLESS) {
  for (const name of shots) copyFileSync(join(work, name), join(BASELINES, name));
  console.log(JSON.stringify({ blessed: shots.length, baselines: 'validation/baselines' }, null, 2));
  console.log('Baselines replaced. Record why in the capture directory README before committing.');
  process.exit(0);
}

console.log(JSON.stringify({
  suite: NO_WEBGL ? 'visual regression (WebGL2 blocked)' : 'visual regression',
  webgl2: NO_WEBGL ? 'blocked' : 'available',
  frames: shots.length,
  identical: shots.length - differing.length - missing.length,
  differing,
  missingBaseline: missing,
  ...(skipped.length ? { skipped, why: 'these frames photograph the optical layer, which this run disables' } : {}),
}, null, 2));

if (differing.length || missing.length) {
  console.error('\nA frame differs from its baseline. Look at both images before deciding.');
  console.error('If the change is intended, follow the re-blessing procedure in validation/frames.json,');
  console.error('then re-run with --bless and explain the change in the commit.');
  process.exit(1);
}
