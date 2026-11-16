'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const code=fs.readFileSync('bu-platform-saves-v2.js','utf8');
const S='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1',J='bible-unfolded-word-trails-import-rollback-v2',C='bible-unfolded-word-trails-import-committed-v2',TX='bible-unfolded-restore-transaction-v3';
const seed={[S]:JSON.stringify({genesis_ep12:{step:8,complete:false}}),[W]:JSON.stringify({coins:777,points:-20,purchases:['seawheel'],equippedWheel:'seawheel'}),[T]:JSON.stringify({level:20,unlocked:22,coins:230,points:50,completed:[0,1]})};
function boot(initial,hook=()=>{}){
 const map=new Map(Object.entries(initial)),writes=[];let n=0;
 const storage={get length(){return map.size},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem(k,v){hook(++n,k,v,map);writes.push(k);map.set(k,String(v));},removeItem(k){hook(++n,k,null,map);writes.push(k);map.delete(k);}};
 const window={addEventListener(){}};
 const scope={window,localStorage:storage,navigator:{locks:{request:async(_,options,run)=>run()}},crypto:require('node:crypto').webcrypto,location:{reload(){}},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},console,Date,setTimeout(){},Blob,URL};
 vm.createContext(scope);vm.runInContext(code,scope);return {api:window.BUPlatformSaves,map,writes,scope};
}
function seal(t){let h=2166136261;const s=JSON.stringify([t.version,t.id,t.phase,t.createdAt,t.entries]);for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);t.checksum=(h>>>0).toString(16).padStart(8,'0');return t;}
const json=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 let cases=0;
 for(const records of [{},{[J]:'{bad'},{[J]:JSON.stringify({version:1,previous:{[S]:'old',[W]:'older'}})},{[J]:'', [C]:'yes'},{[C]:'yes'},{[J]:JSON.stringify({version:99})}]){
  const b=boot({...seed,...records});b.api.recoverPending();b.api.recoverPending();assert.equal(b.writes.length,0);assert.deepEqual(Object.fromEntries(b.map),{...seed,...records});const copy=b.api.makeBackup();assert(!Object.keys(copy.keys).some(k=>[J,C,TX].includes(k)));cases++;
 }
 const high=boot({...seed,[T]:JSON.stringify({level:49,unlocked:49,coins:800,points:1000,completed:[29,30,49]})});const highBackup=high.api.makeBackup();assert.equal(high.api.dryRun(highBackup).incomingWordTrails.level,50);cases++;
 const source=boot(seed),copy=source.api.makeBackup();assert.equal(source.api.dryRun(copy).canApply,true);
 const incoming=json(copy);delete incoming.integrity;incoming.keys[S]=JSON.stringify({genesis_ep12:{step:10,complete:true}});incoming.keys[W]=JSON.stringify({coins:12,points:-50,purchases:[],equippedWheel:'classic'});incoming.extensions.wordTrailsNext.state=JSON.stringify({level:22,unlocked:23,coins:99,points:90,completed:[0,1,2]});
 const b=boot(seed);await b.api.applyBackup(incoming,{reload:false});assert.equal(b.map.get(S),incoming.keys[S]);assert.equal(b.map.get(T),incoming.extensions.wordTrailsNext.state);assert.equal(JSON.parse(b.map.get(W)).coins,12);assert.equal(JSON.parse(b.map.get(W)).points,-50);assert(JSON.parse(b.map.get(W)).purchases.includes('seawheel'));assert.equal(b.map.get(W),b.map.get('bible-unfolded-rewards-v17-recovery-v3811'));assert(!b.map.has(TX));cases++;
 const repair=boot({...seed,[T]:'{damaged'});assert.equal(repair.api.dryRun(copy).canApply,true);await repair.api.applyBackup(copy,{reload:false});assert.equal(repair.map.get(T),seed[T]);cases++;
 const corrupt=json(copy);corrupt.keys[S]=incoming.keys[S];const untouched=boot(seed);await assert.rejects(untouched.api.applyBackup(corrupt),/checksum/);assert.equal(untouched.writes.length,0);cases++;
 const v1=boot(seed);await v1.api.applyBackup({format:'BibleUnfoldedSave',version:1,keys:{[S]:incoming.keys[S],[J]:'old'}},{reload:false});assert.equal(v1.map.get(T),seed[T]);cases++;
 for(const modify of [c=>c.version=77,c=>c.keys[S]='{bad',c=>c.keys[W]='{"coins":-5,"points":0}',c=>c.extensions.wordTrailsNext.state='{}',c=>c.keys[TX]='{}',c=>c.keys[S]='{"genesis_ep12":{"step":-1}}']){
  const bad=json(copy);delete bad.integrity;modify(bad);const t=boot(seed);await assert.rejects(t.api.applyBackup(bad,{reload:false}));assert.equal(t.writes.length,0);cases++;
 }
 // Inject a single write failure at every boundary (journal, each save, commit,
 // cleanup). Failed transactions recover the original values; committed cleanup
 // failures retain a transaction that startup only cleans, never rolls back.
 const count=b.writes.length;
 for(let fail=1;fail<=count;fail++){
  let tripped=false;const t=boot(seed,(n)=>{if(n===fail&&!tripped){tripped=true;throw Error('quota');}});
  try{await t.api.applyBackup(incoming,{reload:false});}catch(_){}
  const next=boot(Object.fromEntries(t.map));await new Promise(r=>setImmediate(r));
  const committed=JSON.parse(t.map.get(S))?.genesis_ep12.complete===true;
  assert.equal(next.map.get(S),committed?incoming.keys[S]:seed[S],'failure boundary '+fail);
  assert(!next.map.has(TX));cases++;
 }
 const entries=Object.keys(seed).map(key=>({key,before:seed[key],after:key===S?incoming.keys[S]:key===W?incoming.keys[W]:incoming.extensions.wordTrailsNext.state}));
 for(let applied=0;applied<=entries.length;applied++){
  const data={...seed,[TX]:JSON.stringify(seal({version:3,id:'crash',phase:'applying',entries}))};for(let i=0;i<applied;i++)data[entries[i].key]=entries[i].after;
  const t=boot(data);await new Promise(r=>setImmediate(r));for(const [k,v] of Object.entries(seed))assert.equal(t.map.get(k),v);const again=boot(Object.fromEntries(t.map));assert.equal(again.writes.length,0);cases++;
 }
 const conflict={...seed,[S]:'newer-independent-progress',[W]:incoming.keys[W],[TX]:JSON.stringify(seal({version:3,id:'conflict',phase:'applying',entries}))};
 const t=boot(conflict);await new Promise(r=>setImmediate(r));assert.equal(t.map.get(S),'newer-independent-progress');assert.equal(t.map.get(W),seed[W]);assert(t.map.has('bible-unfolded-restore-conflict-v3'));assert(!t.map.has(TX));cases++;
 for(const raw of ['{bad',JSON.stringify({version:3,id:'bad',phase:'applying',entries:[{key:J,before:null,after:'x'}]})]){const t=boot({...seed,[TX]:raw});await new Promise(r=>setImmediate(r));assert.equal(t.writes.length,0);assert.equal(t.api.startupRecovery.kind,'blocked');cases++;}
 const html=fs.readFileSync('index.html','utf8'),original=cp.execFileSync('git',['show','67a9020:index.html'],{encoding:'utf8',maxBuffer:40000000});
 const insertion=html.match(/\n<script id="bu-live-restore-safety-gate">[\s\S]*?<script src="bu-platform-saves-v2\.js\?v=live-reliable-restore-v3"><\/script>\n/)[0];const originalInsertion=original.match(/\n<script id="bu-live-restore-safety-gate">[\s\S]*?<script src="bu-platform-saves-v2\.js\?v=live-issue13-quarantine-v1"><\/script>\n/)[0];assert.equal(html.replace(insertion,''),original.replace(originalInsertion,''));
 let scripts=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/(?:json|ld\+json)/i.test(m[1]))continue;new vm.Script(m[2]);scripts++;}
 // Actual cached old writer exits behind the early sentinel.
 const old=cp.execFileSync('git',['show','1692945:bu-platform-saves-v2.js'],{encoding:'utf8'}),scope={window:{BUPlatformSaves:{pendingSafetyLoad:true}}};vm.createContext(scope);vm.runInContext(old,scope);
 const protectedFiles=cp.execFileSync('git',['ls-tree','-r','--name-only','67a9020'],{encoding:'utf8'}).trim().split('\n');
 for(const file of protectedFiles)if(!['index.html','bu-platform-saves-v2.js','.github/workflows/qa-issue13-save-safety.yml','docs/ISSUE13_SAVE_SAFETY.md','scripts/qa_issue13_safety.cjs','scripts/qa_issue13_browser.cjs'].includes(file))assert(fs.readFileSync(file).equals(cp.execFileSync('git',['show','67a9020:'+file],{maxBuffer:40000000})),file);
 console.log('PASS_RELIABLE_RESTORE_MODEL',cases,'cases; syntax',scripts,'inline scripts;',protectedFiles.length-6,'original files byte-identical');
})().catch(e=>{console.error(e);process.exit(1);});
