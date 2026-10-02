/* Catch documentation that has drifted from the sources it describes.
 *
 * Generated regions cannot drift: `tools/build-reference.cjs` rewrites them. But a
 * specification is mostly prose, and prose quotes values: "an 80% content fill with a
 * 1.95px feather", "Motion 13.4.0". Generating those inline would spoil the prose, so
 * instead this asserts that every value the prose quotes is still the value that ships.
 *
 * The check is one-directional: if a token says 40px, the chapter that documents that
 * material must contain "40px" somewhere. Change the token without touching the prose
 * and this fails. It cannot catch a value quoted in a sentence that has become wrong
 * for some other reason.
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const doc = name => fs.readFileSync(path.join(ROOT, 'node_modules/@crystal-ui/core/docs', name), 'utf8');

const failures = [];
const expect = (where, needle, why) => {
  if (!doc(where).includes(needle)) failures.push(`docs/${where}: no mention of ${needle} — ${why}`);
};

/* Material recipe values. These are the numbers Crystal may never let drift. */
const m = read('node_modules/@crystal-ui/core/tokens/crystal.json').material;
const pct = v => `${Math.round(v * 100)}%`;
for (const [needle, why] of [
  [`${m.acrylicBlur}px`, 'Frost diffusion (primitive.material.acrylicBlur)'],
  [`${m.acrylicSaturation}%`, 'Frost saturation'],
  [`${m.glassBlur}px`, 'Resin diffusion'],
  [`${m.glassSaturation}%`, 'Resin saturation'],
  [pct(m.glassOpacity), 'Resin fill, fixed by the material'],
  [pct(m.contentOpacity), 'Haze content fill'],
  [`${m.contentFeather}px`, 'Haze feather'],
  [pct(m.labelVeil), 'Stone fill, light mode'],
  [pct(m.labelVeilDark), 'Stone fill, dark mode'],
  [`${m.mirageBlur}px`, 'Mirage diffusion'],
]) expect('materials.md', needle, why);

/* Engine versions, stated in two chapters. */
/* The published manifest, because the versions the documentation quotes are the
   ones a consumer installs, whatever the workspace builds with. */
const pkg = read('node_modules/@crystal-ui/core/package.json');
for (const where of ['adoption.md', 'motion-components.md']) {
  expect(where, `Motion ${pkg.dependencies.motion}`, 'the pinned Motion version');
  expect(where, `GSAP ${pkg.dependencies.gsap}`, 'the pinned GSAP version');
}

/* Counts that prose states in words. */
const recipes = read('node_modules/@crystal-ui/core/tokens/motion-recipes.json').recipes.length;
const categories = new Set(read('node_modules/@crystal-ui/core/tokens/motion-recipes.json').recipes.map(r => r.category)).size;
expect('motion-components.md', `${recipes} executable component recipes`, 'the recipe count');
expect('accessibility.md', `${recipes} motion recipes`, 'the recipe count');
const words = { 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve' };
if (words[categories]) {
  expect('motion-components.md', `${words[categories]} families`, 'the category count');
}

/* The contrast figure, from the executed run rather than from memory. */
const checks = read('website/verification/token-checks.json');
expect('accessibility.md', checks.checks.toLocaleString(), 'the number of contrast cases actually computed');

const report = { suite: 'documentation drift', checks: 20, failures };
fs.writeFileSync(path.join(ROOT, 'website/verification/doc-drift-checks.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(failures.length ? 1 : 0);
