/* LIVE issue #13 safety hold: preserve native saves and backup export.
   Legacy recovery records are evidence only; no startup rollback or restore
   writer is enabled. No experimental backup implementation is imported. */
(()=>{'use strict';
if(window.BUPlatformSaves&&!window.BUPlatformSaves.pendingSafetyLoad)return;
const NATIVE=/^(?:bible-unfolded|story-trails)-[a-z0-9_.-]+$/i;
const TEST='bible-unfolded-word-trails-next-v1';
const FEEL='bu-wt-next-feel-v2';
const JOURNAL='bible-unfolded-word-trails-import-rollback-v2';
const COMMITTED='bible-unfolded-word-trails-import-committed-v2';
const BACKUP_VERSION=2,MAX_BYTES=2000000,MAX_KEYS=100,MAX_NATIVE_VALUE=300000;
const WALLETS=['bible-unfolded-rewards-v17','bible-unfolded-rewards-v17-recovery-v3811'];
const OWNERSHIP=['bible-unfolded-wheel-ownership-v3825','bible-unfolded-wheel-ownership-v3825-backup'];
const WHEELS=['goldwheel','moonwheel','seawheel'];
const keysToKeep=[TEST,FEEL];
const own=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const allowed=k=>typeof k==='string'&&k.length<=160&&NATIVE.test(k)&&k!==TEST;
const parse=s=>JSON.parse(s);
const safeNum=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000;
const dataStr=(v,max)=>v===null||(typeof v==='string'&&v.length<=max);
const read=k=>localStorage.getItem(k);
const getJson=s=>{try{const v=parse(s);return own(v)?v:null}catch(_){return null}};
function inventory(){
 const a={};
 for(let i=0;i<localStorage.length;i++){
  const k=localStorage.key(i);
  if(allowed(k)&&k!==JOURNAL&&k!==COMMITTED){const v=read(k);if(v!==null)a[k]=v}
 }
 return a;
}
function validateTrails(raw){
 if(raw===null)return {present:false,level:null,coins:null,completedCount:0};
 if(!dataStr(raw,220000))throw Error('Word Trails save exceeds the safe size limit.');
 const s=getJson(raw);if(!s)throw Error('Word Trails save is not a valid object.');
 for(const k of ['level','unlocked']){
  if(!Number.isInteger(s[k])||s[k]<0||s[k]>29)throw Error('Word Trails '+k+' is out of range.');
 }
 for(const k of ['coins','points'])if(!safeNum(s[k]))throw Error('Word Trails '+k+' is invalid.');
 const fields=['completed','sparks','claimedSparks','boardBible','paidWords','paidBonuses','claimedFreeHints'];
 for(const k of fields){
  // Older Word Trails prototypes did not save every discovery/bonus ledger.
  // Preserve the original raw save; the current game supplies missing arrays.
  if(s[k]===undefined)continue;
  if(!Array.isArray(s[k])||s[k].length>6000)throw Error('Word Trails '+k+' is invalid.');
  for(const item of s[k]){
   if(typeof item==='number'){if(!Number.isSafeInteger(item)||item<0||item>29)throw Error('Bad Word Trails '+k+' level.')}
   else if(typeof item==='string'){if(item.length>90||!/^[a-z0-9_:|.-]+$/i.test(item))throw Error('Bad Word Trails '+k+' value.')}
   else throw Error('Bad Word Trails '+k+' entry.');
  }
 }
 if(s.progress!==null&&s.progress!==undefined){
  if(!own(s.progress)||!Number.isInteger(s.progress.level)||s.progress.level<0||s.progress.level>29)throw Error('Word Trails in-progress level is invalid.');
  for(const k of ['found','bonuses','hinted']){
   if(s.progress[k]===undefined)continue;
   if(!Array.isArray(s.progress[k])||s.progress[k].length>120||
      s.progress[k].some(x=>typeof x!=='string'||x.length>40||!/^[A-Z0-9:]+$/i.test(x)))throw Error('Word Trails unfinished '+k+' is invalid.');
  }
  if(s.progress.combo!==undefined&&(!safeNum(s.progress.combo)||s.progress.combo>1000))throw Error('Word Trails combo is invalid.');
 }
 return {present:true,level:s.level+1,coins:s.coins,completedCount:new Set(s.completed).size};
}
function validateFeel(raw){
 if(raw===null)return;
 if(!dataStr(raw,10000))throw Error('Word Trails audio preferences exceed the limit.');
 const p=getJson(raw);if(!p)throw Error('Word Trails audio preferences are invalid.');
 for(const k of ['music','sfx','motion','haptics'])if(k in p&&typeof p[k]!=='boolean')throw Error('Invalid Word Trails '+k+' preference.');
 for(const k of ['musicVolume','sfxVolume'])if(k in p&&(!Number.isFinite(Number(p[k]))||Number(p[k])<0||Number(p[k])>100))throw Error('Invalid Word Trails '+k+'.');
}
function nativeData(data){
 if(!own(data)||data.format!=='BibleUnfoldedSave'||data.version!==BACKUP_VERSION||
    !own(data.keys))throw Error('This is not a compatible complete LIVE backup.');
 const pairs=Object.entries(data.keys);
 if(!pairs.length||pairs.length>MAX_KEYS||pairs.some(([k,v])=>!allowed(k)||typeof v!=='string'||v.length>MAX_NATIVE_VALUE))
  throw Error('The native game backup contains invalid keys.');
 const ext=data.extensions;
 if(!own(ext)||!own(ext.wordTrailsNext)||ext.wordTrailsNext.format!=='WordTrailsNextLIVE'||
     ext.wordTrailsNext.version!==1)throw Error('Missing versioned Word Trails save section.');
 const t=ext.wordTrailsNext;
 if(!dataStr(t.state,220000)||!dataStr(t.feel,10000))throw Error('Invalid Word Trails backup content.');
 const test=validateTrails(t.state);validateFeel(t.feel);
 for(const k of WALLETS){
  if(!Object.prototype.hasOwnProperty.call(data.keys,k))continue;
  const w=getJson(data.keys[k]);
  if(!w||!Number.isFinite(w.points)||!Number.isFinite(w.coins)||w.coins<0)throw Error('Shared wallet in backup is invalid.');
 }
 return {nativeKeys:pairs.length,test};
}
function walletSummary(kv){
 const w=getJson(kv[WALLETS[0]]||kv[WALLETS[1]]||'');
 return w?{points:w.points,insightTokens:w.coins}:null;
}
function currentSnapshot(){
 const keys=inventory();
 return {keys,trail:read(TEST),feel:read(FEEL)};
}
function makeBackup(){
 const state=currentSnapshot();
 if(!Object.keys(state.keys).length)throw Error('No native progress found to back up.');
 if(Object.keys(state.keys).length>MAX_KEYS||Object.entries(state.keys).some(([k,v])=>!allowed(k)||v.length>MAX_NATIVE_VALUE))
   throw Error('Saved native data exceeds safe backup limits.');
 validateTrails(state.trail);validateFeel(state.feel);
 return {format:'BibleUnfoldedSave',version:BACKUP_VERSION,
  exportedAt:new Date().toISOString(),scope:'Bible Unfolded LIVE',
  keys:state.keys,extensions:{wordTrailsNext:{format:'WordTrailsNextLIVE',
    version:1,state:state.trail,feel:state.feel,coinsNeverConvertToInsightTokens:true}}};
}
function dryRun(candidate){
 const c=typeof candidate==='string'?parse(candidate):candidate;
 const v=nativeData(c);
 const existing=currentSnapshot();
 const incoming=walletSummary(c.keys),current=walletSummary(existing.keys);
 const protectedWheels=wheelSet({...existing.keys,...c.keys},existing.keys);
 const sameKeys=Object.entries(c.keys).every(([k,val])=>existing.keys[k]===val);
 return Object.freeze({
  valid:true,version:BACKUP_VERSION,nativeKeys:v.nativeKeys,
  incomingWallet:incoming,currentWallet:current,
  incomingWordTrails:v.test,currentWordTrails:validateTrails(existing.trail),
  preservedOwnedWheels:[...protectedWheels],
  testCoinsQuarantined:true,canApply:false,restoreDisabled:true,
  restoreReason:'Backup restores are paused until safe recovery is independently reviewed.',
  noChangesRequired:sameKeys&&(c.extensions.wordTrailsNext.state===existing.trail||
    c.extensions.wordTrailsNext.state===null)&&
    (c.extensions.wordTrailsNext.feel===existing.feel||c.extensions.wordTrailsNext.feel===null)
 });
}
function wheelSet(next,previous){
 const owned=new Set();
 for(const raw of [...WALLETS,...OWNERSHIP].flatMap(k=>[next[k],previous[k]])){
  const o=getJson(raw);if(!o)continue;
  const values=[...(Array.isArray(o.purchases)?o.purchases:[]),...(Array.isArray(o.owned)?o.owned:[])];
  for(const x of values)if(WHEELS.includes(x))owned.add(x);
 }
 return owned;
}
function protectedNative(incoming,previous){
 // Existing keys absent from a backup are never deleted. Source backup keys replace
 // matching keys, except that paid wheel ownership is losslessly unioned.
 const next={...previous,...incoming};
 const owned=wheelSet(next,previous);
 for(const k of OWNERSHIP){
  const original=getJson(next[k])||{version:1};
  if(owned.size)next[k]=JSON.stringify({...original,owned:[...owned]});
 }
 for(const k of WALLETS){
  const original=getJson(next[k]);if(!original)continue;
  const purchase=new Set(Array.isArray(original.purchases)?original.purchases:[]);
  for(const id of owned)purchase.add(id);
  const selected=original.equippedWheel;
  next[k]=JSON.stringify({...original,purchases:[...purchase],
    equippedWheel: selected==='classic'||owned.has(selected)?selected:'classic'});
 }
 return next;
}
// Never infer ownership of current values from a previous-only journal.
// Even a COMMITTED marker has no transaction identity linking it to a journal.
// Quarantine is logical: retain both raw records byte-for-byte for review.
function recoverPending(){
 try{
  const raw=read(JOURNAL),committed=read(COMMITTED);
  if(raw===null&&committed===null)return Object.freeze({recovered:false,quarantined:false,restoreDisabled:true,kind:'none'});
  const journal=raw===null?null:getJson(raw);
  const kind=raw===null?'orphan-marker':!journal?'malformed':
   journal.version===1&&own(journal.previous)?'legacy-previous-only':'unsupported-format';
  return Object.freeze({recovered:false,quarantined:true,restoreDisabled:true,
   kind,committedMarkerPresent:committed!==null,
   reason:'The retained record cannot prove which current values belong to the old restore. Nothing was rolled back or cleared.'});
 }catch(_){return Object.freeze({recovered:false,quarantined:true,restoreDisabled:true,kind:'storage-unavailable',reason:'Saved recovery records could not be read. Nothing was changed.'});}
}
function applyBackup(){
 throw Error('Backup restores are paused to protect current progress. Export current progress and review the retained recovery record; no import was performed.');
}
function getStatus(){
 let el=document.getElementById('bu-wt-save-status');
 if(el)return el;
 const native=document.getElementById('save-export')?.closest('.save-transfer');
 if(!native)return null;
 el=document.createElement('small');el.id='bu-wt-save-status';el.setAttribute('role','status');
 el.setAttribute('aria-live','polite');el.style.display='block';el.style.marginTop='8px';
 el.textContent='Complete LIVE backups also include Word Trails progress. Its Trail Coins stay separate from Insight Tokens.';
 native.append(el);return el;
}
function notice(s){const el=getStatus();if(el)el.textContent=s}
function download(){
 try{
  const payload=JSON.stringify(makeBackup(),null,2);
  if(payload.length>MAX_BYTES)throw Error('Backup is over the 2 MB limit.');
  const blob=new Blob([payload],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Bible_Unfolded_Complete_Backup_v2.json';
  a.style.display='none';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
  notice('Complete LIVE backup prepared: native progress + Word Trails crossword save.');
 }catch(e){notice('Backup failed: '+e.message)}
}
function recoveryEvidence(){
 // A review copy is deliberately NOT a BibleUnfoldedSave import payload.
 return {format:'BibleUnfoldedRecoveryEvidence',version:1,capturedAt:new Date().toISOString(),
  warning:'Evidence only. Current progress may be partly restored; this does not reconstruct an earlier known-good save.',
  journal:read(JOURNAL),committedMarker:read(COMMITTED)};
}
function downloadEvidence(){
 try{
  const blob=new Blob([JSON.stringify(recoveryEvidence(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='Bible_Unfolded_Retained_Recovery_Record.json';a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
 }catch(_){notice('The recovery record could not be copied. Nothing was restored or cleared.');}
}
function installReview(){
 const status=getStatus();if(!status)return;
 let panel=document.getElementById('bu-live-restore-review');
 if(!panel){
  panel=document.createElement('details');panel.id='bu-live-restore-review';
  panel.style.cssText='margin-top:10px;padding:9px;border:1px solid currentColor;border-radius:8px;max-width:100%;box-sizing:border-box';
  const summary=document.createElement('summary');summary.textContent='Review backup safety';panel.append(summary);
  const text=document.createElement('p');text.id='bu-live-recovery-description';text.style.cssText='white-space:normal;overflow-wrap:anywhere;line-height:1.45';panel.append(text);
  const copy=document.createElement('button');copy.type='button';copy.id='bu-live-copy-current';copy.textContent='Download current progress';copy.style.cssText='min-height:44px;max-width:100%;white-space:normal;margin:5px';copy.onclick=download;panel.append(copy);
  const evidence=document.createElement('button');evidence.type='button';evidence.id='bu-live-copy-recovery';evidence.textContent='Download retained recovery record';evidence.style.cssText=copy.style.cssText;evidence.onclick=downloadEvidence;panel.append(evidence);
  status.parentNode.append(panel);
 }
 const state=recoverPending();
 panel.querySelector('#bu-live-recovery-description').textContent=state.quarantined?
  'An older backup restore record needs review. Your current progress has not been replaced or rolled back. It may contain a partly restored game; a current copy cannot recreate an earlier known-good save. Keep a copy of both current progress and the retained record. Older open game tabs can still change progress. Close other tabs of the game, and keep the files for review.':
  'Backup restores are paused to protect progress. You can still play and download your current progress. Restore will stay paused until its safety review is complete.';
 panel.querySelector('#bu-live-copy-recovery').hidden=!state.quarantined||state.kind==='storage-unavailable';
 if(state.quarantined)panel.open=true;
 return panel;
}
function reviewRestore(picker,event){
 event?.preventDefault?.();event?.stopImmediatePropagation?.();
 if(picker)picker.value='';
 notice('Backup restores are paused. No progress was imported, rolled back or cleared.');
 const panel=installReview();if(panel)panel.open=true;
 return {restoreDisabled:true};
}
let installed=false,attempts=0;
function install(){
 if(installed)return;
 const btn=document.getElementById('save-export'),picker=document.getElementById('save-file');
 if(!btn||!picker||typeof btn.onclick!=='function'||typeof picker.onchange!=='function'){
  if(attempts++<45)setTimeout(install,250);return;
 }
 installed=true;

 // The root's original Settings UI remains the only player-facing save interface.
 btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();download()},true);
 // Block direct property calls too; the early document capture gate blocks
 // normal clicks/changes even before this coordinator finishes loading.
 picker.onchange=e=>reviewRestore(picker,e);
 const importButton=document.getElementById('save-import');
 if(importButton){importButton.onclick=e=>reviewRestore(null,e);importButton.setAttribute('aria-label','Review backups; restore is paused');importButton.title='Restore paused: current progress will not be replaced';}
 getStatus();installReview();
}
// No startup recovery write, record cleanup, or automatic reload.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
window.BUPlatformSaves=Object.freeze({
 version:'2.0.0-test',safetyRevision:'issue13-quarantine-v1',restoreDisabled:true,keys:Object.freeze({TEST,FEEL,JOURNAL,COMMITTED}),
 makeBackup,dryRun,applyBackup,validateTrails,recoverPending,reviewRestore,recoveryEvidence,bound:()=>installed
});
})();