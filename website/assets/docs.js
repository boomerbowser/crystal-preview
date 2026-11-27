/* Apply the playground's local appearance preference to specification pages. */
(function(){
  let state=Prismata.normalize();
  try{const saved=localStorage.getItem('prismata-design-system-v1');if(saved)state=Prismata.normalize(JSON.parse(saved));}catch{}
  const media=matchMedia('(prefers-color-scheme: dark)');
  function apply(){const mode=state.mode==='system'?(media.matches?'dark':'light'):state.mode;for(const [name,value]of Object.entries(Prismata.resolve(state,mode)))document.documentElement.style.setProperty(name,value);document.documentElement.dataset.motion=state.reduceMotion?'reduce':'full';document.documentElement.dataset.prismataMode=mode;document.documentElement.dataset.effects=state.reduced?'opaque':'full';document.documentElement.style.colorScheme=mode;}
  apply();media.addEventListener('change',()=>{if(state.mode==='system')apply();});
})();
