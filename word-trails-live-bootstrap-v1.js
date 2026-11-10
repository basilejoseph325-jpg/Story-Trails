/* LIVE Bible Unfolded Word Trails 30-level bootstrap.
   The original game owns menu, Settings, voice selection and purchases.
   No TEST visual banner or parallel wallet is installed. */
/* Load new Word Trails selector only within the isolated Bible Unfolded. */
(()=>{const s=document.createElement('script');s.src='word-trails-next-launcher.js?v=live-30-20261109-r1';s.defer=true;document.head.appendChild(s)})();


/* Word Trails standalone page -> existing Bible Unfolded screens.
   The native main game owns these screens. Handoff only changes navigation
   after it is loaded; never touches its reward logic, progress or display. */
(()=>{'use strict';
 const key=new URLSearchParams(location.search).get('wt_nav');
 if(!key)return;
 const targets={journey:'home-journey',gallery:'home-gallery',rewards:'home-shop',about:'home-menu',settings:'home-menu'};
 if(!targets[key])return;
 let attempts=0;
 const jump=()=>{
  if(attempts++>22)return;
  const button=document.getElementById(targets[key]);
  if(!button){setTimeout(jump,300);return}
  if(key==='about'){
   button.click();
   setTimeout(()=>document.getElementById('bu3925-about-menu')?.click(),180);
  }else if(key==='settings'){
   button.click();
   setTimeout(()=>document.getElementById('menu-settings')?.click(),230);
  }else button.click();
 };
 if(document.readyState==='complete')setTimeout(jump,330);
 else window.addEventListener('load',()=>setTimeout(jump,330),{once:true});
})();


/* LIVE shared Settings synchronization:
   Main Bible Unfolded retains its native Settings/sound engine and Word Trails
   retains its game-specific SFX synthesis. These four preference controls
   synchronize across both game modes; we never replace main audio playback. */
(()=>{'use strict';
 if(location.pathname.includes('/experiments/'))return;
 const KEY='bu-platform-audio-preferences-v1';
 const ids={music:'setting-music',sfx:'setting-sfx',musicVolume:'setting-volume',
  sfxVolume:'setting-sfx-volume',motion:'setting-motion'};
 const els={};let applying=false,installed=false,attempts=0;
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
 const pct=v=>Math.max(0,Math.min(100,Number(v)||0));
 function snapshot(){
  return {music:els.music.checked,sfx:els.sfx.checked,
   musicVolume:pct(els.musicVolume.value),sfxVolume:pct(els.sfxVolume.value),
   motion:!els.motion.checked};
 }
 function save(){
  if(applying)return;
  try{localStorage.setItem(KEY,JSON.stringify({...snapshot(),updated:Date.now(),source:'main'}))}catch(_){}
 }
 function initial(){
  const stored=read();if(!stored||stored.source!=='trails')return;
  applying=true;
  try{
   for(const key of ['music','sfx','musicVolume','sfxVolume','motion']){
    if(!Object.prototype.hasOwnProperty.call(stored,key))continue;
    const el=els[key],value=key==='motion'?!stored[key]:stored[key];
    if(el.type==='checkbox'){
     if(el.checked!==!!value){el.checked=!!value;el.dispatchEvent(new Event('change',{bubbles:true}))}
    }else{
     const p=pct(value);
     if(Number(el.value)!==p){el.value=String(p);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
    }
   }
  }finally{applying=false}
 }
 function install(){
  if(installed||attempts++>22)return;
  for(const [key,id] of Object.entries(ids)){
   const el=document.getElementById(id);
   if(!el){setTimeout(install,280);return}
   els[key]=el;
  }
  installed=true;initial();
  for(const el of Object.values(els)){
   el.addEventListener('input',save);el.addEventListener('change',save);
  }
  save();
 }
 if(document.readyState==='complete')setTimeout(install,800);
 else window.addEventListener('load',()=>setTimeout(install,800),{once:true});
})();

/* LIVE — mount Word Trails under the real main-game UI. */
(()=>{if(window.BUWTNativeShell||document.getElementById('bu-wt-native-host-loader'))return;const s=document.createElement('script');s.id='bu-wt-native-host-loader';s.src='word-trails-native-shell-v1.js?v=live-original-voices-20261109-r1';s.defer=true;document.head.appendChild(s)})();


/* LIVE — extend the actual native Settings backup controls so one
   complete portable JSON includes Word Trails NEXT progress as quarantined TEST
   data, while preserving native v1 import and the shared Rewards wallet. */
(()=>{if(window.BUPlatformSaves||document.getElementById('bu-platform-save-core-v2'))return;
 const el=document.createElement('script');el.id='bu-platform-save-core-v2';
 el.src='bu-platform-saves-v2.js?v=live-coordinated-backup-20261109-r1';
 el.defer=true;document.head.appendChild(el);
})();


/* TEST-only canonical direct-link + refresh continuation.  A published standalone
   Word Trails link redirects to the real native root, and the root opens its
   same-origin crossword frame using the actual global menu/settings/announcer.
   Only explicit Word Trails requests activate the host. */
(()=>{'use strict';
 const params=new URLSearchParams(location.search);
 const direct=params.get('wt_launch')==='native';
 if(!direct && location.hash!=='#word-trails')return;
 // Owner-approved browser refresh must return to Bible Unfolded home. The
 // crossword engine's existing localStorage save remains untouched and is
 // loaded when the player next enters Word Trails from the home card.
 // A fresh published deep link still opens Word Trails via wt_launch=native.
 const nav=performance.getEntriesByType?.('navigation')?.[0];
 const reloading=nav?.type==='reload'||performance.navigation?.type===1;
 if(!direct && reloading && location.hash==='#word-trails'){
  history.replaceState(history.state,'',location.pathname+location.search);
  return;
 }
 if(direct){
  params.delete('wt_launch');
  const query=params.toString();
  history.replaceState(history.state,'',location.pathname+(query?'?'+query:'')+location.hash);
 }
 let attempts=0;
 function launch(){
  const host=window.BUWTNativeShell;
  if(host?.nativeReady?.()&&host?.launch?.())return;
  if(++attempts<48)setTimeout(launch,250);
  else console.warn('Word Trails native shell was unavailable; use the main Word Trails card.');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});
 else launch();
})();
