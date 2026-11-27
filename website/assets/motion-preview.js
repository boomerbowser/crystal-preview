/* Dedicated motion playground. Product animation primitives live in motion.js. */
(function(){
'use strict';
const $=s=>document.querySelector(s),key='prismata-design-system-v1';
let state=Prismata.normalize();
try{const saved=localStorage.getItem(key);if(saved)state=Prismata.normalize(JSON.parse(saved));}catch{}
const appearance=matchMedia('(prefers-color-scheme: dark)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
for(const [id,palette] of Object.entries(PRISMATA_TOKENS.palettes)){
  const option=document.createElement('option');option.value=id;option.textContent=palette.name;$('#motion-palette').append(option);
}
function render(){
  const mode=state.mode==='system'?(appearance.matches?'dark':'light'):state.mode;
  for(const [name,value]of Object.entries(Prismata.resolve(state,mode)))document.documentElement.style.setProperty(name,value);
  document.documentElement.dataset.prismataMode=mode;
  document.documentElement.dataset.motion=state.reduceMotion?'reduce':'full';
  document.documentElement.dataset.effects=state.reduced?'opaque':'full';
  document.documentElement.style.colorScheme=mode;
  $('#motion-mode').value=state.mode;$('#motion-palette').value=state.palette;$('#reduce-motion').checked=state.reduceMotion;
  $('#motion-speed').value=state.motionSpeed;$('#motion-speed-value').value=state.motionSpeed+'×';
  for(const label of document.querySelectorAll('[data-duration]'))label.textContent=document.documentElement.style.getPropertyValue('--pr-'+label.dataset.duration);
  if(PrismataMotion.reduced())PrismataMotion.stopAll();
  $('#motion-system-status').textContent=PrismataMotion.reduced()?'Reduced motion active: state changes are immediate.':'Standard motion: finite and interruptible.';
}
function update(delta){
  state=Prismata.normalize({...state,...delta});render();
  try{localStorage.setItem(key,JSON.stringify(state));$('#motion-preference-status').textContent='Appearance and motion preferences saved for this preview.';}catch{$('#motion-preference-status').textContent='Storage unavailable; controls still work for this visit.';}
}
$('#motion-mode').addEventListener('change',event=>update({mode:event.target.value}));
$('#motion-palette').addEventListener('change',event=>update({palette:event.target.value}));
$('#reduce-motion').addEventListener('change',event=>update({reduceMotion:event.target.checked}));
appearance.addEventListener('change',render);motion.addEventListener('change',render);
window.addEventListener('storage',event=>{if(event.key===key){try{state=Prismata.normalize(event.newValue?JSON.parse(event.newValue):undefined);render();}catch{}}});
$('#motion-speed').addEventListener('input',event=>{PrismataMotion.stopAll();update({motionSpeed:Number(event.target.value)});});
let replay=0;
for(const button of document.querySelectorAll('[data-replay]'))button.addEventListener('click',async()=>{
  const current=++replay,name=button.dataset.replay;
  $('#motion-result').textContent='Playing '+name+'…';
  const target=$('#motion-'+name);target.hidden=false;
  const result=await PrismataMotion.play(target,name,{rate:1,direction:$('#flow-direction').value});
  if(current===replay)$('#motion-result').textContent=button.getAttribute('aria-label')+': '+(result.status==='instant'?'shown immediately (reduced motion or animation unavailable).':result.status==='cancelled'?'stopped.':'complete.');
});
$('#mirage-exit').addEventListener('click',async()=>{
  const current=++replay,target=$('#motion-mirage');target.hidden=false;
  const result=await PrismataMotion.play(target,'mirage-out',{rate:1,direction:$('#flow-direction').value});
  if(result.status!=='cancelled')target.hidden=true;
  if(current===replay)$('#motion-result').textContent='Mirage exit: '+result.status+'. Replay Mirage to bring it back.';
});
const dialog=$('#spec-dialog');let closing=null,trigger=null;
function closeDialog(){
  if(!dialog.open||closing)return;
  dialog.dataset.closing='';
  closing=PrismataMotion.play(dialog,'dismiss').then(()=>{if(dialog.open)dialog.close();delete dialog.dataset.closing;closing=null;});
}
$('#motion-dialog').addEventListener('click',()=>{trigger=document.activeElement;delete dialog.dataset.closing;PrismataMotion.direction(dialog ,$('#flow-direction').value);dialog.showModal();$('#close-dialog').focus();PrismataMotion.play(dialog,'haze');});
$('#close-dialog').addEventListener('click',closeDialog);$('#done-dialog').addEventListener('click',closeDialog);
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
dialog.addEventListener('close',()=>{PrismataMotion.stop(dialog);if(trigger?.isConnected)trigger.focus();});
dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const first=$('#close-dialog'),last=$('#done-dialog');
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
render();
})();
