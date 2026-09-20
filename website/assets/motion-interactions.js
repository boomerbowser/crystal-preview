/* Opt-in installer used by both Crystal preview pages. Returns a real cleanup function.
 *
 * Everything here binds to STATE, not to clicks. A checkbox animates when `checked`
 * changes, not when it is pressed, so a keyboard user and assistive technology get the
 * same motion a pointer user gets. Binding to pointerdown produces motion that only one
 * input method can see, which is how a design system ends up with animations that are
 * real in the demo and absent in use.
 *
 * Until this was extended, only `press` and `hover` were wired — two of fifty-nine
 * recipes. Every other recipe existed as data and played only from the catalogue's
 * replay button, which is why checkboxes, switches, fields and disclosures never
 * animated in an application that had adopted Crystal.
 */
(function(root){
 const MANUAL='[data-cr-motion=manual]';

 /* A page may drive a component itself — the motion studies suite does, by id. A
    delegated listener would then fire the same recipe a second time. */
 const managed=element=>!!element.closest?.(MANUAL);

 /* `once` is the runtime's own guard: a repeat of the same recipe on the same element
    while it is still running is coalesced rather than restarted. It lives in
    CrystalMotion so that a page driving its own components gets the same behaviour —
    there is no second copy of this rule. A *different* recipe still interrupts, because
    a checkbox mid `field-focus` must still be allowed to play `check`. */
 const play=(element,name)=>{
  if(!element||managed(element))return;
  root.CrystalMotion?.play(element,name,{once:true});
 };

 /* A range's value updates immediately; what settles is the readout. Prefer the linked
    <output>, because scaling the input itself would move the track under the thumb. */
 const readout=input=>{
  const id=input.getAttribute('aria-describedby')||input.id;
  return (id&&document.querySelector(`output[for~="${CSS.escape(id)}"]`))||input;
 };

 const isSwitch=element=>element.matches('[role=switch]')
   ||element.closest('.cr-switch,[data-control=switch]')!==null;

 function bindFeedback(scope=document){
  const press=event=>{
   if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
   if(event.repeat||event.button>0)return;
   const button=event.target.closest?.('button');
   if(!button||button.disabled||button.getAttribute('aria-disabled')==='true')return;
   play(button,'press');
  };
  const hover=event=>{const control=event.target.closest?.('button');if(event.pointerType==='mouse'&&control&&!control.disabled&&!control.contains(event.relatedTarget))play(control,'hover');};

  /* Controls. `change` fires for pointer, keyboard and programmatic state alike. */
  const change=event=>{
   const element=event.target;
   if(!(element instanceof Element))return;
   if(element.matches('input[type=range]'))return play(readout(element),'slider-step');
   if(element.matches('input[type=checkbox],input[type=radio],[role=switch]')){
    if(isSwitch(element))return play(element,element.checked||element.getAttribute('aria-checked')==='true'?'switch-on':'switch-off');
    return play(element,element.checked?'check':'check-off');
   }
  };

  /* Forms. focusin delegates where focus does not bubble. */
  const focus=event=>{
   const field=event.target;
   /* Text entry only. A checkbox, radio, switch or range expresses focus through the
      focus ring and its own state recipe; `field-focus` is about a field accepting
      input, and playing it on a checkbox pre-empts `check`. */
   if(field instanceof Element&&field.matches(
     'input:not([type=range],[type=checkbox],[type=radio],[type=button],[type=submit],[type=reset]):not([role=switch]),textarea,select'
   ))play(field,'field-focus');
  };

  /* Disclosures. `toggle` is the state event for <details>. */
  const toggle=event=>{
   const details=event.target;
   if(details instanceof Element&&details.matches('details'))
    play(details.querySelector('details > :not(summary)')||details,details.open?'accordion-in':'accordion-out');
  };

  /* Attribute state that has no event of its own: an overlay's aria-expanded and a
     field's aria-invalid. Observing the attribute rather than the control that sets it
     means any code path reaches the same motion. */
  const observer=new MutationObserver(records=>{
   for(const record of records){
    const element=record.target;
    if(!(element instanceof Element))continue;
    if(record.attributeName==='aria-expanded'){
     const id=element.getAttribute('aria-controls');
     const panel=id?document.getElementById(id):null;
     if(panel)play(panel,element.getAttribute('aria-expanded')==='true'?'menu-in':'menu-out');
    }
    if(record.attributeName==='aria-invalid'){
     const invalid=element.getAttribute('aria-invalid')==='true';
     /* Only announce validity once the field has actually been marked, so a form does
        not flash "valid" across every untouched field on load. */
     if(invalid)play(element,'field-invalid');
     else if(record.oldValue==='true')play(element,'field-valid');
    }
   }
  });
  const observed=scope===document?document.documentElement:scope;
  observer.observe(observed,{subtree:true,attributes:true,attributeOldValue:true,
    attributeFilter:['aria-expanded','aria-invalid']});

  scope.addEventListener('pointerover',hover);
  scope.addEventListener('pointerdown',press);
  scope.addEventListener('keydown',press);
  scope.addEventListener('change',change);
  scope.addEventListener('focusin',focus);
  scope.addEventListener('toggle',toggle,true); /* `toggle` does not bubble. */
  return ()=>{
   observer.disconnect();
   scope.removeEventListener('pointerover',hover);
   scope.removeEventListener('pointerdown',press);
   scope.removeEventListener('keydown',press);
   scope.removeEventListener('change',change);
   scope.removeEventListener('focusin',focus);
   scope.removeEventListener('toggle',toggle,true);
  };
 }
 root.CrystalInteractions=Object.freeze({bindFeedback});
 bindFeedback();
})(window);
