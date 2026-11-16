/* Episodes 13/14 release candidate: additive Genesis checkpoints and scoped
 * adapters for the existing LIVE Story engine. No wallet, import/restore,
 * audio, Word Trails or other mode implementation is replaced. */
(()=>{'use strict';
 if(window.BUStoryReleaseCompat)return;
 const NEW=new Set(['genesis_ep13','genesis_ep14']);
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
 function readSave(key){
  for(const candidate of [key,key+'-recovery-v1']){
   try{const value=JSON.parse(localStorage.getItem(candidate)||'null');if(object(value))return value;}catch(_){}
  }
  return {};
 }
 // If a verified Genesis checkpoint is used after a corrupt primary record,
 // hydrate missing earlier chapters too. Never replace a valid in-memory save.
 const checkpoint=readSave(BU_GENESIS_KEY);
 for(const id of BU_GENESIS_IDS)if(!object(bu3857Saved[id])&&object(checkpoint[id])){
  bu3857Saved[id]=checkpoint[id];if(checkpoint[id].complete)completedChapters[id]=true;
 }
 const oldSave=bu3857Save;
 let saveFailed=false;
 bu3857Save=function(...args){
  const s=bu3857State;
  if(!s||!BU_GENESIS_IDS.includes(s.book))return oldSave.apply(this,args);
  // Original native snapshot, with an additive disk merge. The old LIVE saver
  // discarded unregistered entries; loading/saving Episode 12 must not erase
  // Episode 13/14 or a future chapter during asynchronous registration.
  bu3857Saved[s.book]={step:s.step,complete:!!s.complete||!!s.wasComplete,
   solved:{...s.solved},revealed:{...s.revealed},hints:{...s.hints},
   work:JSON.parse(JSON.stringify(s.work||{}))};
  try{
   const all={...readSave(BU_GENESIS_KEY),...Object.fromEntries(BU_GENESIS_IDS.filter(id=>object(bu3857Saved[id])).map(id=>[id,bu3857Saved[id]]))};
   const raw=JSON.stringify(all);localStorage.setItem(BU_GENESIS_KEY,raw);
   if(localStorage.getItem(BU_GENESIS_KEY)!==raw)throw Error('Story checkpoint verification failed');
   try{localStorage.setItem(BU_GENESIS_KEY+'-recovery-v1',raw)}catch(_){}
   saveFailed=false;return true;
  }catch(error){
   console.warn('Genesis checkpoint unavailable',error);
   if(!saveFailed)notify('Your Story progress could not be saved. Keep this page open and try again.');
   saveFailed=true;return false;
  }
 };
 const oldOpen=bu3857Open;
 bu3857Open=function(id,...args){
  if(NEW.has(id)){
   const saved=object(bu3857Saved[id])?bu3857Saved[id]:{};
   for(const key of ['solved','revealed','hints','work'])if(!object(saved[key]))saved[key]={};
   const norm=n=>Math.max(0,Math.trunc(Number(n)||0));
   for(const d of BU3857_DATA[id]?.discoveries||[]){
    saved.hints[d.id]=Math.min(3,Math.max(norm(saved.hints[d.id]),norm(economy.hints['story-assist-v1:'+id+':'+d.id])));
    if(saved.work[d.id]!==undefined&&!object(saved.work[d.id]))delete saved.work[d.id];
   }
   saved.step=norm(saved.step);bu3857Saved[id]=saved;
  }
  if(bu3857State&&bu3857State.book!==id&&(NEW.has(id)||NEW.has(bu3857State.book)))bu3857Save();
  return oldOpen.call(this,id,...args);
 };
 const active=()=>NEW.has(bu3857State?.book)&&!document.getElementById('bu3857-screen').hidden;
 // Use the original modal's X/keyboard cleanup and focus, not a second renderer.
 function ownModal(layer,closeSelector,previous){
  if(!layer)return;
  layer.dataset.buStoryReleaseOwned='';
  layer.buClose=()=>layer.querySelector(closeSelector)?.click();
  const observer=new MutationObserver(()=>{
   if(layer.isConnected)return;observer.disconnect();
   if(previous?.isConnected&&(document.activeElement===document.body||!document.activeElement?.isConnected))previous.focus({preventScroll:true});
  });
  observer.observe(document.body,{childList:true,subtree:true});
 }
 function closeOwned(){for(const layer of document.querySelectorAll('[data-bu-story-release-owned]'))layer.buClose?.();}
 const hint=bu3864Modal,story=bu3863Modal,scripture=bu3898ScriptureDialog;
 bu3864Modal=function(...args){const own=active(),previous=document.activeElement;if(own)closeOwned();const result=hint.apply(this,args);if(own)ownModal(document.getElementById('bu3864-modal-layer'),'.bu3864-modal-close',previous);return result;};
 bu3863Modal=function(...args){const own=active(),previous=document.activeElement;if(own)closeOwned();const result=story.apply(this,args);if(own)ownModal(document.getElementById('bu3863-dialog-layer'),'.bu3863-close',previous);return result;};
 bu3898ScriptureDialog=function(...args){const own=active(),previous=document.activeElement;if(own)closeOwned();const result=scripture.apply(this,args);if(own)ownModal(document.getElementById('bu3898-scripture-layer'),'.bu3898-close',previous);return result;};
 const home=focusHome,episodes=openEpisodes;
 focusHome=function(...args){closeOwned();return home.apply(this,args);};
 openEpisodes=function(...args){closeOwned();return episodes.apply(this,args);};
 const menu=openMenu;
 openMenu=function(...args){
  const result=menu.apply(this,args),modern=active();
  let button=document.getElementById('bu-story-restart');
  if(modern&&!button){button=document.createElement('button');button.id='bu-story-restart';button.type='button';button.textContent='Restart this Story chapter';document.querySelector('#game-menu .drawer-links').append(button);}
  if(button){
   button.hidden=!modern;
   button.onclick=()=>{const book=bu3857State.book;closeMenu();bu3864Modal('Restart this chapter?','Start again from the first discovery? Your earned rewards, completed chapters, and purchased hints stay saved.',{confirm:'Restart chapter',onConfirm:()=>bu3857Open(book,true)});};
  }
  return result;
 };
 const button=document.querySelector('[data-nav="continue"]'),continuePlaying=button?.onclick;
 if(button)button.onclick=function(...args){if(drawerReturn==='bu3857-screen'&&NEW.has(bu3857State?.book)){closeMenu();return;}return continuePlaying?.apply(this,args);};
 window.BUStoryReleaseCompat=Object.freeze({version:'genesis13-14-v1',readSave});
})();
