'use strict';
// Disposable mobile browser profiles. Chromium Android/iPhone-sized WebKit
// automation is not physical Android Chrome or iPhone Safari acceptance.
const {chromium,webkit}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const url=process.env.SAFETY_URL||'http://127.0.0.1:8920/index.html';
const S='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1',J='bible-unfolded-word-trails-import-rollback-v2';
(async()=>{
const evidence={physicalDevices:false,cases:[]};
for(const engine of (process.env.RESTORE_ENGINES||'chromium,webkit').split(',')){
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{for(const [width,height] of [[320,568],[430,932]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const load=async()=>{await page.goto(url,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.()&&window.BUStoryGenesis12Test,{timeout:60000});await page.evaluate(()=>document.getElementById('daily-close')?.click());};
 await load();
 const backup=await page.evaluate(({S,T,J})=>{
  economy.points=-20;economy.coins=777;economy.purchases=['seawheel'];economy.equippedWheel='seawheel';if(!saveEconomy())throw Error('Native wallet save failed');
  localStorage.setItem(S,JSON.stringify({genesis_ep11:{complete:true,step:9},genesis_ep12:{step:3,complete:false,solved:{'g12-d01':true},hints:{'g12-d02':2},revealed:{},work:{}}}));
  localStorage.setItem(T,JSON.stringify({level:20,unlocked:22,coins:230,points:50,completed:[0,1]}));
  localStorage.setItem(J,JSON.stringify({version:1,previous:{[S]:'OLD',[T]:'OLD'}}));
  return BUPlatformSaves.makeBackup();
 },{S,T,J});
 await load();
 assert.equal(await page.evaluate(()=>economy.coins),777);
 const before=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 // Reject malformed file through the real Settings file handler, no writes/confirm.
 await page.evaluate(()=>{openDialog('settings');window.confirm=()=>{throw Error('Invalid backups must not ask to restore');};});
 await page.locator('#save-file').setInputFiles({name:'damaged.json',mimeType:'application/json',buffer:Buffer.from('{damaged')});
 await page.waitForFunction(()=>document.getElementById('bu-wt-save-status')?.textContent.includes('Restore failed'));
 assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage))),before);
 // Export from the actual native Settings control and read its downloaded Blob.
 const exported=await page.evaluate(async()=>{
  let blob;const create=URL.createObjectURL;URL.createObjectURL=b=>{blob=b;return create(b);};document.getElementById('save-export').click();URL.createObjectURL=create;return JSON.parse(await blob.text());
 });assert.equal(exported.keys[S],backup.keys[S]);assert(!Object.keys(exported.keys).includes(J));
 // Change all three saved systems, then restore the downloaded backup using
 // the actual file input. Completion must reload into restored in-memory data.
 await page.evaluate(({S,T})=>{economy.coins=12;economy.points=99;saveEconomy();localStorage.setItem(S,'{}');localStorage.setItem(T,JSON.stringify({level:0,unlocked:0,coins:0,points:0,completed:[]}));window.confirm=()=>true;},{S,T});
 const navigation=page.waitForNavigation({waitUntil:'load',timeout:120000});
 await page.locator('#save-file').setInputFiles({name:'valid-v2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});await navigation;
 await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.());
 const restored=await page.evaluate(({S,T,J})=>({coins:economy.coins,points:economy.points,purchases:economy.purchases,story:localStorage.getItem(S),trail:localStorage.getItem(T),journal:localStorage.getItem(J),revision:BUPlatformSaves.safetyRevision}),{S,T,J});
 assert.equal(restored.coins,777);assert.equal(restored.points,-20);assert(restored.purchases.includes('seawheel'));assert.equal(restored.story,backup.keys[S]);assert.equal(restored.trail,backup.extensions.wordTrailsNext.state);assert(restored.journal.includes('OLD'));assert.equal(restored.revision,'reliable-restore-v3');
 // Native v1 files restore matching native saves without erasing Trail Coins.
 await page.evaluate(()=>{openDialog('settings');window.confirm=()=>true;});
 const v1={format:'BibleUnfoldedSave',version:1,keys:{[W]:JSON.stringify({...JSON.parse(backup.keys[W]),coins:55,points:-5,purchases:[],equippedWheel:'classic'})}};
 const nav=page.waitForNavigation({waitUntil:'load',timeout:120000});await page.locator('#save-file').setInputFiles({name:'old-v1.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(v1))});await nav;
 await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.());assert.equal(await page.evaluate(()=>economy.coins),55);assert.equal(await page.evaluate(T=>localStorage.getItem(T),T),backup.extensions.wordTrailsNext.state);
 // Recovery from a genuinely interrupted new transaction happens before a
 // playable old-memory page can overwrite it. Repeated refresh is idempotent.
 await page.evaluate(({S})=>{const before=localStorage.getItem(S),after=JSON.stringify({genesis_ep12:{step:1,complete:false}});localStorage.setItem(S,after);const t={version:3,id:'browser-interruption',phase:'applying',entries:[{key:S,before,after}]};let hash=2166136261;const raw=JSON.stringify([t.version,t.id,t.phase,t.createdAt,t.entries]);for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619);t.checksum=(hash>>>0).toString(16).padStart(8,'0');localStorage.setItem(BUPlatformSaves.keys.TRANSACTION,JSON.stringify(t));},{S});
 await load();await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.()&&!localStorage.getItem(BUPlatformSaves.keys.TRANSACTION));
 assert.equal(await page.evaluate(S=>localStorage.getItem(S),S),backup.keys[S]);await load();assert.equal(await page.evaluate(()=>economy.coins),55);
 await page.evaluate(()=>openDialog('settings'));
 const layout=await page.evaluate(()=>{const e=document.getElementById('bu-live-restore-review');e.open=true;e.scrollIntoView();const r=e.getBoundingClientRect();return {left:r.left,right:r.right,overflow:document.documentElement.scrollWidth>innerWidth+1};});assert(layout.left>=-1&&layout.right<=width+1&&!layout.overflow);
 // Native modal selector differs by build: use actual native close function.
 await page.evaluate(()=>closeDialog('settings'));
 assert.deepEqual(errors,[],engine+' unexpected page errors');
 evidence.cases.push({engine,width,height,exportRoundTrip:true,v1Restore:true,damagedRejected:true,interruptionRecovery:true,pageErrors:errors});
 console.log('PASS_RESTORE_BROWSER',engine,width,'v2 export/file restore, v1, invalid file, legacy quarantine, interruption/reload, wallet/Story/Trail persistence, Settings layout');
 await context.close();
 }}finally{await browser.close();}
}
fs.mkdirSync('work',{recursive:true});fs.writeFileSync(process.env.SAFETY_EVIDENCE||'work/reliable-restore-browser.json',JSON.stringify(evidence,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
