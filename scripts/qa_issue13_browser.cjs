'use strict';
// Disposable phone browsers validate the actual native Import/Export UI.
// All fixtures are synthetic; NO real user progress or external URL is read.
const p=require('puppeteer-core'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=process.env.SAFETY_URL||'http://127.0.0.1:8916/index.html';
const J='bible-unfolded-word-trails-import-rollback-v2';
const S='bible-unfolded-genesis-adventure-v3860',W='bible-unfolded-rewards-v17',T='bible-unfolded-word-trails-next-v1';
(async()=>{
 const browser=await p.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
 const evidence=[];
 try{
  for(const [width,height] of [[320,568],[430,932]]){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   const load=async()=>{
    await page.goto(root,{waitUntil:'load',timeout:120000});
    await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.()&&window.BUStoryGenesis12Test,
     {timeout:90000});
    await page.evaluate(()=>document.getElementById('daily-close')?.click());
   };
   await load();
   const initial=await page.evaluate(({S,W,T,J})=>{
    economy.coins=50;economy.points=10;economy.purchases=[...new Set([...economy.purchases,'seawheel'])];saveEconomy();
    const story=JSON.stringify({genesis_ep12:{step:2,complete:false}});
    const trail=JSON.stringify({level:2,unlocked:4,coins:60,points:5,completed:[0,1]});
    localStorage.setItem(S,story);localStorage.setItem(T,trail);
    // Old v1 rollback evidence must not contaminate exports or restore games.
    const legacy=JSON.stringify({version:1,previous:{[S]:'OLDER-STORY'}});
    localStorage.setItem(J,legacy);
    const original=JSON.parse(localStorage.getItem(W));
    const exported=BUPlatformSaves.makeBackup();
    return {story,trail,wallet:localStorage.getItem(W),original,exported,legacy};
   },{S,W,T,J});
   assert.equal(initial.exported.keys[S],initial.story);
   assert.equal(initial.exported.keys[J],undefined);
   const update=await page.evaluate(async({S,W,T,original,exported})=>{
    const newer={...exported,keys:{...exported.keys}};
    newer.keys[S]=JSON.stringify({genesis_ep12:{step:8,complete:false}});
    newer.keys[W]=JSON.stringify({...original,coins:245,points:55,purchases:[]});
    newer.extensions.wordTrailsNext.state=JSON.stringify({level:18,unlocked:23,coins:175,points:17,completed:[0,1,2]});
    const plan=BUPlatformSaves.dryRun(newer);
    const result=await BUPlatformSaves.applyBackup(newer,{reload:false});
    return {planCanApply:plan.canApply,result,
     story:localStorage.getItem(S),wallet:JSON.parse(localStorage.getItem(W)),
     trail:JSON.parse(localStorage.getItem(T)),legacy:localStorage.getItem('bible-unfolded-word-trails-import-rollback-v2'),
     pending:BUPlatformSaves.recoverPending().pending};
   },{S,W,T,original:initial.original,exported:initial.exported});
   assert(update.planCanApply&&update.result.ok);
   assert.equal(JSON.parse(update.story).genesis_ep12.step,8);
   assert.equal(update.wallet.coins,245);
   assert(update.wallet.purchases.includes('seawheel'),'Purchased wheel ownership was lost');
   assert.equal(update.trail.level,18);assert.equal(update.trail.coins,175);
   assert.equal(update.legacy,initial.legacy,'Old recovery evidence must remain untouched');
   assert.equal(update.pending,false);
   console.log('PASS_ISSUE13_BROWSER_REAL_V2_RESTORE',width);
   // UI Export button is handled by reviewed coordinator, not the old native one.
   const output=await page.evaluate(async({S,J})=>{
    const old=URL.createObjectURL,generated=[];
    URL.createObjectURL=blob=>{generated.push(blob);return old(blob)};
    try{
     document.getElementById('save-export').click();
     if(!generated.length)throw Error('Export button did not create a backup');
     const exported=JSON.parse(await generated.at(-1).text());
     return {version:exported.version,story:exported.keys[S],hasJournal:J in exported.keys,
      controlsReady:BUPlatformSaves.bound()};
    }finally{URL.createObjectURL=old}
   },{S,J});
   assert.equal(output.version,2);assert.equal(JSON.parse(output.story).genesis_ep12.step,8);
   assert.equal(output.hasJournal,false);assert.equal(output.controlsReady,true);
   console.log('PASS_ISSUE13_BROWSER_EXPORT_BUTTON',width);

   // User-provided older v1 file must be imported through safe coordinator,
   // even though PR15's old document capture gate remains to protect failures.
   // The successful UI import intentionally reloads the game. Listen for
   // that navigation instead of continuing inside its destroyed JS context.
   const reloading=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:90000});
   await page.evaluate(({S,W,T})=>{
    const old={format:'BibleUnfoldedSave',version:1,keys:{
      [S]:JSON.stringify({genesis_ep12:{step:6,complete:false}}),
      [W]:localStorage.getItem(W),
      [T]:JSON.stringify({level:10,unlocked:12,coins:88,points:4,completed:[0,1,2]}),
      'bible-unfolded-word-trails-import-rollback-v2':JSON.stringify({version:1,previous:{[S]:'BAD'}})
    }};
    const picker=document.getElementById('save-file'),file=new File([JSON.stringify(old)],'backup-v1.json',{type:'application/json'});
    const dt=new DataTransfer();dt.items.add(file);picker.files=dt.files;
    window.confirm=()=>{sessionStorage.setItem('qa-v1-import-confirmed','1');return true};
    picker.dispatchEvent(new Event('change',{bubbles:true}));
   },{S,W,T});
   await reloading;
   await page.waitForFunction(()=>window.BUPlatformSaves?.bound?.(),{timeout:90000});
   const ui=await page.evaluate(({S,T})=>({
    didRestore:JSON.parse(localStorage.getItem(S)||'{}').genesis_ep12?.step===6,
    confirmCount:sessionStorage.getItem('qa-v1-import-confirmed')==='1'?1:0,
    trail:JSON.parse(localStorage.getItem(T)||'null'),
    legacyStill:localStorage.getItem('bible-unfolded-word-trails-import-rollback-v2')
   }),{S,T});
   assert(ui.didRestore&&ui.confirmCount===1,'Old backup file must work through Import UI');
   assert.equal(ui.trail.level,10);
   assert.equal(ui.trail.coins,88);
   assert.equal(ui.legacyStill,initial.legacy,'Old unsafe rollback record must not be imported');
   console.log('PASS_ISSUE13_BROWSER_NATIVE_V1_IMPORT_UI',width);

   // Browser test of startup with old journal and newer Story; it never rewinds.
   const beforeReload=await page.evaluate(({S,W,T,J})=>({
    story:localStorage.getItem(S),wallet:localStorage.getItem(W),trail:localStorage.getItem(T),
    journal:localStorage.getItem(J)}),{S,W,T,J});
   // Simulate a reload directly to ensure the early safety gate remains active.
   // The restored game can reinitialize its own economy preferences; journal must
   // NEVER roll any of the three saved values back on load.
   await load();
   const afterReload=await page.evaluate(({S,W,T,J})=>({
    story:localStorage.getItem(S),wallet:localStorage.getItem(W),trail:localStorage.getItem(T),
    journal:localStorage.getItem(J),revision:BUPlatformSaves.safetyRevision,
    restoreDisabled:BUPlatformSaves.restoreDisabled}),{S,W,T,J});
   assert.equal(afterReload.story,beforeReload.story);
   assert.equal(afterReload.trail,beforeReload.trail);
   assert.equal(afterReload.journal,beforeReload.journal);
   assert.equal(afterReload.restoreDisabled,false);
   assert.equal(afterReload.revision,'issue13-transaction-v3');
   assert.deepEqual(errors,[]);
   console.log('PASS_ISSUE13_BROWSER_NO_STALE_REWIND_ON_RELOAD',width);
   evidence.push({width,validV1:true,validV2:true,walletPreserved:true,noLegacyRollback:true,
    nativeImportAndExport:true,realMobileChromium:true});
   await context.close();
  }
  console.log('PASS_ISSUE13_BROWSER_COMPLETE',JSON.stringify(evidence));
  if(process.env.SAFETY_EVIDENCE)fs.writeFileSync(process.env.SAFETY_EVIDENCE,JSON.stringify(evidence,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL_ISSUE13_BROWSER',e.stack||e);process.exitCode=1});
