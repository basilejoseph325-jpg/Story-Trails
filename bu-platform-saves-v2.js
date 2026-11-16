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
const TX='bible-unfolded-import-transaction-v3',TX_DONE='bible-unfolded-import-commit-v3';
const CONTROLS=[JOURNAL,COMMITTED,TX,TX_DONE];
const LOCK='bible-unfolded-live-backup-restore-v3';
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
  if(allowed(k)&&!CONTROLS.includes(k)){const v=read(k);if(v!==null)a[k]=v}
 }
 return a;
}
function validateTrails(raw){
 if(raw===null)return {present:false,level:null,coins:null,completedCount:0};
 if(!dataStr(raw,220000))throw Error('Word Trails save exceeds the safe size limit.');
 const s=getJson(raw);if(!s)throw Error('Word Trails save is not a valid object.');
 for(const k of ['level','unlocked']){
  if(!Number.isInteger(s[k])||s[k]<0||s[k]>49)throw Error('Word Trails '+k+' is out of range.');
 }
 for(const k of ['coins','points'])if(!safeNum(s[k]))throw Error('Word Trails '+k+' is invalid.');
 const fields=['completed','sparks','claimedSparks','boardBible','paidWords','paidBonuses','claimedFreeHints'];
 for(const k of fields){
  // Older Word Trails prototypes did not save every discovery/bonus ledger.
  // Preserve the original raw save; the current game supplies missing arrays.
  if(s[k]===undefined)continue;
  if(!Array.isArray(s[k])||s[k].length>6000)throw Error('Word Trails '+k+' is invalid.');
  for(const item of s[k]){
   if(typeof item==='number'){if(!Number.isSafeInteger(item)||item<0||item>49)throw Error('Bad Word Trails '+k+' level.')}
   else if(typeof item==='string'){if(item.length>90||!/^[a-z0-9_:|.-]+$/i.test(item))throw Error('Bad Word Trails '+k+' value.')}
   else throw Error('Bad Word Trails '+k+' entry.');
  }
 }
 if(s.progress!==null&&s.progress!==undefined){
  if(!own(s.progress)||!Number.isInteger(s.progress.level)||s.progress.level<0||s.progress.level>49)throw Error('Word Trails in-progress level is invalid.');
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
function normalizeBackup(raw){
 const data=typeof raw==='string'?parse(raw):raw;
 if(!own(data)||data.format!=='BibleUnfoldedSave'||!own(data.keys)||![1,2].includes(data.version))
  throw Error('This is not a compatible Bible Unfolded backup.');
 if(data.version===2)return data;
 // Historical version-1 exports had only a keys object. Convert that into
 // the existing version-2 format WITHOUT invoking the unsafe native importer.
 const pairs=Object.entries(data.keys);
 if(!pairs.length||pairs.length>MAX_KEYS)throw Error('Old backup has an invalid number of keys.');
 const keys={};let trail=null;
 for(const [k,v] of pairs){
  if(!allowed(k)&&k!==TEST)throw Error('Old backup contains an invalid key.');
  if(typeof v!=='string'||v.length>MAX_NATIVE_VALUE)throw Error('Old backup contains invalid saved data.');
  if(CONTROLS.includes(k))continue; // old import-journal control records are never replayed
  if(k===TEST)trail=v;
  else keys[k]=v;
 }
 if(!Object.keys(keys).length&&trail===null)throw Error('Old backup has no usable game data.');
 return {format:'BibleUnfoldedSave',version:BACKUP_VERSION,exportedAt:data.exportedAt||null,
  scope:'Converted older Bible Unfolded backup',keys,
  extensions:{wordTrailsNext:{format:'WordTrailsNextLIVE',version:1,
   state:trail,feel:null,coinsNeverConvertToInsightTokens:true}}};
}
function nativeData(data){
 if(!own(data)||data.format!=='BibleUnfoldedSave'||data.version!==BACKUP_VERSION||
    !own(data.keys))throw Error('This is not a compatible complete LIVE backup.');
 const pairs=Object.entries(data.keys);
 if(!pairs.length||pairs.length>MAX_KEYS||
   pairs.some(([k,v])=>!allowed(k)||CONTROLS.includes(k)||typeof v!=='string'||v.length>MAX_NATIVE_VALUE))
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
 const c=normalizeBackup(candidate);
 const v=nativeData(c);
 const existing=currentSnapshot();
 const incoming=walletSummary(c.keys),current=walletSummary(existing.keys);
 const protectedWheels=wheelSet({...existing.keys,...c.keys},existing.keys);
 const sameKeys=Object.entries(c.keys).every(([k,val])=>existing.keys[k]===val);
 return Object.freeze({
  valid:true,version:BACKUP_VERSION,sourceVersion:typeof candidate==='string'?parse(candidate).version:candidate.version,nativeKeys:v.nativeKeys,
  incomingWallet:incoming,currentWallet:current,
  incomingWordTrails:v.test,currentWordTrails:validateTrails(existing.trail),
  preservedOwnedWheels:[...protectedWheels],
  testCoinsQuarantined:true,canApply:true,restoreDisabled:false,
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
// Version-1 journals have only PREVIOUS, without intended AFTER values.
// Their meaning cannot be proved. Retain them, never apply their old data.
function legacyEvidence(){
 const raw=read(JOURNAL),marker=read(COMMITTED);
 if(raw===null&&marker===null)return null;
 const j=raw===null?null:getJson(raw);
 return {kind:raw===null?'orphan-marker':!j?'malformed':
   j.version===1&&own(j.previous)?'legacy-previous-only':'unsupported-format',
  committedMarkerPresent:marker!==null};
}
function validatedTransaction(raw){
 const tx=getJson(raw);
 if(!tx||tx.version!==3||!/^[a-f0-9-]{16,64}$/.test(tx.id)||!own(tx.changes)||
    !['prepared','conflict'].includes(tx.phase))return null;
 const entries=Object.entries(tx.changes);
 if(!entries.length||entries.length>MAX_KEYS+2)return null;
 for(const [k,v] of entries){
  if((!allowed(k)&&!keysToKeep.includes(k))||CONTROLS.includes(k)||!own(v)||
    !Object.prototype.hasOwnProperty.call(v,'before')||
    !Object.prototype.hasOwnProperty.call(v,'after')||
    !dataStr(v.before,MAX_NATIVE_VALUE)||!dataStr(v.after,MAX_NATIVE_VALUE))return null;
 }
 return tx;
}
function recoverPending(){
 const legacy=legacyEvidence(),raw=read(TX),done=read(TX_DONE);
 if(raw===null){
  return Object.freeze({recovered:false,quarantined:!!legacy||done!==null,
   legacy:legacy?.kind||null,kind:done!==null?'orphan-commit':legacy?.kind||'none',
   restoreDisabled:false,pending:false});
 }
 const tx=validatedTransaction(raw);
 if(!tx)return Object.freeze({recovered:false,quarantined:true,kind:'invalid-new-journal',
  legacy:legacy?.kind||null,pending:true,restoreDisabled:false});
 if(tx.phase==='conflict'||(done!==null&&done!==tx.id))
  return Object.freeze({recovered:false,quarantined:true,kind:'conflict',
   legacy:legacy?.kind||null,pending:true,restoreDisabled:false});
 const entries=Object.entries(tx.changes);
 const changed=entries.filter(([k,v])=>read(k)!==v.before&&read(k)!==v.after);
 if(changed.length){
  // Never "fix" a different current value, even if an old transaction failed.
  // Also do NOT repeatedly retry this rollback after another tab progressed.
  try{
   if(read(TX)===raw)setExact(TX,JSON.stringify({...tx,phase:'conflict'}));
  }catch(_){}
  return Object.freeze({recovered:false,quarantined:true,kind:'newer-progress-conflict',
   keys:changed.map(x=>x[0]),legacy:legacy?.kind||null,pending:true,restoreDisabled:false});
 }
 if(done===tx.id){
  if(entries.every(([k,v])=>read(k)===v.after)){
   // The completed transaction is verified. Delete transaction first; an
   // orphan COMMIT marker cannot ever trigger a rollback after a crash.
   localStorage.removeItem(TX);localStorage.removeItem(TX_DONE);
   return Object.freeze({recovered:false,committed:true,quarantined:!!legacy,
    legacy:legacy?.kind||null,kind:legacy?.kind||'committed',pending:false,restoreDisabled:false});
  }
  return Object.freeze({recovered:false,quarantined:true,kind:'committed-conflict',
   pending:true,legacy:legacy?.kind||null,restoreDisabled:false});
 }
 // No matching commit marker: roll back only exact AFTER values that this
 // transaction wrote. Never replay old PREVIOUS values over newer values.
 try{
  for(const [k,v] of entries.reverse()){
   if(read(k)===v.after&&v.before!==v.after)setExact(k,v.before);
   else if(read(k)!==v.before)throw Error('Current data changed during recovery');
  }
  localStorage.removeItem(TX);
  return Object.freeze({recovered:true,quarantined:!!legacy,legacy:legacy?.kind||null,
   kind:legacy?.kind||'rolled-back',pending:false,restoreDisabled:false});
 }catch(e){
  return Object.freeze({recovered:false,quarantined:true,kind:'recovery-conflict',
   pending:true,reason:e.message,legacy:legacy?.kind||null,restoreDisabled:false});
 }
}
function uniqueId(){
 const a=new Uint8Array(16);crypto.getRandomValues(a);
 return Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
}
async function applyBackup(candidate,{reload=true}={}){
 const c=normalizeBackup(candidate),plan=dryRun(c);
 if(!navigator.locks?.request)throw Error('Safe restore needs a newer browser with Web Locks support. Please update Chrome or Safari.');
 return navigator.locks.request(LOCK,{mode:'exclusive',ifAvailable:true},async lock=>{
  if(!lock)throw Error('Another game tab is restoring a backup. Close it and try again.');
  const pending=recoverPending();
  if(pending.pending)throw Error('An interrupted restore needs review; current progress has not been replaced.');
  const existing=currentSnapshot();
  const desired=protectedNative(c.keys,existing.keys);
  if(c.extensions.wordTrailsNext.state!==null)desired[TEST]=c.extensions.wordTrailsNext.state;
  if(c.extensions.wordTrailsNext.feel!==null)desired[FEEL]=c.extensions.wordTrailsNext.feel;
  const changes={};
  for(const [k,after] of Object.entries(desired)){
   const before=read(k);
   if(before!==after)changes[k]={before,after};
  }
  if(!Object.keys(changes).length)return {ok:true,unchanged:true,plan};
  const transaction={version:3,id:uniqueId(),phase:'prepared',
   createdAt:new Date().toISOString(),changes};
  const original=JSON.stringify(transaction);
  // The complete BEFORE/AFTER journal must be durable before the first write.
  // A QuotaExceeded error here leaves every saved game value untouched.
  setExact(TX,original);
  window.__bu388SkipCheckpoint=true;
  try{
   for(const [k,v] of Object.entries(changes)){
    if(read(k)!==v.before)throw Error('Another game tab changed '+k+' during restore.');
    setExact(k,v.after);
   }
   setExact(TX_DONE,transaction.id);
   // Verify all writes again before declaring the restore complete.
   for(const [k,v] of Object.entries(changes))
    if(read(k)!==v.after)throw Error('Restore verification failed for '+k);
   localStorage.removeItem(TX);
   localStorage.removeItem(TX_DONE);
  }catch(e){
   const status=recoverPending();
   window.__bu388SkipCheckpoint=false;
   throw Error(status.pending?'Restore interrupted: '+e.message+
    '. Newer progress has been left untouched.':'Restore cancelled safely: '+e.message);
  }
  if(reload)location.reload();
  return {ok:true,changed:Object.keys(changes).length,plan};
 });
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