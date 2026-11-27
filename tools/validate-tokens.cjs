'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const name of ['tokens.js','prismata.js'])vm.runInContext(fs.readFileSync(path.join(root,'node_modules/@prismata/core/assets',name),'utf8'),ctx);
const C=ctx.window.Prismata,D=ctx.window.PRISMATA_TOKENS;
const fromHex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const toHex=a=>'#'+a.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
const over=(fg,bg,alpha)=>toHex(fromHex(fg).map((v,i)=>v*alpha+fromHex(bg)[i]*(1-alpha)));
/* An `rgba(r, g, b, a)` string composited onto an opaque hex background, so a
   translucent token can be measured as what the eye actually receives. */
const flatten=(value,background)=>{
  const parts=/^rgba?\(([^)]+)\)$/.exec(value.trim());
  if(!parts)return value;
  const [r,g,b,a=1]=parts[1].split(',').map(Number);
  return toHex([r,g,b].map((v,i)=>v*a+fromHex(background)[i]*(1-a)));
};
const results=[],failures=[];function check(label,a,b,min,details){const ratio=C.contrast(a,b);const result={label,ratio:Number(ratio.toFixed(4)),minimum:min,...details};results.push(result);if(ratio+1e-9<min)failures.push(result);}
for(const palette of Object.keys(D.palettes))for(const mode of ['light','dark']){
 const p=D.palettes[palette].modes[mode],config={palette,mode};
 check('Inactive Mica text',p.text,D.material.micaInactive[mode],4.5,{palette,mode,kind:'inactive-foundation'});
 assert.equal(C.resolve(config,mode)['--pr-mica-inactive'],D.material.micaInactive[mode]);
 for(const pair of C.audit(config,mode))check(pair.label,pair.foreground,pair.background,pair.minimum,{palette,mode,kind:'solid'});
 for(const background of [p.surface,p.primarySoft])check('Compact control marker',p.primary,background,3,{palette,mode,kind:'control-marker'});
 /* Text marks (D-34). A highlight is `mark`, on-primary-soft ink on the
    primary-soft fill. The editor's selection is a 28% primary tint under
    unchanged body ink, over the surface or the field shell's Haze well. */
 check('Highlight (mark) text',p.onPrimarySoft,p.primarySoft,4.5,{palette,mode,kind:'text-mark'});
 for(const [label,base] of [['Editor selection on the surface',p.surface],['Editor selection on Haze',flatten(C.resolve(config,mode)['--pr-haze-fill'],p.surface)]])
  check(label,p.text,over(p.primary,base,.28),4.5,{palette,mode,kind:'text-mark'});
 /* A highlighted word that is then selected takes the action pair (D-39). The
    selection tint over the highlight measured 3.74:1 in Harbor. */
 check('Selected highlight',p.onPrimary,p.primary,4.5,{palette,mode,kind:'text-mark'});
 /* A scrollbar thumb is a control, and it has to be seen against the surface it
    scrolls. It must never take the material's own surface colour, which matches
    the panel behind it (white on white on a light Frost panel). 3:1 is the
    non-text bar, checked against every background a Prismata panel can be. */
 for(const [label,token] of [['Frost scrollbar thumb','--pr-scrollbar-frost-thumb'],
                             ['Resin scrollbar thumb','--pr-scrollbar-resin-thumb']]){
  const value=C.resolve(config,mode)[token];
  for(const background of [p.surface,p.surfaceAlt,p.canvas]){
   check(label,flatten(value,background),background,3,{palette,mode,token,background,kind:'scrollbar'});
  }
 }
 for(const backdrop of ['#000000','#ffffff','#ff0000','#00ff00','#0000ff','#ffff00','#00ffff','#ff00ff']){
  // A 79% lower bound allows a small feather tail inside the padded reading area.
  for(const alpha of [.79,D.material.contentOpacity]){
   const bg=over(p.surface,backdrop,alpha);
   check('Content body over RGB corner',p.text,bg,4.5,{palette,mode,backdrop,alpha,kind:'content-composite'});
   check('Content supporting text over RGB corner',C.resolve(config,mode)['--pr-content-muted'],bg,4.5,{palette,mode,backdrop,alpha,kind:'content-composite'});
   check('Authored content over RGB corner',C.resolve(config,mode)['--pr-content-own-text'],over(p.contentOwnSurface||p.primarySoft,backdrop,alpha),4.5,{palette,mode,backdrop,alpha,kind:'content-composite'});
  }
  // Context light remains beneath Haze; RGB-corner bounds include every palette gradient. Resin controls: 20% body, inset 80% Haze, with the brightest optical highlight under the protective reading fill.
  for(const [label,base,ink] of [['Neutral',p.surface,p.text],['Selected',p.contentOwnSurface||p.primarySoft,C.resolve(config,mode)['--pr-content-own-text']]])for(const sheen of [0,.19]){
   const resin=over(p.surface,backdrop,.2),light=over('#ffffff',resin,sheen),background=over(base,light,.79);
   check(label+' Resin/Haze control label',ink,background,4.5,{palette,mode,backdrop,sheen,kind:'control-composite'});
  }
  for(const tint of [D.material.glassOpacity]) {
   const glass=over(p.surface,backdrop,tint);
   // Upper optical sheen can add up to 23% white behind the mode-specific label veil.
   for(const labelDelta of [0,-.01])for(const sheen of [0,.23]){const body=over('#ffffff',glass,sheen);const label=over(p.surface,body,(mode==='dark'?D.material.labelVeilDark:D.material.labelVeil)+labelDelta);check('Protected glass label over RGB corner',p.text,label,4.5,{palette,mode,backdrop,tint,sheen,labelDelta,kind:'label-composite'});}
  }
 }
 const m=mode==='dark'?.29:.24,n=mode==='dark'?.23:.19;
 for(const first of [0,.45*m,.9*m])for(const second of [0,.45*n,.9*n]){
  const bg=over(p.decorative,over(p.companion,p.canvas,second),first);
  check('Foundation text',p.text,bg,4.5,{palette,mode,first,second,kind:'foundation-composite'});
  check('Foundation supporting text',C.resolve(config,mode)['--pr-foundation-muted'],bg,4.5,{palette,mode,first,second,kind:'foundation-composite'});
 }
 for(const translucency of [35,48,85])assert.ok(C.resolve({palette,translucency},mode)['--pr-glass-fill'].endsWith(', 0.2)'));
 assert.match(C.exportCSS(config),/:root\[data-prismata-mode="dark"\]/);
 const output=C.exportJSON(config);assert.equal(output.configuration.palette,palette);assert.equal(output.resolved.dark['--pr-text'],p===D.palettes[palette].modes.dark?p.text:D.palettes[palette].modes.dark.text);
}
const normalized=C.normalize({palette:'not-a-palette',radius:-12,elevation:999,translucency:NaN,reduced:'yes',mode:'invalid'});
assert.equal(normalized.palette,D.default.palette);assert.equal(normalized.radius,14);assert.equal(normalized.elevation,150);assert.equal(normalized.translucency,35);assert.equal(normalized.reduced,false);assert.equal(normalized.mode,'light');
assert.match(C.exportCSS({mode:'system'}),/prefers-color-scheme: dark/);
assert.equal(C.resolve({reduced:true})['--pr-glass-blur'],'0px');
assert.equal(C.resolve({reduced:true})['--pr-content-feather'],'0px');
assert.equal(C.resolve({reduced:true})['--pr-content-fill'],C.resolve({reduced:true})['--pr-surface']);
assert.equal(C.resolve()['--pr-content-feather'],'1.95px');
assert.equal(C.resolve({reduced:true})['--pr-glass-fill'],C.resolve({reduced:true})['--pr-surface']);
assert.notEqual(C.resolve({elevation:60})['--pr-shadow-float'],C.resolve({elevation:150})['--pr-shadow-float']);
assert.notEqual(C.resolve({atmosphere:15})['--pr-atmosphere-one'],C.resolve({atmosphere:90})['--pr-atmosphere-one']);
for(const mode of ['light','dark'])for(const name of ['success','attention','danger','info'])assert.equal(C.resolve({palette:'prism'},mode)[`--pr-${name}-ink`],C.resolve({palette:'fuchsia'},mode)[`--pr-${name}-ink`]);
assert.deepEqual(Object.keys(D.materials),['plastic','frost','resin','haze','stone','mirage']);
for(const mode of ['light','dark']){const t=C.resolve({},mode);assert.equal(t['--pr-stone-fill'],t['--pr-label-fill']);assert.equal(t['--pr-stone-feather'],'1.95px');assert.equal(t['--pr-haze-fill'],t['--pr-content-fill']);assert.equal(t['--pr-resin-fill'],t['--pr-glass-fill']);}
assert.equal(C.resolve({reduced:true})['--pr-stone-feather'],'0px');
assert.equal(C.resolve({reduced:true})['--pr-mirage-blur'],'0px');
assert.equal(C.resolve()['--pr-mirage-blur'],'28px');
assert.equal(C.resolve()['--pr-mirage-saturation'],'165%');
assert.equal(C.resolve()['--pr-mirage-brightness'],'88%');
assert.equal(C.resolve({reduced:true})['--pr-mirage-saturation'],'100%');
assert.equal(C.resolve({reduced:true})['--pr-mirage-fill'],C.resolve()['--pr-mirage-fallback-fill']);
assert.equal(C.resolve()['--pr-press'],'120ms');
assert.equal(C.resolve()['--pr-spatial'],'293.33ms');
assert.equal(C.resolve({reduceMotion:true})['--pr-spatial'],'0ms');
assert.equal(C.resolve({reduceMotion:true})['--pr-motion-enabled'],'0');
assert.equal(C.resolve({reduceMotion:true})['--pr-haze-fill'],C.resolve()['--pr-haze-fill']);
assert.match(C.exportCSS({reduceMotion:true}),/animation: none !important/);
assert.equal(C.exportJSON().motion.exit,160);
assert.equal(C.resolve()['--pr-travel-panel'],'24px');
assert.equal(C.resolve()['--pr-liquid'],'1400ms');
assert.equal(C.resolve({reduceMotion:true})['--pr-material'],'0ms');
assert.equal(C.resolve({motionSpeed:.25})['--pr-liquid'],'5000ms');
assert.equal(C.resolve({motionSpeed:2})['--pr-liquid'],'700ms');
assert.equal(C.resolve({motionSpeed:.5})['--pr-departure'],'1300ms');
assert.equal(C.resolve({motionSpeed:.25,reduceMotion:true})['--pr-liquid'],'0ms');
assert.equal(C.normalize({motionSpeed:0}).motionSpeed,.25);
assert.equal(C.normalize({motionSpeed:NaN}).motionSpeed,1);
assert.equal(C.resolve()['--pr-travel-content'],'0px');
assert.equal(C.resolve()['--pr-travel-depth'],'50px');
assert.equal(C.resolve()['--pr-motion-max-travel'],'50px');
const canonical=JSON.parse(fs.readFileSync(path.join(root,'node_modules/@prismata/core/tokens/prismata.json'),'utf8'));
assert.deepEqual(JSON.parse(JSON.stringify(D)),canonical);
const report={date:new Date().toISOString(),scope:'Token pairs, bounded composite models, normalization and exported theme behavior. Not a WCAG certification.',checks:results.length,minimum:Math.min(...results.map(x=>x.ratio)),failures,results};
fs.writeFileSync(path.join(root,'website/verification/token-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks,minimum:report.minimum,failures},null,2));if(failures.length)process.exitCode=1;
