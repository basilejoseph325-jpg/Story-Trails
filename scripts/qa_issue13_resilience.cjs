'use strict';
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const root=process.env.SAFETY_URL||'http://127.0.0.1:8920/index.html',S='bible-unfolded-genesis-adventure-v3860';
(async()=>{
for(const engine of (process.env.RESTORE_ENGINES||'chromium,webkit').split(',')){
 const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const load=async page=>{await page.goto(root,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.(),{timeout:60000});};
 const context=await browser.newContext({viewport:{width:430,height:932},isMobile:true,hasTouch:true}),page=await context.newPage();await load(page);
 // A second updated game tab must reload stale memory after a completed import.
 const other=await context.newPage();await load(other);
 const candidate=await page.evaluate(()=>{const c=BUPlatformSaves.makeBackup();delete c.integrity;const key='bible-unfolded-rewards-v17';c.keys[key]=JSON.stringify({...JSON.parse(c.keys[key]),coins:321,points:-42});return c;});
 const nav1=page.waitForNavigation({waitUntil:'load',timeout:120000}),nav2=other.waitForNavigation({waitUntil:'load',timeout:120000});
 await page.evaluate(c=>BUPlatformSaves.applyBackup(c),candidate).catch(e=>{if(!/context was destroyed|navigation/i.test(e.message))throw e;});await Promise.all([nav1,nav2]);
 await Promise.all([page.waitForFunction(()=>window.BUPlatformSaves?.bound?.()),other.waitForFunction(()=>window.BUPlatformSaves?.bound?.())]);
 assert.equal(await page.evaluate(()=>economy.coins),321);assert.equal(await other.evaluate(()=>economy.coins),321);
 // Freeze the old source document AND its same-origin child when reload is
 // suppressed for this test. Their stale unload writers cannot undo a restore.
 await page.evaluate(()=>{document.getElementById('daily-close')?.click();focusHome();document.getElementById('home-cross').click();});
 await page.waitForFunction(()=>window.BUWTNativeShell?.active?.());
 const frozen=await page.evaluate(async()=>{
  const frame=[...document.querySelectorAll('iframe')].find(f=>{try{return f.contentWindow.localStorage===f.contentWindow.localStorage;}catch(_){return false;}});
  const c=BUPlatformSaves.makeBackup();delete c.integrity;const key='bible-unfolded-rewards-v17';c.keys[key]=JSON.stringify({...JSON.parse(c.keys[key]),coins:222});await BUPlatformSaves.applyBackup(c,{reload:false});
  let parentBlocked=false,childBlocked=!frame;try{localStorage.setItem(key,'stale-parent')}catch(_){parentBlocked=true;}
  if(frame)try{frame.contentWindow.localStorage.setItem(key,'stale-child')}catch(_){childBlocked=true;}
  return {parentBlocked,childBlocked,coins:JSON.parse(localStorage.getItem(key)).coins,hadFrame:!!frame};
 });assert(frozen.parentBlocked&&frozen.childBlocked);assert(frozen.hadFrame);assert.equal(frozen.coins,222);await context.close();
 // A silent storage write failure must be reported, not treated as saved.
 const fault=await browser.newContext();await fault.addInitScript(({S})=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===S&&window.__testDropSave)return;return write.call(this,k,v);};},{S});
 const faulty=await fault.newPage();await load(faulty);
 const health=await faulty.evaluate(S=>{window.__testDropSave=true;let thrown=false;try{localStorage.setItem(S,'{"test":{}}')}catch(_){thrown=true;}return {thrown,message:document.getElementById('bu-save-health')?.textContent};},S);assert(health.thrown&&health.message.includes('could not be saved'));await fault.close();
 // Failed safety script: early sentinel blocks native import paths, including
 // direct old handler calls. No accidental v1 restore may run behind it.
 const unavailable=await browser.newContext();await unavailable.route('**/bu-platform-saves-v2.js*',route=>route.abort());const missing=await unavailable.newPage();
 await missing.goto(root,{waitUntil:'load',timeout:120000});await missing.waitForFunction(()=>window.BUStoryGenesis12Test,{timeout:60000});
 const blocked=await missing.evaluate(()=>{let reads=0,confirms=0;File.prototype.text=async()=>{reads++;return '{}';};window.confirm=()=>{confirms++;return true;};const picker=document.getElementById('save-file');picker.onchange();document.getElementById('save-import').click();return {reads,confirms,pending:BUPlatformSaves.pendingSafetyLoad};});assert.equal(blocked.reads,0);assert.equal(blocked.confirms,0);assert(blocked.pending);await unavailable.close();
 console.log('PASS_RESTORE_RESILIENCE',engine,'cross-tab reload; parent/Word Trails iframe stale-write freeze; silent-save failure alert; unavailable-module fail closed');
 }finally{await browser.close();}
}
})().catch(e=>{console.error(e);process.exit(1);});
