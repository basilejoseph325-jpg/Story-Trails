'use strict';
// Issue 13: require SAFE, WORKING restores rather than a disabled Import button.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const src=fs.readFileSync('bu-platform-saves-v2.js','utf8');
const J='bible-unfolded-word-trails-import-rollback-v2',C='bible-unfolded-word-trails-import-committed-v2';
const TX='bible-unfolded-import-transaction-v3',DONE='bible-unfolded-import-commit-v3';
const STORY='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1';
const oldStory='{"chapter":11,"step":2}',newStory='{"chapter":12,"step":8}';
const oldWallet=JSON.stringify({coins:90,points:20,purchases:['seawheel'],equippedWheel:'seawheel'});
const newWallet=JSON.stringify({coins:190,points:55,purchases:[],equippedWheel:'classic'});
const oldTrail=JSON.stringify({level:2,unlocked:3,coins:35,points:4,completed:[0,1]});
const newTrail=JSON.stringify({level:29,unlocked:30,coins:140,points:4,completed:[0,1,29]});
function boot(seed={},options={}){
 const map=new Map(Object.entries(seed)),writes=[];
 const localStorage={get length(){return map.size},key:i=>[...map.keys()][i]??null,
  getItem:k=>map.has(k)?map.get(k):null,
  setItem(k,v){const val=String(v);if(options.reject?.(k,val))throw Error('QuotaExceededError fixture');writes.push(['set',k,val]);map.set(k,val)},
  removeItem(k){writes.push(['remove',k]);map.delete(k)}};
 const scope={
  window:{BUPlatformSaves:Object.freeze({pendingSafetyLoad:true,restoreDisabled:true})},
  localStorage,document:{readyState:'loading',addEventListener(){}},
  navigator:{locks:{request:async(_name,_opts,fn)=>fn({name:'lock'})}},
  crypto:{getRandomValues(a){a.fill(171);return a}},
  console,Date,setTimeout(){},Blob,URL,Uint8Array,Math};
 vm.createContext(scope);vm.runInContext(src,scope,{timeout:3000});
 return {api:scope.window.BUPlatformSaves,map,writes,scope};
}
const seed=()=>({[STORY]:oldStory,[W]:oldWallet,[T]:oldTrail,'qa-unrelated':'untouched'});
const snapshot=b=>Object.fromEntries(b.map);
function backup(b){return JSON.parse(JSON.stringify(b.api.makeBackup()))}
async function main(){
 // Old previous-only journals can NEVER overwrite newer Story or wallet data.
 for(const records of [
  {[J]:JSON.stringify({version:1,previous:{[STORY]:'OLD', [W]:'OLD-WALLET'}})},
  {[J]:'{malformed'}, {[J]:JSON.stringify({version:1,previous:{[STORY]:'OLD'}}),[C]:'yes'},
  {[C]:'yes'}, {[J]:JSON.stringify({version:2,entries:[]})}
 ]){
  const original={...seed(),...records},b=boot(original);
  assert.equal(b.api.restoreDisabled,false);
  assert.equal(b.api.recoverPending().recovered,false);
  assert.deepEqual(snapshot(b),original,'Startup must not replace legacy records or current progress');
  assert.deepEqual(b.writes,[],'Unsafe older journal must NEVER write at startup');
  const exportFile=backup(b);
  assert.equal(exportFile.keys[J],undefined);assert.equal(exportFile.keys[C],undefined);
  console.log('PASS_ISSUE13_LEGACY_QUARANTINE',b.api.recoverPending().kind);
 }
 // Current complete (version 2) backup must be importable and retain purchase ownership.
 const b=boot(seed()),data=backup(b);
 data.keys[STORY]=newStory;data.keys[W]=newWallet;data.extensions.wordTrailsNext.state=newTrail;
 assert.equal(b.api.dryRun(data).canApply,true);
 let result=await b.api.applyBackup(data,{reload:false});
 assert(result.ok&&!result.unchanged);
 assert.equal(b.map.get(STORY),newStory);
 assert.equal(JSON.parse(b.map.get(W)).coins,190);
 assert(JSON.parse(b.map.get(W)).purchases.includes('seawheel'),'Paid wheel ownership must survive import');
 assert.equal(b.map.get(T),newTrail);
 assert(!b.map.has(TX)&&!b.map.has(DONE),'Finished restore must clear new journal');
 assert.equal(b.map.get('qa-unrelated'),'untouched');
 assert.equal(b.api.recoverPending().recovered,false);
 console.log('PASS_ISSUE13_REAL_V2_IMPORT_AND_WHEEL_OWNERSHIP');

 // Older version 1 export must use the SAME safe transaction path.
 const older={format:'BibleUnfoldedSave',version:1,keys:{
  [STORY]:oldStory,[W]:oldWallet,[T]:oldTrail,
  [J]:JSON.stringify({version:1,previous:{[STORY]:'DANGEROUS'}}),[C]:'yes'}};
 const v1=boot({[STORY]:newStory,[W]:newWallet,[T]:newTrail});
 result=await v1.api.applyBackup(older,{reload:false});
 assert(result.ok);assert.equal(v1.map.get(STORY),oldStory);
 assert.equal(v1.map.get(T),oldTrail);
 assert.equal(v1.map.get(J),undefined,'Legacy journal inside old backup must not be restored');
 assert.equal(v1.map.get(C),undefined);
 assert(!v1.map.has(TX)&&!v1.map.has(DONE));
 console.log('PASS_ISSUE13_REAL_V1_IMPORT_WITHOUT_UNSAFE_NATIVE_HANDLER');

 // A failed write must roll back only verified writes, without deleting newer progress.
 let failedOnce=false;
 const broken=boot(seed(),{reject:(k,v)=>{
  if(k===W&&v.includes('"coins":190')&&!failedOnce){failedOnce=true;return true}
  return false
 }});
 await assert.rejects(()=>broken.api.applyBackup(data,{reload:false}),/Restore cancelled safely/);
 assert.equal(broken.map.get(STORY),oldStory);assert.equal(broken.map.get(W),oldWallet);
 assert(!broken.map.has(TX)&&!broken.map.has(DONE));
 console.log('PASS_ISSUE13_INTERRUPTED_RESTORE_ROLLS_BACK_OWN_WRITES');

 // Reboot midway through a new transaction: recover only exact AFTER values.
 const changes={[STORY]:{before:oldStory,after:newStory},[W]:{before:oldWallet,after:newWallet}};
 const tx={version:3,id:'abababababababababababababababab',phase:'prepared',changes};
 const midway=boot({...seed(),[STORY]:newStory,[TX]:JSON.stringify(tx)});
 assert.equal(midway.map.get(STORY),oldStory);
 assert.equal(midway.map.get(W),oldWallet);
 assert(!midway.map.has(TX));
 console.log('PASS_ISSUE13_MID_TRANSACTION_IDEMPOTENT_RECOVERY');

 // If another tab made NEWER progress, neither recovery nor reload may replay old values.
 const newerWallet=JSON.stringify({coins:444,points:111,purchases:['seawheel']});
 const conflicting={...seed(),[STORY]:newStory,[W]:newerWallet,[TX]:JSON.stringify(tx)};
 const conflict=boot(conflicting);
 assert.equal(conflict.api.recoverPending().pending,true);
 assert.equal(conflict.map.get(W),newerWallet);
 assert.equal(conflict.map.get(STORY),newStory);
 assert.equal(JSON.parse(conflict.map.get(TX)).phase,'conflict');
 const repeated=boot(snapshot(conflict));
 assert.equal(repeated.map.get(W),newerWallet);
 assert.equal(repeated.map.get(STORY),newStory);
 await assert.rejects(()=>repeated.api.applyBackup(data,{reload:false}),/interrupted restore needs review/);
 console.log('PASS_ISSUE13_CONFLICT_PRESERVES_NEWER_VALUES_AND_BLOCKS_OTHER_RESTORE');

 // Committed transaction with transaction-bound ID stays committed on reload.
 const committed=boot({...seed(),[STORY]:newStory,[W]:newWallet,[TX]:JSON.stringify(tx),[DONE]:tx.id});
 assert.equal(committed.map.get(STORY),newStory);assert.equal(committed.map.get(W),newWallet);
 assert(!committed.map.has(TX)&&!committed.map.has(DONE));
 console.log('PASS_ISSUE13_COMMIT_MARKER_VERIFICATION');

 // Malformed new journal fails closed, without changing any player data.
 const malformed=boot({...seed(),[TX]:'not-json'});
 assert.equal(malformed.api.recoverPending().pending,true);
 assert.equal(malformed.map.get(STORY),oldStory);
 await assert.rejects(()=>malformed.api.applyBackup(data,{reload:false}),/interrupted restore needs review/);
 console.log('PASS_ISSUE13_MALFORMED_JOURNAL_NO_OVERWRITE');

 // Bad imports and missing secure locks must not mutate a single game key.
 const invalid=boot(seed());
 await assert.rejects(()=>invalid.api.applyBackup({format:'BibleUnfoldedSave',version:1,keys:{bad:'x'}},{reload:false}),/invalid key/);
 assert.equal(invalid.map.get(STORY),oldStory);
 invalid.scope.navigator.locks=undefined;
 await assert.rejects(()=>invalid.api.applyBackup(data,{reload:false}),/Web Locks support/);
 console.log('PASS_ISSUE13_VALIDATION_AND_BROWSER_LOCK_GATE');

 // Old cached coordinator must exit behind PR #15's early protection sentinel.
 const before=boot({...seed(),[J]:JSON.stringify({version:1,previous:{[STORY]:'OLD'}})});
 const oldCode=execFileSync('git',['show','1692945:bu-platform-saves-v2.js'],{encoding:'utf8'});
 const guarded={window:{BUPlatformSaves:{pendingSafetyLoad:true}},localStorage:before.scope.localStorage,
  document:{readyState:'loading',addEventListener(){}},console,setTimeout(){}};
 vm.runInNewContext(oldCode,guarded);
 assert.equal(before.map.get(STORY),oldStory);
 console.log('PASS_ISSUE13_OLD_CACHED_COORDINATOR_BLOCKED');
 console.log('PASS_ISSUE13_SAFE_RESTORE_MODEL_FINAL');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1});
