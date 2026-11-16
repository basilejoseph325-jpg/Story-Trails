'use strict';
// Fresh disposable profiles; no real player data or working restore is used.
const p=require('puppeteer-core'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=process.env.SAFETY_URL||'http://127.0.0.1:8916/index.html';
const J='bible-unfolded-word-trails-import-rollback-v2',C='bible-unfolded-word-trails-import-committed-v2',S='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1';
const scenarios=['stale-story','stale-wallet','interrupted-legacy','malformed','committed','orphan-marker'];
(async()=>{const b=await p.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});const evidence={viewports:[],physicalDevices:false,realPlayerData:false,restoreDisabled:true};try{
for(const [width,height] of [[320,568],[430,932]]){
 for(const scenario of scenarios){
  const context=await b.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width,height,isMobile:true,hasTouch:true});
  const load=async()=>{await page.goto(root,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>BUPlatformSaves?.bound?.()&&window.BUStoryGenesis12Test,{timeout:60000});await page.evaluate(()=>document.getElementById('daily-close')?.click());};
  await load();
  const expected=await page.evaluate(({scenario,J,C,S,W,T})=>{
   economy.points=scenario==='interrupted-legacy'?5:-20;economy.coins=scenario==='interrupted-legacy'?3:777;economy.purchases=[...new Set([...economy.purchases,'seawheel'])];economy.equippedWheel='seawheel';saveEconomy();
   const story=JSON.stringify({genesis_ep11:{complete:true,step:9},genesis_ep12:{step:8,complete:false,solved:{'g12-d01':true},hints:{'g12-d02':2},revealed:{},work:{}}});localStorage.setItem(S,story);
   const trail=JSON.stringify({level:20,unlocked:22,coins:230,points:50,completed:[0,1]});localStorage.setItem(T,trail);
   const journal=scenario==='malformed'?'{bad-json':scenario==='orphan-marker'?null:JSON.stringify({version:1,previous:{[S]:'OLD-STORY',[W]:JSON.stringify({coins:scenario==='interrupted-legacy'?777:3,points:scenario==='interrupted-legacy'?-20:5,purchases:['seawheel']}),[T]:'OLD-TRAILS'}});
   if(journal!==null)localStorage.setItem(J,journal);if(scenario==='committed'||scenario==='orphan-marker')localStorage.setItem(C,'yes');
   return {story,trail,journal,committed:localStorage.getItem(C),points:economy.points,coins:economy.coins};
  },{scenario,J,C,S,W,T});
  for(let i=0;i<2;i++){
   await load();const state=await page.evaluate(({J,C,S,T})=>({story:localStorage.getItem(S),trail:localStorage.getItem(T),journal:localStorage.getItem(J),committed:localStorage.getItem(C),points:economy.points,coins:economy.coins,purchases:economy.purchases,equipped:economy.equippedWheel,status:BUPlatformSaves.recoverPending()}),{J,C,S,T});
   for(const key of ['story','trail','journal','committed'])assert.equal(state[key],expected[key],scenario+' changed '+key);
   assert.equal(state.points,expected.points);assert.equal(state.coins,expected.coins);assert(state.purchases.includes('seawheel'));assert.equal(state.equipped,'seawheel');assert.equal(state.status.recovered,false);assert.equal(state.status.quarantined,true);
  }
  const ui=await page.evaluate(async({J,C,S,T})=>{
   openDialog('settings');document.getElementById('save-import').click();
   const snapshot=()=>({story:localStorage.getItem(S),trail:localStorage.getItem(T),journal:localStorage.getItem(J),marker:localStorage.getItem(C),wallet:localStorage.getItem(REWARD_KEY)}),before=snapshot();
   let fileReads=0,confirms=0;const oldRead=File.prototype.text,oldConfirm=window.confirm;File.prototype.text=async function(){fileReads++;throw Error('Reading an import is forbidden in this test');};window.confirm=()=>{confirms++;return true;};
   try{
    for(const version of [1,2]){
     const data=new DataTransfer();data.items.add(new File([JSON.stringify({format:'BibleUnfoldedSave',version,keys:{}})],'synthetic-v'+version+'.json',{type:'application/json'}));const picker=document.getElementById('save-file');picker.files=data.files;picker.dispatchEvent(new Event('change',{bubbles:true}));
     // Property callers are blocked too, not only DOM event dispatch.
     picker.onchange();
    }
    let blocked=false;try{BUPlatformSaves.applyBackup(BUPlatformSaves.makeBackup(),{reload:false})}catch(e){blocked=/paused/.test(e.message)}
    const copy=BUPlatformSaves.makeBackup(),oldURL=URL.createObjectURL;let downloaded;
    URL.createObjectURL=blob=>{downloaded=blob;return oldURL(blob)};
    document.getElementById('save-export').click();const exported=JSON.parse(await downloaded.text());
    document.getElementById('bu-live-copy-recovery').click();const record=JSON.parse(await downloaded.text());URL.createObjectURL=oldURL;
    return {before,after:snapshot(),blocked,fileReads,confirms,planCanApply:BUPlatformSaves.dryRun(copy).canApply,exportStory:exported.keys[S],exportHasJournal:J in exported.keys||C in exported.keys,record,open:document.getElementById('bu-live-restore-review').open,label:document.getElementById('save-import').getAttribute('aria-label'),reloadSuppressed:window.__bu388SkipCheckpoint===true};
   }finally{File.prototype.text=oldRead;window.confirm=oldConfirm;}
  },{J,C,S,T});
  assert.deepEqual(ui.after,ui.before);assert(ui.blocked);assert.equal(ui.fileReads,0);assert.equal(ui.confirms,0);assert.equal(ui.planCanApply,false);assert.equal(ui.exportStory,expected.story);assert.equal(ui.exportHasJournal,false);assert.equal(ui.record.journal,expected.journal);assert.equal(ui.record.committedMarker,expected.committed);assert(ui.open);assert.equal(ui.reloadSuppressed,false);
  await page.$eval('#bu-live-restore-review',e=>e.scrollIntoView({block:'center'}));const layout=await page.evaluate(()=>{const r=document.getElementById('bu-live-restore-review').getBoundingClientRect();return {left:r.left,right:r.right,overflow:document.documentElement.scrollWidth>innerWidth+1};});assert(layout.left>=-1&&layout.right<=width+1&&!layout.overflow);
  if(process.env.SAFETY_SHOTS&&scenario==='stale-story')await page.screenshot({path:'work/issue13-review-'+width+'.png'});
  await page.$eval('#settings-done',e=>e.scrollIntoView({block:'center'}));const done=await page.$eval('#settings-done',e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x+r.width/2,y:r.y+r.height/2,visible:r.top>=0&&r.bottom<=innerHeight&&!!hit&&(hit===e||e.contains(hit))};});assert(done.visible,'Native Done is inaccessible after review');await page.touchscreen.tap(done.x,done.y);assert(await page.$eval('#settings-dialog',e=>e.hidden));
  assert.deepEqual(errors,[]);await context.close();console.log('PASS_ISSUE13_BROWSER',width,scenario);
 }
 // A blocked coordinator load retains the early sentinel and disables old
 // native UI/property handlers without stopping ordinary Story gameplay.
 const context=await b.createBrowserContext(),page=await context.newPage();await page.setViewport({width,height,isMobile:true,hasTouch:true});await page.setRequestInterception(true);page.on('request',r=>r.url().includes('/bu-platform-saves-v2.js')?r.abort():r.continue());
 await page.goto(root,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>!!window.BUStoryGenesis12Test);
 const failure=await page.evaluate(()=>{document.getElementById('daily-close')?.click();openDialog('settings');document.getElementById('save-import').click();let exports=0;const savedURL=URL.createObjectURL;URL.createObjectURL=()=>{exports++;return 'blob:blocked-test'};document.getElementById('save-export').click();URL.createObjectURL=savedURL;let reads=0;const original=File.prototype.text;File.prototype.text=async()=>{reads++;throw Error('No import allowed')};document.getElementById('save-file').onchange();File.prototype.text=original;let blocked=false;try{BUPlatformSaves.applyBackup()}catch(_){blocked=true}closeDialog();completedChapters.genesis_ep11=true;bu3857Open('genesis_ep12');return {pending:BUPlatformSaves.pendingSafetyLoad,blocked,reads,exports,playable:bu3857Current().id==='g12-d01',notice:!!document.getElementById('bu-live-restore-paused')};});assert.deepEqual(failure,{pending:true,blocked:true,reads:0,exports:0,playable:true,notice:true});await context.close();
 evidence.viewports.push({width,height,scenarios:scenarios.length,reloadsEach:2,v1V2AndAPIBlocked:true,exportsPreserved:true,loadFailureClosed:true,ordinaryStoryPlayable:true});
}
console.log('PASS_ISSUE13_BROWSER_COMPLETE',JSON.stringify(evidence));if(process.env.SAFETY_EVIDENCE)fs.writeFileSync(process.env.SAFETY_EVIDENCE,JSON.stringify(evidence,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
