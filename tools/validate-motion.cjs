const assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('node_modules/@crystal-ui/core/tokens/motion-recipes.json','utf8')),ids=new Set();
/* Every recipe must carry a spring whose settling time reproduces the authored
   duration. Duration stays the authority: the spring is fitted to it, so a
   disagreement means someone changed one without the other. */
const spring=require('../node_modules/@crystal-ui/core/assets/core/spring.js');
const SPRING_TOLERANCE=0.15;

/* A fluid is incompressible. Squeeze it on one axis and it must expand on the
   other by exactly the reciprocal, or it is not liquid — it is rubber losing
   volume, which is precisely how the 1.x deformations read. */
const AREA_TOLERANCE=0.005;
/* A recipe whose keyframes are all identical occupies a duration and a spring and
   animates nothing. Eleven of the fifty-four shipped that way — [{opacity:1},{opacity:1}]
   placeholders that passed every check, because the only keyframe contract was that there
   were at least two of them. Counting keyframes is not the same as requiring movement.

   The test is that *some* keyframe differs, not that the first differs from the last: a
   pulse (press) and a shake (field-invalid) correctly return to where they started. */
const withoutOffset=frame=>{const{offset,...rest}=frame;return JSON.stringify(rest);};
for(const recipe of data.recipes){
  /* A travelling loop moves at constant speed around a perimeter. There is no
     displacement returning to rest, so there is no spring to fit and a fitted
     one would be a fiction — the honest description is linear. Every other
     recipe is a damped oscillator and must carry its physics. */
  const travelling = recipe.loop && recipe.direction === 'normal';
  assert(new Set(recipe.keyframes.map(withoutOffset)).size>1,
    recipe.id+' has no movement: every keyframe is identical, so it animates nothing');
  if (travelling) {
    /* Exempt from the spring contract ONLY. Every other rule below still
       applies: an exemption that skips the rest of the loop is how a recipe
       stops being checked at all. */
    assert(!recipe.spring, recipe.id+' is a travelling loop and must not carry a spring');
    assert(recipe.easing === 'linear', recipe.id+' travels, so its easing must be linear');
  } else {
    assert(recipe.spring, recipe.id+' has no spring; run tools/fit-springs.cjs --write');
    const settle=spring.settleTime(recipe.spring);
    const drift=Math.abs(settle-recipe.duration)/recipe.duration;
    assert(drift<=SPRING_TOLERANCE,recipe.id+' spring settles in '+settle+'ms but is authored at '+recipe.duration+'ms');
  }
  for(const frame of recipe.keyframes){
    for(const match of (frame.transform||'').matchAll(/scale\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/g)){
      const area=Number(match[1])*Number(match[2]);
      assert(Math.abs(area-1)<=AREA_TOLERANCE,
        recipe.id+' deformation "'+match[0]+'" has area '+area.toFixed(4)+'; a fluid conserves volume');
    }
  }
assert(!ids.has(recipe.id),'Duplicate recipe '+recipe.id);ids.add(recipe.id);/* Crystal's 5000ms ceiling protects responsiveness: nobody may be stranded
   inside a transition. An ambient loop is not a transition anybody waits for —
   it never blocks an interaction and never gates a state change — so its limit
   is about character instead. Two seconds is right for a gesture that repeats
   in place, like a breath; it is wrong for one that travels a full perimeter,
   which at that speed reads as a spinner rather than as light moving over a
   surface. A travelling recipe declares itself and gets the wider bound. */
const ceiling = recipe.loop && recipe.direction === 'normal' ? 8000 : 2000;
assert(recipe.duration>0&&recipe.duration<=ceiling,
  recipe.id+' duration '+recipe.duration+'ms exceeds the '+ceiling+'ms limit for its kind');assert(['Motion','GSAP'].includes(recipe.engine));assert(recipe.use&&recipe.reduced&&recipe.material&&recipe.signature);assert(recipe.keyframes.length>=2);for(const frame of recipe.keyframes){for(const match of (frame.transform||'').matchAll(/translate[XYZ]?\((-?[\d.]+)px/g))assert(Math.abs(Number(match[1]))<=50||recipe.travelException,recipe.id+' requires a documented large-travel exception');}}
/* The engine versions exist in three places and all three have to agree.
 *
 * The installed `@crystal-ui/core` manifest is the authority: gsap and motion are @crystal-ui/core's
 * runtime contract, and a consumer installs whatever it declares. The workspace
 * manifest needs them too, because `tools/build-motion.cjs` bundles the
 * preview's `assets/vendor/crystal-engines.js` out of them at build time — a
 * build-time need, not a published one. And the lockfile is what actually gets
 * installed.
 *
 * Two manifests naming the same version is the kind of duplication CONTRACT §1
 * is about, and the answer here is not to remove one but to make the agreement a
 * checked invariant: core states it, the workspace matches it, the lockfile
 * resolves to it. Any one of the three moving alone fails. */
const core=JSON.parse(fs.readFileSync('node_modules/@crystal-ui/core/package.json','utf8'));
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
for(const name of ['motion','gsap']){
  const declared=core.dependencies[name];
  assert(declared,`@crystal-ui/core does not declare ${name}`);
  assert.equal(pkg.devDependencies[name],declared,
    `the workspace builds the engine bundle from ${name} ${pkg.devDependencies[name]} while @crystal-ui/core ships ${declared}`);
  assert.equal(lock.packages['node_modules/'+name].version,declared,
    `the lockfile installs ${name} ${lock.packages['node_modules/'+name].version}, not the ${declared} @crystal-ui/core declares`);
}
assert(fs.statSync('website/assets/vendor/crystal-engines.js').size>1000,'Missing real engine bundle');

/* The browser reads assets/motion-catalog.js, not the JSON. They are the same
   data through a generator, so they can silently diverge: correcting a recipe
   and forgetting `npm run build:motion` leaves the page serving the old
   motion while every source-level check passes. That happened once during the
   incompressibility work and was caught in the browser rather than here. */
const catalogText=fs.readFileSync('website/assets/motion-catalog.js','utf8');
const catalog=JSON.parse(catalogText.replace(/^window\.CRYSTAL_MOTION_RECIPES = /,'').replace(/;\s*$/,''));
assert.deepEqual(catalog,data.recipes,
  'assets/motion-catalog.js is stale; run: npm run build:motion');

const result={recipes:ids.size,categories:new Set(data.recipes.map(r=>r.category)).size,engines:Object.fromEntries(['motion','gsap'].map(n=>[n,core.dependencies[n]])),staticContracts:'passed'};
fs.writeFileSync('website/verification/motion-static-checks.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
