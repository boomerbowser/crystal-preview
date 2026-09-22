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
 *   node tools/verify-frames.mjs --baselines validation/baselines-ci
 *
 * The baseline directory is a flag because a screenshot is only comparable to
 * one taken the same way, and this project has two "same ways". D-15: the
 * committed `validation/baselines` are captured on a contributor's machine, and
 * a GitHub runner does not rasterise type the way that machine does — comparing
 * the two failed 16 of 18 frames with channel deltas up to 255, worst on the
 * text-heavy frames. That is not a tolerance problem and no allowance fixes it;
 * a baseline means "what this renderer produced". So there is a second set,
 * captured on the runner by the workflow that compares against it, and CI reads
 * that one. Capture where you compare.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const BASELINES = resolve(ROOT, arg('baselines', 'validation/baselines'));
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
if (!existsSync(BASELINES)) {
  console.error(`No baseline directory at ${BASELINES}.`);
  console.error('If this is CI, the runner baselines have not been captured yet —');
  console.error('run the "Capture runner baselines" workflow and commit what it uploads.');
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

/* "Look at both images before deciding" is the instruction this gate prints, and
   until now it printed it into an environment where both images were in a
   temporary directory that the process deleted on the way out. On a runner that
   leaves nobody anything to look at: a failure names a frame, gives a pixel
   count, and offers no way to see what changed. So a failing run writes the pair
   — what it captured and what it expected — somewhere the job can upload.
   Only the differing frames, because twenty-three of everything is noise around
   the one that matters. */
const KEEP = arg('keep', null);
if (KEEP && differing.length) {
  const out = resolve(ROOT, KEEP);
  mkdirSync(out, { recursive: true });
  for (const { name } of differing) {
    copyFileSync(join(work, name), join(out, `actual-${name}`));
    if (existsSync(join(BASELINES, name))) {
      copyFileSync(join(BASELINES, name), join(out, `expected-${name}`));
    }
  }
  console.error(`\nWrote ${differing.length * 2} image(s) to ${KEEP} — actual- and expected- for each frame.`);
}

if (differing.length || missing.length) {
  console.error('\nA frame differs from its baseline. Look at both images before deciding.');
  console.error('If the change is intended, follow the re-blessing procedure in validation/frames.json,');
  console.error('then re-run with --bless and explain the change in the commit.');
  process.exit(1);
}
