/* Bundles the library's engines into a website asset. The engine licences are
   not copied here: they belong to @crystal-ui/core, are built in its own
   repository, ship in the package and arrive on the site through
   assemble-site.mjs. Writing them from this side would be this repository
   editing its own dependency. */
const esbuild=require('esbuild'),fs=require('node:fs');
esbuild.buildSync({entryPoints:['node_modules/@crystal-ui/core/engines.js'],bundle:true,format:'iife',globalName:'CrystalEngines',outfile:'website/assets/vendor/crystal-engines.js',minify:true,legalComments:'linked',target:['es2022']});
console.log('Bundled Motion 13.4.0 and GSAP 3.15.0 locally.');

const recipes=JSON.parse(fs.readFileSync('node_modules/@crystal-ui/core/tokens/motion-recipes.json','utf8')).recipes;fs.writeFileSync('website/assets/motion-catalog.js','window.CRYSTAL_MOTION_RECIPES = '+JSON.stringify(recipes)+';\n');
