/* LIVE coordinated backup/restore. Legacy journals are evidence only. */
(()=>{'use strict';
if(window.BUPlatformSaves&&!window.BUPlatformSaves.pendingSafetyLoad)return;
const NATIVE=/^(?:bible-unfolded|story-trails)-[a-z0-9_.-]+$/i;
const TEST='bible-unfolded-word-trails-next-v1';
const FEEL='bu-wt-next-feel-v2';
const SHARED_AUDIO='bu-platform-audio-preferences-v1',DAILY='bu-visual-lab-daily-word-trail-v1';
const EXTRA={sharedAudio:SHARED_AUDIO,dailyWordTrail:DAILY};
const JOURNAL='bible-unfolded-word-trails-import-rollback-v2';
const COMMITTED='bible-unfolded-word-trails-import-committed-v2';
const TRANSACTION='bible-unfolded-restore-transaction-v3', EVIDENCE='bible-unfolded-restore-conflict-v3';
const PREVIOUS_TX='bible-unfolded-import-transaction-v3',PREVIOUS_DONE='bible-unfolded-import-commit-v3';
const CONTROL=new Set([JOURNAL,COMMITTED,TRANSACTION,EVIDENCE,PREVIOUS_TX,PREVIOUS_DONE,'bible-unfolded-live-wallet-checkpoint-v1']);
const BACKUP_VERSION=2,MAX_BYTES=2000000,MAX_KEYS=100,MAX_NATIVE_VALUE=300000;
const WALLETS=['bible-unfolded-rewards-v17','bible-unfolded-rewards-v17-recovery-v3811'];
const OWNERSHIP=['bible-unfolded-wheel-ownership-v3825','bible-unfolded-wheel-ownership-v3825-backup'];
const WHEELS=['goldwheel','moonwheel','seawheel'];
const keysToKeep=[TEST,FEEL];
const own=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const allowed=k=>typeof k==='string'&&k.length<=160&&NATIVE.test(k)&&k!==TEST&&!CONTROL.has(k)&&!['__proto__','constructor','prototype'].includes(k);
const parse=s=>JSON.parse(s);
const safeNum=x=>Number.isSafeInteger(x)&&x>=0&&x<=1000000000;
const dataStr=(v,max)=>v===null||(typeof v==='string'&&v.length<=max);
const read=k=>localStorage.getItem(k);
const rawSet=window.Storage?window.Storage.prototype.setItem:localStorage.setItem,rawRemove=window.Storage?window.Storage.prototype.removeItem:localStorage.removeItem;
const storageSet=(key,value)=>rawSet.call(localStorage,key,value),storageRemove=key=>rawRemove.call(localStorage,key);
const getJson=s=>{try{const v=parse(s);return own(v)?v:null}catch(_){return null}};
function saveFailure(){
 const show=()=>{
  let el=document.getElementById('bu-save-health');
  if(!el){el=document.createElement('div');el.id='bu-save-health';el.setAttribute('role','alert');el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483646;padding:12px;background:#712d22;color:white;font:14px/1.4 system-ui';document.body.append(el);}
  el.textContent='Progress could not be saved on this device. Free some device storage before continuing. Keep this game tab open; recent progress may not survive a reload.';
 };
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
}
// Native save functions already catch storage errors. Make silent browser write
// failures visible too, without replacing any game mode's save implementation.
function monitorStorage(w){
 try{
  const proto=w.Storage.prototype,storage=w.localStorage,original=proto.setItem;
  proto.setItem=function(key,value){
   if(this!==storage||!(NATIVE.test(String(key))||key===FEEL||Object.values(EXTRA).includes(key)))return original.call(this,key,value);
   try{original.call(this,key,value);if(storage.getItem(String(key))!==String(value))throw Error('Save verification failed.');}
   catch(e){if(!window.BULiveWalletSession||window.BULiveWalletSession.writable())saveFailure();throw e;}
  };
 }catch(_){}
}
monitorStorage(window);
// Word Trails owns its existing save code in a same-origin frame. Monitor that
// storage boundary too; keep its puzzle/audio/reward implementation untouched.
document.addEventListener('load',event=>{
 if(event.target?.tagName==='IFRAME')monitorStorage(event.target.contentWindow);
},true);
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
  if(!Number.isInteger(s[k])||s[k]<0||s[k]>54)throw Error('Word Trails '+k+' is out of range.');
 }
 for(const k of ['coins','points'])if(!safeNum(s[k]))throw Error('Word Trails '+k+' is invalid.');
 if(!Array.isArray(s.completed))throw Error('Word Trails completed levels are missing.');
 const fields=['completed','sparks','claimedSparks','boardBible','paidWords','paidBonuses','claimedFreeHints'];
 for(const k of fields){
  // Older Word Trails prototypes did not save every discovery/bonus ledger.
  // Preserve the original raw save; the current game supplies missing arrays.
  if(s[k]===undefined)continue;
  if(!Array.isArray(s[k])||s[k].length>6000)throw Error('Word Trails '+k+' is invalid.');
  for(const item of s[k]){
   if(typeof item==='number'){if(!Number.isSafeInteger(item)||item<0||item>54)throw Error('Bad Word Trails '+k+' level.')}
   else if(typeof item==='string'){if(item.length>90||!/^[a-z0-9_:|.-]+$/i.test(item))throw Error('Bad Word Trails '+k+' value.')}
   else throw Error('Bad Word Trails '+k+' entry.');
  }
 }
 if(s.progress!==null&&s.progress!==undefined){
  if(!own(s.progress)||!Number.isInteger(s.progress.level)||s.progress.level<0||s.progress.level>54)throw Error('Word Trails in-progress level is invalid.');
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
// Accidental-corruption checksum, not authentication of untrusted files.
function checksum(value){
 const text=JSON.stringify(value);let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16).padStart(8,'0');
}
const backupChecksum=c=>checksum([c.keys,c.extensions]);
const journalChecksum=t=>checksum([t.version,t.id,t.phase,t.createdAt,t.entries]);
function normalize(candidate){
 if(typeof candidate!=='string'&&JSON.stringify(candidate).length>MAX_BYTES)throw Error('Backup is over the 2 MB limit.');
 const c=typeof candidate==='string'?(candidate.length>MAX_BYTES?(()=>{throw Error('Backup is over the 2 MB limit.');})():parse(candidate)):JSON.parse(JSON.stringify(candidate));
 if(!own(c)||c.format!=='BibleUnfoldedSave'||![1,2].includes(c.version))throw Error('This is not a supported Bible Unfolded backup.');
 if(c.scope!==undefined&&c.scope!=='Bible Unfolded LIVE')throw Error('Only LIVE backups can be restored here. TEST data stays separate.');
 if(c.version===1){
  if(!own(c.keys))throw Error('Missing native save section.');
  const trail=Object.prototype.hasOwnProperty.call(c.keys,TEST)?c.keys[TEST]:null;
  delete c.keys[TEST];
  // Old rollback records are never imported, even if an old exporter included them.
  for(const k of CONTROL)delete c.keys[k];
  c.version=2;c.extensions={wordTrailsNext:{format:'WordTrailsNextLIVE',version:1,state:trail,feel:null}};
 }
 nativeData(c);return c;
}
function validateNative(key,raw){
 if(typeof raw!=='string'||raw.length>MAX_NATIVE_VALUE)throw Error('Invalid native save value.');
 if(raw.trim().startsWith('{')||raw.trim().startsWith('[')){
  let value;try{value=parse(raw)}catch(_){throw Error('Damaged saved data: '+key);}
  if(/-adventure-v/.test(key)){
   if(!own(value))throw Error('Invalid Story Adventure progress.');
   for(const entry of Object.values(value)){
    if(!own(entry)||(entry.step!==undefined&&(!Number.isSafeInteger(entry.step)||entry.step<0||entry.step>200))||
       (entry.complete!==undefined&&typeof entry.complete!=='boolean'))throw Error('Invalid Story Adventure chapter.');
    for(const field of ['solved','hints','revealed','work'])if(entry[field]!==undefined&&!own(entry[field]))throw Error('Invalid Story Adventure '+field+'.');
   }
  }
 }else if(/-adventure-v|rewards-v|wheel-ownership/.test(key))throw Error('Damaged saved data: '+key);
}
function validateDaily(raw){
 if(raw===null)return;
 if(!dataStr(raw,MAX_NATIVE_VALUE))throw Error('Daily Word Trail save exceeds the safe limit.');
 const d=getJson(raw);if(!d||d.version!==1||!own(d.days)||Object.keys(d.days).length>400)throw Error('Invalid Daily Word Trail save.');
 for(const [day,entry] of Object.entries(d.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!own(entry)||!Number.isInteger(entry.board)||entry.board<0||entry.board>38||typeof entry.completed!=='boolean'||
   !Array.isArray(entry.solved)||entry.solved.length>12||entry.solved.some(w=>typeof w!=='string'||!/^[A-Z]{2,20}$/.test(w))||
   !Array.isArray(entry.hints)||entry.hints.length>2||entry.hints.some(h=>typeof h!=='string'||!/^[0-6]-[0-6]$/.test(h)))throw Error('Invalid Daily Word Trail entry.');
 }
}
function nativeData(data){
 if(!own(data)||data.format!=='BibleUnfoldedSave'||data.version!==BACKUP_VERSION||
    !own(data.keys))throw Error('This is not a compatible complete LIVE backup.');
 if(data.integrity!==undefined&&(!own(data.integrity)||data.integrity.algorithm!=='fnv1a32-utf16-v1'||data.integrity.value!==backupChecksum(data)))throw Error('Backup checksum does not match. The file may be damaged.');
 const pairs=Object.entries(data.keys);
 if(!pairs.length||pairs.length>MAX_KEYS||pairs.some(([k,v])=>!allowed(k)||typeof v!=='string'||v.length>MAX_NATIVE_VALUE))
  throw Error('The native game backup contains invalid keys.');
 for(const [key,value] of pairs)validateNative(key,value);
 const ext=data.extensions;
 if(!own(ext)||!own(ext.wordTrailsNext)||ext.wordTrailsNext.format!=='WordTrailsNextLIVE'||
     ext.wordTrailsNext.version!==1)throw Error('Missing versioned Word Trails save section.');
 if(ext.sharedAudio!==undefined)validateFeel(ext.sharedAudio);
 if(ext.dailyWordTrail!==undefined)validateDaily(ext.dailyWordTrail);
 const t=ext.wordTrailsNext;
 if(!dataStr(t.state,220000)||!dataStr(t.feel,10000))throw Error('Invalid Word Trails backup content.');
 const test=validateTrails(t.state);validateFeel(t.feel);
 for(const k of WALLETS){
  if(!Object.prototype.hasOwnProperty.call(data.keys,k))continue;
  const w=getJson(data.keys[k]);
  if(!w||!Number.isSafeInteger(w.points)||!safeNum(w.coins))throw Error('Shared wallet in backup is invalid.');
  if(w.liveSharedWallet){window.BULiveWordTrailsEconomy.validate(w.liveSharedWallet);if(!Object.prototype.hasOwnProperty.call(data.keys,WALLETS[0])||!Object.prototype.hasOwnProperty.call(data.keys,WALLETS[1])||data.keys[WALLETS[0]]!==data.keys[WALLETS[1]]||t.state===null)throw Error('Shared-wallet backups require matching wallet copies and Word Trails progress.');}
 }
 return {nativeKeys:pairs.length,test};
}
function walletSummary(kv){
 const w=getJson(kv[WALLETS[0]]||kv[WALLETS[1]]||'');
 return w?{points:w.points,insightTokens:w.coins}:null;
}
function currentSnapshot(){
 const keys=inventory();
 return {keys,trail:read(TEST),feel:read(FEEL),extras:Object.fromEntries(Object.entries(EXTRA).map(([name,key])=>[name,read(key)]))};
}
function makeBackup(){
 const state=currentSnapshot();
 if(getJson(state.keys[WALLETS[0]]||'')?.liveSharedWallet)state.keys[WALLETS[1]]=state.keys[WALLETS[0]];
 if(!Object.keys(state.keys).length)throw Error('No native progress found to back up.');
 if(Object.keys(state.keys).length>MAX_KEYS||Object.entries(state.keys).some(([k,v])=>!allowed(k)||v.length>MAX_NATIVE_VALUE))
   throw Error('Saved native data exceeds safe backup limits.');
 validateTrails(state.trail);validateFeel(state.feel);
 const backup={format:'BibleUnfoldedSave',version:BACKUP_VERSION,
  exportedAt:new Date().toISOString(),scope:'Bible Unfolded LIVE',
  keys:state.keys,extensions:{...state.extras,wordTrailsNext:{format:'WordTrailsNextLIVE',
    version:1,state:state.trail,feel:state.feel,coinsNeverConvertToInsightTokens:true}}};
 backup.integrity={algorithm:'fnv1a32-utf16-v1',value:backupChecksum(backup)};
 nativeData(backup);
 if(JSON.stringify(backup).length>MAX_BYTES)throw Error('Backup is over the 2 MB limit.');
 return backup;
}
function dryRun(candidate){
 const c=normalize(candidate);
 const v=nativeData(c);
 const existing=currentSnapshot();
 const incoming=walletSummary(c.keys),current=walletSummary(existing.keys);
 let currentTrails;try{currentTrails=validateTrails(existing.trail)}catch(_){currentTrails={damaged:true};}
 const protectedWheels=wheelSet({...existing.keys,...c.keys},existing.keys);
 const sameKeys=Object.entries(c.keys).every(([k,val])=>existing.keys[k]===val);
 return Object.freeze({
  valid:true,version:BACKUP_VERSION,nativeKeys:v.nativeKeys,
  incomingWallet:incoming,currentWallet:current,
  incomingWordTrails:v.test,currentWordTrails:currentTrails,
  preservedOwnedWheels:[...protectedWheels],
  testCoinsQuarantined:true,canApply:!read(TRANSACTION),restoreDisabled:!!read(TRANSACTION),
  restoreReason:read(TRANSACTION)?'An interrupted restore needs recovery before another import.':null,
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
 // Restore primary and recovery wallet as one logical balance.
 const importedWallet=incoming[WALLETS[0]]||incoming[WALLETS[1]];
 if(importedWallet)for(const k of WALLETS)next[k]=importedWallet;
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
  const raw=read(JOURNAL)??read(PREVIOUS_TX),committed=read(COMMITTED)??read(PREVIOUS_DONE);
  if(raw===null&&committed===null)return Object.freeze({recovered:false,quarantined:false,restoreDisabled:true,kind:'none'});
  const journal=raw===null?null:getJson(raw);
  const kind=raw===null?'orphan-marker':!journal?'malformed':
   journal.version===1&&own(journal.previous)?'legacy-previous-only':'unsupported-format';
  return Object.freeze({recovered:false,quarantined:true,restoreDisabled:true,
   kind,committedMarkerPresent:committed!==null,
   reason:'The retained record cannot prove which current values belong to the old restore. Nothing was rolled back or cleared.'});
 }catch(_){return Object.freeze({recovered:false,quarantined:true,restoreDisabled:true,kind:'storage-unavailable',reason:'Saved recovery records could not be read. Nothing was changed.'});}
}
function exact(key,value){
 if(value===null)storageRemove(key);else storageSet(key,value);
 if(read(key)!==value)throw Error('Saved data could not be verified. Free device storage and try again.');
}
const transactionKey=k=>k===TEST||k===FEEL||Object.values(EXTRA).includes(k)||allowed(k);
function transaction(raw){
 const t=getJson(raw);
 if(!t||t.version!==3||typeof t.id!=='string'||!['applying','committed'].includes(t.phase)||!Array.isArray(t.entries)||t.entries.length>MAX_KEYS*2+6)throw Error('Unrecognized recovery record.');
 if(t.checksum!==journalChecksum(t))throw Error('Recovery record checksum does not match.');
 const seen=new Set();
 for(const e of t.entries){
  if(!own(e)||!transactionKey(e.key)||seen.has(e.key)||!dataStr(e.before,MAX_NATIVE_VALUE)||!dataStr(e.after,MAX_NATIVE_VALUE))throw Error('Damaged recovery record.');
  seen.add(e.key);
 }
 return t;
}
function recoverTransaction(){
 let raw;
 try{
  raw=read(TRANSACTION);if(raw===null)return {kind:'none',recovered:false};
  const t=transaction(raw);
  if(t.phase==='committed'){exact(TRANSACTION,null);return {kind:'committed',recovered:false};}
  const conflicts=[];
  // Compare each value before rollback. Never overwrite an independent newer write.
  for(const e of [...t.entries].reverse()){
   const current=read(e.key);
   if(current===e.after)exact(e.key,e.before);
   else if(current!==e.before)conflicts.push(e.key);
  }
  if(conflicts.length)exact(EVIDENCE,JSON.stringify({format:'BibleUnfoldedRestoreConflict',transaction:t,conflicts}));
  exact(TRANSACTION,null);
  return {kind:conflicts.length?'conflict':'rolled-back',recovered:true,conflicts};
 }catch(e){return {kind:'blocked',recovered:false,reason:e.message};}
}
// Canonical wallet + receipt and recovery copy commit together. No full-game
// replacement, TEST import, save-key rename or currency conversion.
function commitNativeWallet(after,expected){
 if(!window.BULiveWalletSession?.writable())throw Error('LIVE wallet is read-only.');
 if(restoring||needsReload||read(TRANSACTION)!==null)throw Error('Finish recovery and reload before saving.');
 const wallet=getJson(after);if(!wallet||!safeNum(wallet.coins)||!Number.isSafeInteger(wallet.points))throw Error('Invalid native wallet.');
 if(wallet.liveSharedWallet)window.BULiveWordTrailsEconomy.validate(wallet.liveSharedWallet);
 if(read(WALLETS[0])!==expected)throw Error('Native wallet changed before saving.');
 const entries=WALLETS.map(key=>({key,before:read(key),after})).filter(e=>e.before!==after);
 if(!entries.length)return true;
 const t={version:3,id:crypto.randomUUID(),phase:'applying',createdAt:new Date().toISOString(),entries};t.checksum=journalChecksum(t);transaction(JSON.stringify(t));
 try{exact(TRANSACTION,JSON.stringify(t));for(const e of entries){if(read(e.key)!==e.before)throw Error('Wallet changed during save.');exact(e.key,e.after);}
  const done={...t,phase:'committed'};done.checksum=journalChecksum(done);exact(TRANSACTION,JSON.stringify(done));try{exact(TRANSACTION,null)}catch(_){}return true;
 }catch(error){recoverTransaction();saveFailure();throw error;}
}
// After a successful import, old in-memory pagehide/audio/iframe checkpoints
// must not write over the restored data on the way out. Only this old document
// and its same-origin frames are frozen; the freshly loaded game saves normally.
function freezeOldPage(){
 window.__bu388SkipCheckpoint=true;
 const show=()=>{
  if(document.getElementById('bu-restore-reload'))return;
  const panel=document.createElement('div');panel.id='bu-restore-reload';panel.setAttribute('role','alert');
  panel.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#092c35;color:#fff;padding:28px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;overflow:auto';
  const message=document.createElement('p');message.textContent='Updating saved progress. Please wait. If recovery cannot finish, free some device storage, then reload. Your game stays paused on this page to protect saved progress.';
  const reload=document.createElement('button');reload.type='button';reload.textContent='Reload game';reload.style.cssText='min-height:48px;padding:12px';reload.onclick=()=>location.reload();panel.append(message,reload);document.body.append(panel);
 };
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
 const freeze=w=>{
  try{
   const proto=w.Storage.prototype,storage=w.localStorage;
   for(const name of ['setItem','removeItem','clear']){
    const original=proto[name];proto[name]=function(...args){if(this===storage)throw Error('Progress was restored; reload this page before playing.');return original.apply(this,args);};
   }
   for(let i=0;i<w.frames.length;i++)freeze(w.frames[i]);
  }catch(_){}
 };
 freeze(window);
}
window.addEventListener('storage',event=>{
 if(needsReload||event.key!==TRANSACTION||event.newValue&&getJson(event.newValue)?.phase!=='committed')return;
 // Another updated tab completed or canceled a restore. Refresh its stale
 // in-memory game without allowing an unload checkpoint to undo the import.
 needsReload=true;freezeOldPage();location.reload();
});
let restoring=false,needsReload=false;
async function applyBackup(candidate,options={}){
 if(restoring||needsReload)throw Error('Reload the game before starting another restore.');
 if(window.BULiveWalletSession&&!window.BULiveWalletSession.writable())throw Error('Close the other game tab before restoring.');
 const c=normalize(candidate); // Copy validated input before awaiting any cross-tab lock.
 const run=()=>{
  if(restoring||needsReload)throw Error('Reload the game before starting another restore.');
  if(read(TRANSACTION)!==null)throw Error('An interrupted restore needs recovery. Reload the game first.');
  const previous=currentSnapshot(),next=protectedNative(c.keys,previous.keys);
  const desired={...next};
  // Native-only v1 backups and absent optional sections do not erase Word Trails.
  if(c.extensions.wordTrailsNext.state!==null)desired[TEST]=c.extensions.wordTrailsNext.state;
  if(c.extensions.wordTrailsNext.feel!==null)desired[FEEL]=c.extensions.wordTrailsNext.feel;
  for(const [name,key] of Object.entries(EXTRA)){const value=c.extensions[name];if(value!==null&&value!==undefined)desired[key]=value;}
  const entries=Object.entries(desired).map(([key,after])=>({key,before:read(key),after})).filter(e=>e.before!==e.after);
  if(!entries.length)return {restored:true,changed:0};
  const t={version:3,id:crypto.randomUUID(),phase:'applying',createdAt:new Date().toISOString(),entries};
  t.checksum=journalChecksum(t);
  transaction(JSON.stringify(t)); // Validate recovery limits before the first write.
  restoring=true;
  try{
   exact(TRANSACTION,JSON.stringify(t));
   for(const e of entries){
    if(read(e.key)!==e.before)throw Error('Another game tab changed progress during restore.');
    exact(e.key,e.after);
   }
   if(entries.some(e=>read(e.key)!==e.after))throw Error('Another game tab changed progress during restore.');
   const committed={...t,phase:'committed'};committed.checksum=journalChecksum(committed);
   exact(TRANSACTION,JSON.stringify(committed));
   // Once committed, cleanup failure must never trigger a rollback.
   try{exact(TRANSACTION,null)}catch(_){}
   freezeOldPage();needsReload=true;
   notice('Backup restored. Reloading the game…');
   if(options.reload!==false)location.reload();
   return {restored:true,changed:entries.length};
  }catch(e){
   const recovery=recoverTransaction();
   throw Error(e.message+' '+(recovery.kind==='blocked'?'Recovery is retained; free device storage and reload.':recovery.kind==='conflict'?'Newer changes were preserved; the interrupted restore was canceled.':'The restore was canceled; previous progress was retained.'));
  }finally{restoring=false;}
 };
 // Web Locks serialize cooperating restore tabs. Per-value checks still protect
 // against ordinary game saves and older tabs that do not participate in locks.
 if(navigator.locks)return navigator.locks.request('bible-unfolded-live-backup-restore-v3',{mode:'exclusive'},run);
 throw Error('Safe restore needs a secure browser with Web Locks. Open the HTTPS game in an updated browser.');
}
async function importFile(picker){
 const file=picker.files&&picker.files[0];if(!file)return;
 try{
  if(file.size>MAX_BYTES)throw Error('Backup is over the 2 MB limit.');
  const c=normalize(await file.text()),summary=dryRun(c);
  if(!summary.canApply)throw Error(summary.restoreReason);
  const wallet=summary.incomingWallet;
  const message='Restore this backup? Saved chapters and scores in the file will replace matching progress on this device. Other saves stay in place. Close other game tabs first.'+
   (wallet?'\nBackup: '+wallet.points+' Points, '+wallet.insightTokens+' Insight Tokens.':'')+
   (c.extensions.wordTrailsNext.state===null?'\nThis older backup does not include Word Trails; current Word Trails progress will stay.':'\nWord Trails progress and shared-wallet receipts are included. Historical Trail Coins are never added to Insight Tokens.');
  if(window.confirm(message))await applyBackup(c);
 }catch(e){notice('Restore failed: '+e.message+' No automatic legacy rollback was performed.');}
 finally{picker.value='';}
}
function getStatus(){
 let el=document.getElementById('bu-wt-save-status');
 if(el)return el;
 const native=document.getElementById('save-export')?.closest('.save-transfer');
 if(!native)return null;
 el=document.createElement('small');el.id='bu-wt-save-status';el.setAttribute('role','status');
 el.setAttribute('aria-live','polite');el.style.display='block';el.style.marginTop='8px';
 el.textContent='Complete LIVE backups also include Word Trails progress. It uses the same Insight Tokens as Rewards. Historical Trail Coins are retained, never converted.';
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
  sharedWalletCheckpoint:read('bible-unfolded-live-wallet-checkpoint-v1'),journal:read(JOURNAL),committedMarker:read(COMMITTED),previousTransaction:read(PREVIOUS_TX),previousCommit:read(PREVIOUS_DONE),transaction:read(TRANSACTION),conflict:read(EVIDENCE)};
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
  'Download a backup regularly. To restore, choose a Bible Unfolded backup file and review the confirmation. Close other game tabs first. Damaged or unsupported files are rejected before progress changes.';
 let hasEvidence=state.quarantined;try{hasEvidence=hasEvidence||read(EVIDENCE)!==null||read('bible-unfolded-live-wallet-checkpoint-v1')!==null;}catch(_){}
 panel.querySelector('#bu-live-copy-recovery').hidden=!hasEvidence||state.kind==='storage-unavailable';
 if(state.quarantined)panel.open=true;
 return panel;
}
function reviewRestore(picker,event){
 event?.preventDefault?.();event?.stopImmediatePropagation?.();
 if(picker)return importFile(picker);
 document.getElementById('save-file')?.click();
 return {restoreDisabled:false};
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
 if(importButton){importButton.onclick=e=>reviewRestore(null,e);importButton.setAttribute('aria-label','Restore a Bible Unfolded backup');importButton.title='Review and restore a backup';}
 getStatus();installReview();
 if(startupRecovery.kind==='blocked')notice('An interrupted restore could not be recovered: '+startupRecovery.reason+' Free device storage and reload before importing.');
 else if(startupRecovery.kind==='conflict')notice('An interrupted restore was canceled. Newer saves were preserved; a conflict record is retained. Download current progress before continuing.');
 else if(startupRecovery.kind==='rolled-back')notice('An interrupted restore was canceled safely. Previous progress was recovered.');
}
// Recover only the new self-contained transaction, before gameplay initializes.
let startupRecovery={kind:'none',recovered:false};
let hasTransaction=false;try{hasTransaction=read(TRANSACTION)!==null;}catch(e){startupRecovery={kind:'blocked',reason:'Device storage is unavailable.'};}
if(hasTransaction){
 freezeOldPage();
 const recover=async()=>{if(window.BULiveWalletSession&&!await window.BULiveWalletSession.ready)return {kind:'blocked',reason:'Another game tab owns the saved game.'};startupRecovery=recoverTransaction();return startupRecovery;};
 const pending=navigator.locks?navigator.locks.request('bible-unfolded-live-backup-restore-v3',{mode:'exclusive'},recover):Promise.resolve({kind:'blocked',reason:'A secure browser with Web Locks is required.'});
 pending.then(result=>{
  startupRecovery=result;
  if(result.kind!=='blocked')location.reload();
  else notice('Recovery needs attention: '+result.reason+' Free device storage and reload. Progress has not been overwritten.');
 });
}


if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
window.BUPlatformSaves=Object.freeze({
 version:'2.1.0-live',safetyRevision:'reliable-restore-v3',restoreDisabled:false,keys:Object.freeze({TEST,FEEL,SHARED_AUDIO,DAILY,JOURNAL,COMMITTED,TRANSACTION,EVIDENCE}),
 get startupRecovery(){return startupRecovery;},commitNativeWallet,makeBackup,dryRun,applyBackup,validateTrails,recoverPending,reviewRestore,recoveryEvidence,bound:()=>installed
});
})();