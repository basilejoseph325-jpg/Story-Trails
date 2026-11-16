'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const code=fs.readFileSync('bu-platform-saves-v2.js','utf8');
const J='bible-unfolded-word-trails-import-rollback-v2',C='bible-unfolded-word-trails-import-committed-v2';
const STORY='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1';
const current={[STORY]:JSON.stringify({genesis_ep12:{step:8,complete:false}}),[W]:JSON.stringify({coins:777,points:-20,purchases:['seawheel']}),[T]:JSON.stringify({level:20,unlocked:22,coins:230,points:50,completed:[0,1]})};
function boot(seed){
 const map=new Map(Object.entries(seed)),writes=[];
 const localStorage={get length(){return map.size},key:i=>[...map.keys()][i]??null,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>{writes.push(['set',k]);map.set(k,String(v))},removeItem:k=>{writes.push(['remove',k]);map.delete(k)}};
 const scope={window:{},localStorage,document:{readyState:'loading',addEventListener(){}},console,Date,setTimeout(){},Blob,URL};vm.createContext(scope);vm.runInContext(code,scope);return {api:scope.window.BUPlatformSaves,map,writes};
}
const scenarios=[
 ['none',{}],
 ['stale-story',{[J]:JSON.stringify({version:1,previous:{[STORY]:'old-story'}})}],
 ['stale-wallet',{[J]:JSON.stringify({version:1,previous:{[W]:JSON.stringify({coins:3,points:5,purchases:[]})}})}],
 ['true-interrupted-legacy',{[J]:JSON.stringify({version:1,previous:{[STORY]:'before',[W]:'before-wallet'}})}],
 ['malformed',{[J]:'{not-json'}],['empty-record',{[J]:''}],
 ['committed',{[J]:JSON.stringify({version:1,previous:{[W]:'old'}}),[C]:'yes'}],
 ['orphan-marker',{[C]:'yes'}],
 ['future-format',{[J]:JSON.stringify({version:2,entries:[{key:W,before:'old',after:'imported'}]})}]
];
for(const [name,records] of scenarios){
 const seed={...current,...records},b=boot(seed);assert.equal(b.api.restoreDisabled,true);assert.equal(b.api.recoverPending().recovered,false);
 for(let i=0;i<3;i++){b.api.recoverPending();assert.throws(()=>b.api.applyBackup({format:'BibleUnfoldedSave',version:i%2+1}),/restores are paused/);}
 assert.deepEqual(Object.fromEntries(b.map),seed,name+' changed saved data');assert.deepEqual(b.writes,[],name+' wrote during startup/recovery/API');
 const copy=b.api.makeBackup();assert.equal(copy.keys[STORY],current[STORY]);assert.equal(copy.keys[J],undefined);assert.equal(copy.keys[C],undefined);assert.deepEqual(b.writes,[],'Export read wrote data');
 const plan=b.api.dryRun(copy);assert.equal(plan.canApply,false);assert.equal(plan.restoreDisabled,true);assert.deepEqual(b.writes,[]);
 const again=boot(Object.fromEntries(b.map));assert.deepEqual(Object.fromEntries(again.map),seed);assert.deepEqual(again.writes,[]);
 console.log('PASS_ISSUE13_NO_WRITE',name);
}
// Fail closed if the new coordinator cannot load: an old cached coordinator
// sees the sentinel and returns before its dangerous recoverPending call.
const html=fs.readFileSync('index.html','utf8');const gate=html.match(/<script id="bu-live-restore-safety-gate">([\s\S]*?)<\/script>/)[1];
const map=new Map(Object.entries({...current,[J]:JSON.stringify({version:1,previous:{[W]:'OLD'}})})),writes=[];
const scope={window:{},document:{addEventListener(){}},localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>{writes.push(k);map.set(k,v)},removeItem:k=>writes.push(k)},console,Date,setTimeout(){}};vm.createContext(scope);vm.runInContext(gate,scope);const old=cp.execFileSync('git',['show','1692945:bu-platform-saves-v2.js'],{encoding:'utf8'});vm.runInContext(old,scope);assert.deepEqual(writes,[]);assert.equal(scope.window.BUPlatformSaves.pendingSafetyLoad,true);assert.throws(()=>scope.window.BUPlatformSaves.applyBackup(),/paused/);
const original=cp.execFileSync('git',['show','1692945:index.html'],{encoding:'utf8',maxBuffer:40000000});// Exact check uses the tagged block, not whitespace assumptions.
const insertion=html.match(/\n<script id="bu-live-restore-safety-gate">[\s\S]*?<script src="bu-platform-saves-v2\.js\?v=live-issue13-quarantine-v1"><\/script>\n/)[0];assert.equal(html.replace(insertion,''),original,'Unrelated HTML changed');
const allowed=new Set(['bu-platform-saves-v2.js','index.html','scripts/qa_issue13_safety.cjs','scripts/qa_issue13_browser.cjs','.github/workflows/qa-issue13-save-safety.yml','docs/ISSUE13_SAVE_SAFETY.md']);
for(const f of cp.execFileSync('git',['diff','--name-only','1692945'],{encoding:'utf8'}).trim().split('\n').filter(Boolean))assert(allowed.has(f),'Unrelated issue13 file '+f);
const baselineFiles=cp.execFileSync('git',['ls-tree','-r','--name-only','1692945'],{encoding:'utf8'}).trim().split('\n');
for(const file of baselineFiles)if(!['index.html','bu-platform-saves-v2.js'].includes(file))assert(fs.readFileSync(file).equals(cp.execFileSync('git',['show','1692945:'+file],{maxBuffer:40000000})),'Protected original file changed: '+file);
for(const file of cp.execFileSync('git',['ls-files','--others','--exclude-standard','--','.',':!work'],{encoding:'utf8'}).trim().split('\n').filter(Boolean))assert(allowed.has(file),'Unapproved safety file '+file);
let count=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/(?:json|ld\+json)/i.test(m[1]))continue;new vm.Script(m[2]);count++;}
console.log('PASS_ISSUE13_ORIGINAL_FILES_UNCHANGED',baselineFiles.length-2,'inlineSyntax',count);
console.log('PASS_ISSUE13_FAIL_CLOSED_CACHED_COORDINATOR_AND_SCOPE');
