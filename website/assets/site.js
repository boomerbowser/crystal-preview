(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const key='crystal-design-system-v1';let state=Crystal.normalize(),scene='workspace',storageOK=true;
try{const saved=localStorage.getItem(key);if(saved)state=Crystal.normalize(JSON.parse(saved));}catch{storageOK=false;}
const systemMode=matchMedia('(prefers-color-scheme: dark)');
const effectiveMode=()=>state.mode==='system'?(systemMode.matches?'dark':'light'):state.mode;
const announce=text=>{$('#announcement').textContent=text;};
const descriptions={
content:{title:'Haze content surface',body:'Reading surfaces use an 80% fill with a 1.95px feather on the background layer only. Text and focus stay crisp, with at least 12px of reading inset. The underlying material contributes color; opaque accessibility fallback remains available.',classes:'.cr-haze'},
shape:{title:'A recognizable shape language',body:'Ordinary content uses a consistent soft radius. Authored or directional content can use one tighter corner, inherited from the original asymmetric messages. Keep that corner meaningful and mirror it for right-to-left interfaces.',classes:'.cr-bubble / .cr-bubble.own'},
acrylic:{title:'Frost support',body:'The surrounding pane is translucent: tint, backdrop blur, saturation and a small amount of grain. The reading fill blends at 80%, with crisp text and protected input controls. Crystal uses this material selectively for support, never as a filter over every paragraph.',classes:'.cr-frost + .cr-well'},
button:{title:'Primary and secondary actions',body:'Primary actions use the paired brand foreground/background. Secondary actions use the softer pair. Every action retains its name, visible keyboard focus, a 44px minimum height and explicit disabled behavior. Brand color alone does not signal a destructive action.',classes:'.cr-button / .cr-button.secondary'}
};
for(const [id,p] of Object.entries(CRYSTAL_TOKENS.palettes)){
/* A renderer owns the markup it creates, indicator included. */
 function indicator(kind){const el=document.createElement('span');el.className='cr-indicator';el.dataset.kind=kind;el.setAttribute('aria-hidden','true');return el;}
  const swatch=document.createElement('button');swatch.type='button';swatch.className='swatch';swatch.style.setProperty('--swatch',p.seed);swatch.dataset.palette=id;swatch.setAttribute('aria-label',p.name+' palette');swatch.title=p.name;swatch.setAttribute('aria-pressed','false');swatch.append(indicator('selection'));$('#palette-picker').append(swatch);
  const card=document.createElement('button');card.type='button';card.className='palette-card';card.dataset.palette=id;card.setAttribute('aria-label','Use '+p.name+' palette');card.setAttribute('aria-pressed','false');card.style.setProperty('--seed',p.seed);card.style.setProperty('--pair',p.companion);const art=document.createElement('div');art.className='palette-art';art.setAttribute('aria-hidden','true');const name=document.createElement('strong');name.textContent=p.name;const hex=document.createElement('small');hex.textContent=p.seed;card.append(art,name,hex,indicator('selection'));$('#theme-overview').append(card);
}
function save(){try{localStorage.setItem(key,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('#preference-status').textContent=storageOK?'Preferences saved in this browser.':'Storage unavailable; controls still work for this visit.';}
function render(savePreference=false){
  const mode=effectiveMode();for(const [k,v] of Object.entries(Crystal.resolve(state,mode)))document.documentElement.style.setProperty(k,v);
  document.documentElement.dataset.motion=state.reduceMotion?'reduce':'full';$('#reduce-motion').checked=state.reduceMotion;
  $('#motion-speed-site').value=state.motionSpeed;$('#motion-speed-site-value').value=state.motionSpeed+'×';
  if(CrystalMotion.reduced())CrystalMotion.stopAll();
  document.documentElement.dataset.crystalMode=mode;document.documentElement.dataset.mode=mode;document.documentElement.dataset.effects=state.reduced?'opaque':'full';document.documentElement.style.colorScheme=mode;document.body.classList.toggle('compact',state.density==='compact');
  $$('[data-palette]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.palette===state.palette)));
  $$('#mode-control button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  $$('#density-control button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.density===state.density)));
  for(const property of ['atmosphere','translucency','elevation','radius']){$('#'+property).value=state[property];$('#'+property+'-value').value=state[property]+(property==='radius'?'px':'%');}
  $('#font').value=state.font;$('#reduced').checked=state.reduced;
  $('#study-tint').value=state.translucency;$('#study-tint-value').value=state.translucency+'%';$('#study-tint').disabled=state.reduced;$('#study-opaque').checked=state.reduced;$$('[data-material-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.materialMode===mode)));
  for(const id of ['translucency']){$('#'+id).disabled=state.reduced;}
  $('#palette-name').textContent=CRYSTAL_TOKENS.palettes[state.palette].name;$('#palette-hex').textContent=CRYSTAL_TOKENS.palettes[state.palette].seed;
  $('#effects-metric').textContent=state.reduced?'Opaque':'Full';
  const audit=Crystal.audit(state,mode);$('#contrast-metric').textContent=audit[0].ratio.toFixed(2)+':1';const tbody=$('#audit-body');tbody.replaceChildren();
  for(const pair of audit){const tr=document.createElement('tr'),label=document.createElement('th'),value=document.createElement('td');label.scope='row';label.textContent=pair.label;value.textContent=(pair.ratio>=pair.minimum?'✓ ':'Review: ')+pair.ratio.toFixed(2)+':1';if(pair.ratio>=pair.minimum)value.className='good-result';tr.append(label,value);tbody.append(tr);}
  $('#config-preview').textContent=JSON.stringify({system:'Crystal',version:Crystal.version,...state},null,2);
  if(savePreference)save();
}
function change(delta,description){state=Crystal.normalize({...state,...delta});render(true);if(description)announce(description);}
$$('[data-palette]').forEach(b=>b.addEventListener('click',()=>change({palette:b.dataset.palette},CRYSTAL_TOKENS.palettes[b.dataset.palette].name+' palette selected.')));
$$('#mode-control button').forEach(b=>b.addEventListener('click',()=>change({mode:b.dataset.mode},b.textContent+' appearance selected.')));
$$('#density-control button').forEach(b=>b.addEventListener('click',()=>change({density:b.dataset.density},b.textContent+' density selected.')));
for(const property of ['atmosphere','translucency','elevation','radius'])$('#'+property).addEventListener('input',event=>change({[property]:Number(event.target.value)}));
$('#font').addEventListener('change',event=>change({font:event.target.value},'Typeface updated.'));
$('#reduced').addEventListener('change',event=>change({reduced:event.target.checked},event.target.checked?'Opaque surfaces enabled.':'Translucent surfaces enabled.'));
$('#reset').addEventListener('click',()=>{state=Crystal.normalize();render(true);announce('Default Crystal settings restored.');});
systemMode.addEventListener('change',()=>{if(state.mode==='system')render();});
$$('[data-material-mode]').forEach(b=>b.addEventListener('click',()=>change({mode:b.dataset.materialMode},b.dataset.materialMode+' material appearance selected.')));
$('#study-tint').addEventListener('input',event=>change({translucency:Number(event.target.value)}));
$('#study-opaque').addEventListener('change',event=>change({reduced:event.target.checked},event.target.checked?'Opaque fallback enabled.':'Layered materials restored.'));
$$('[data-scene]').forEach(b=>b.addEventListener('click',()=>{scene=b.dataset.scene;$$('.scene').forEach(p=>p.hidden=p.id!=='scene-'+scene);$$('[data-scene]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));$('#scene-label').textContent=b.textContent.trim();CrystalMotion.play($('#scene-'+scene),'frost');announce(b.textContent.trim()+' preview selected.');}));
$('#width-toggle').addEventListener('click',()=>{const narrow=$('#stage-wrap').classList.toggle('narrow');$('#width-toggle').setAttribute('aria-pressed',String(narrow));$('#width-toggle').textContent=narrow?'Full width':'Narrow view';announce(narrow?'Canvas constrained to a narrow layout.':'Full-width canvas restored.');});
const dialog=$('#spec-dialog');
let dialogTrigger=null;
dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const stops=[...dialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=stops[0],last=stops[stops.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
let dialogClosing=null;
function closeDialog(){
  if(!dialog.open||dialogClosing)return;
  dialog.dataset.closing='';
  dialogClosing=CrystalMotion.play(dialog,'dismiss').then(()=>{if(dialog.open)dialog.close();delete dialog.dataset.closing;dialogClosing=null;});
}
dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
dialog.addEventListener('close',()=>{CrystalMotion.stop(dialog);if(dialogTrigger?.isConnected)dialogTrigger.focus();});
function showDialog(title,content,code){$('#dialog-title').textContent=title;const body=$('#dialog-content');body.replaceChildren();if(content){const p=document.createElement('p');p.textContent=content;body.append(p);}if(code){const pre=document.createElement('pre');pre.textContent=code;body.append(pre);}dialogTrigger=document.activeElement;delete dialog.dataset.closing;CrystalMotion.direction(dialog);dialog.showModal();$('#close-dialog').focus();CrystalMotion.play(dialog,'haze');}
$$('[data-inspect]').forEach(b=>b.addEventListener('click',()=>{const spec=descriptions[b.dataset.inspect];showDialog(spec.title,spec.body,spec.classes);}));
$('#open-dialog').addEventListener('click',()=>showDialog('A quiet place to decide.','Consequential choices use an 80% content fill with a feathered perimeter above Mirage. This working native HTML dialog contains focus, closes with Escape and returns focus to the trigger. No service action is performed.'));
$('#mirage-compare').addEventListener('change',event=>{$('#mirage-study-layer').hidden=!event.target.checked;announce(event.target.checked?'Mirage chromatic diffusion shown.':'Underlying artwork shown without Mirage.');});
$('#open-mirage').addEventListener('click',()=>showDialog('Mirage gives a decision room.','Mirage blends the real colors beneath it through broad diffusion and increased saturation, then adds a dark veil. This Haze dialog stays crisp and owns focus. Close or press Escape to return.'));
$('#close-dialog').addEventListener('click',closeDialog);$('#done-dialog').addEventListener('click',closeDialog);
$('#inspect-export').addEventListener('click',()=>showDialog('Your exported theme','Resolved light and dark CSS variables for the current configuration.',Crystal.exportCSS(state)));
function download(filename,content,mime){const blob=new Blob([content],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);announce(filename+' download created.');}
$('#export-css').addEventListener('click',()=>download('crystal-theme.css',Crystal.exportCSS(state),'text/css'));
$('#export-json').addEventListener('click',()=>download('crystal-theme.json',JSON.stringify(Crystal.exportJSON(state),null,2)+'\n','application/json'));
$('#name-form').addEventListener('submit',event=>{event.preventDefault();const input=$('#demo-name');const name=input.value.trim();if(!name){input.setCustomValidity('Enter a name with at least one visible character.');input.reportValidity();return;}input.setCustomValidity('');$('#product-name').textContent=name;announce('Preview product renamed to '+name+'.');});
$('#demo-name').addEventListener('input',()=>$('#demo-name').setCustomValidity(''));
$('#helper-toggle').addEventListener('change',event=>$$('.scene-eyebrow').forEach(el=>el.hidden=!event.target.checked));
$('#mica-active').addEventListener('change',event=>{const active=event.target.checked;$('#mica-window').dataset.windowActive=String(active);$('#mica-window-state').textContent=active?'Active window':'Inactive · neutral foundation';announce(active?'Plastic contextual tint restored.':'Plastic neutral inactive fallback shown.');});
$('#motion-speed-site').addEventListener('input',event=>{CrystalMotion.stopAll();change({motionSpeed:Number(event.target.value)},'Animation speed updated.');});
$('#reduce-motion').addEventListener('change',event=>change({reduceMotion:event.target.checked},'Motion preference updated.'));
const motionMedia=matchMedia('(prefers-reduced-motion: reduce)');motionMedia.addEventListener('change',()=>render());
render();$('#preference-status').textContent=storageOK?'Changes stay in this browser.':'Storage unavailable; controls work for this visit.';
})();
