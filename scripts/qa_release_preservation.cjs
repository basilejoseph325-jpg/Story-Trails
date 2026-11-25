#!/usr/bin/env node
'use strict';
// Read-only backup/API inspection: no import/restore API is called and no
// recovery journal is seeded. Gameplay uses fresh synthetic profiles only.
const p=require('puppeteer-core'),assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.STORY_URL||'http://127.0.0.1:8913/index.html',baseline=process.env.LIVE_BASELINE_URL||'http://127.0.0.1:8890/index.html';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const browser=await p.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});const evidence={physicalDevices:false,importsOrRestoresPerformed:false,profiles:[]};try{
 const snapshots=[];
 for(const candidate of [false,true]){
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:430,height:932,isMobile:true,hasTouch:true});
  await page.goto(candidate?root:baseline,{waitUntil:'load',timeout:120000});await page.waitForFunction(candidate?()=>window.BUStoryGenesis14Test?.status==='ready':()=>!!window.BUStoryGenesis12Test,{timeout:60000});
  const seed=await page.evaluate(()=>{
   document.getElementById('daily-close')?.click();
   completedChapters.genesis_ep10=true;completedChapters.genesis_ep11=true;persistUnified();
   const old={step:4,complete:false,solved:{'g12-d01':true},revealed:{},hints:{'g12-d01':2},work:{'g12-d05':{}}};
   const all=JSON.parse(localStorage.getItem(BU_GENESIS_KEY)||'{}');all.genesis_ep12=old;all.future_entry={marker:'must-survive'};localStorage.setItem(BU_GENESIS_KEY,JSON.stringify(all));bu3857Saved.genesis_ep12=old;
   localStorage.setItem('release-unrelated-fixture','unchanged');
   economy.points=-250;economy.coins=443;economy.purchases=[...new Set([...(economy.purchases||[]),'seawheel'])];economy.equippedWheel='seawheel';saveEconomy();updateWallet();
   return old;
  });
  await page.evaluate(()=>bu3857Open('genesis_ep12'));assert.equal(await page.evaluate(()=>bu3857State.step),4);await page.evaluate(()=>bu3857Save());
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem(BU_GENESIS_KEY)));assert.deepEqual(stored.genesis_ep12,seed);
  if(candidate){
   assert.deepEqual(stored.future_entry,{marker:'must-survive'});
   // A native completed Episode 12 checkpoint must lead to Episode 13 through
   // its actual button. All-puzzle completion is tested separately.
   await page.evaluate(()=>{bu3857Saved.genesis_ep12={...bu3857Saved.genesis_ep12,complete:true,step:12};completedChapters.genesis_ep12=true;bu3857Open('genesis_ep12')});
   await page.$eval('#bu3857-next-episode',b=>b.click());assert.equal(await page.evaluate(()=>bu3857State.book),'genesis_ep13');assert.equal(await page.evaluate(()=>bu3857Current().id),'g13-d01');
   await page.evaluate(()=>{document.getElementById('bu3857-hint').click();focusHome()});assert.equal(await page.$('[data-bu-story-release-owned]'),null,'Leaving Story kept a blocking modal');
   // New checkpoints must survive a save made while playing the previous chapter.
   await page.evaluate(()=>{bu3857Open('genesis_ep13');bu3857State.step=3;bu3857Save();bu3857Open('genesis_ep12',true);bu3857Save()});
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(BU_GENESIS_KEY)).genesis_ep13.step),3);
   await page.reload({waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.BUStoryGenesis14Test?.status==='ready');assert(await page.$eval('#home',e=>!e.hidden));
   await page.evaluate(()=>bu3857Open('genesis_ep13'));assert.equal(await page.evaluate(()=>bu3857State.step),3);
   const backup=await page.evaluate(()=>{const snap=()=>Object.fromEntries(Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).map(k=>[k,localStorage.getItem(k)]));const before=snap(),copy=BUPlatformSaves.makeBackup();return {before,after:snap(),chapter:JSON.parse(copy.keys[BU_GENESIS_KEY]).genesis_ep13.step,recovery:!!copy.keys[BU_GENESIS_KEY+'-recovery-v1']};});
   assert.deepEqual(backup.after,backup.before,'Reading a backup changed storage');assert.equal(backup.chapter,3);assert(backup.recovery);

  }
  const modes={};
  for(const id of ['home-trivia','home-family','home-cross','home-builder','home-watch','home-shop','home-help']){
   await page.evaluate(id=>{window.BUWTNativeShell?.close?.();closeDialog();closeMenu();focusHome();document.getElementById('daily-close')?.click();document.getElementById(id).click()},id);
   if(id==='home-cross')await page.waitForFunction(()=>window.BUWTNativeShell?.active?.(),{timeout:30000});else await pause(160);
   modes[id]=await page.evaluate(()=>({active:[...document.querySelectorAll('.screen,.wb36-screen')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').map(e=>e.id),wordTrails:!!window.BUWTNativeShell?.active?.(),help:!document.getElementById('help-dialog')?.hidden}));
   if(id==='home-trivia')assert(await page.evaluate(()=>{const f=BUStage16TriviaLifecycle;f.getStart()('quick','all');const quiz=f.getQuiz(),q=quiz.items[quiz.step];document.querySelector('#bu34-trivia [data-answer="'+((q.correct+1)%q.choices.length)+'"]').click();const retry=!quiz.answered;document.querySelector('#bu34-trivia [data-answer="'+q.correct+'"]').click();return retry&&quiz.answered;}));
   if(id==='home-family'){
    await page.evaluate(()=>{if(bu35Game)bu35Game.complete=true;bu35Open('setup');bu35Setup.people=['Review One','Review Two'];bu35Setup.quick='trivia';bu35Setup.topic='genesis';bu35Setup.minutes=20;bu35Setup.order='classic';bu35Setup.difficulty='beginner';bu35Begin()});await page.waitForSelector('#bu35-ready');await page.$eval('#bu35-ready',b=>b.click());await page.evaluate(()=>{const q=bu35Question();document.querySelector('#bu35-body [data-answer="'+q.correct+'"]').click()});assert(await page.evaluate(()=>bu35Game.answered));await page.evaluate(()=>{document.getElementById('bu67-modal')?.close();bu35Game.complete=true;});
   }
  }
  const snapshot=await page.evaluate(()=>{window.BUWTNativeShell?.close?.();closeDialog();closeMenu();focusHome();return {unrelated:localStorage.getItem('release-unrelated-fixture'),audio:['setting-music','setting-sfx','setting-volume','setting-sfx-volume'].map(id=>{const e=document.getElementById(id);return {id,type:e.type,value:e.value,checked:e.checked}}),announcer:typeof bu381Play,backup:{version:BUPlatformSaves.version,methods:Object.keys(BUPlatformSaves).sort(),bound:BUPlatformSaves.bound(),source:document.getElementById('bu-platform-save-core-v2')?.getAttribute('src')},wallet:{points:economy.points,coins:economy.coins,purchases:economy.purchases,equipped:economy.equippedWheel},testBanner:!!document.querySelector('script[src*="visual-lab-test-banner"]')};});
  // Gameplay above can earn its normal rewards; compare settings/ownership,
  // and ensure negative points and the original wallet remain native.
  assert.equal(snapshot.unrelated,'unchanged');assert.equal(snapshot.announcer,'function');assert(!snapshot.testBanner);assert(snapshot.wallet.purchases.includes('seawheel'));assert.equal(snapshot.wallet.equipped,'seawheel');assert(snapshot.wallet.points<0);
  const comparable={modes,audio:snapshot.audio,announcer:snapshot.announcer,backup:snapshot.backup,testBanner:snapshot.testBanner,equipped:snapshot.wallet.equipped};snapshots.push(comparable);assert.deepEqual(errors,[]);evidence.profiles.push({candidate,...snapshot,modes});await context.close();
 }
 assert.deepEqual(snapshots[1],snapshots[0],'Unrelated mode/audio/backup Settings changed');
 // Synthetic checkpoint-read fixtures; no import/restore APIs or journals.
 for(const scenario of ['delayed-registration','corrupt-primary-read']){
  const context=await browser.createBrowserContext(),page=await context.newPage();
  const saved={genesis_ep11:{step:2,complete:true,solved:{},hints:{},revealed:{},work:{}},genesis_ep12:{step:4,complete:true,solved:{},hints:{},revealed:{},work:{}},genesis_ep13:{step:3,complete:true,solved:{},hints:{},revealed:{},work:{}},genesis_ep14:{step:7,complete:false,solved:{},hints:{},revealed:{},work:{}}};
  await page.evaluateOnNewDocument(({scenario,saved})=>{const raw=JSON.stringify(saved),key='bible-unfolded-genesis-adventure-v3860';localStorage.setItem(key,scenario==='corrupt-primary-read'?'synthetic-invalid-json':raw);localStorage.setItem(key+'-recovery-v1',raw);},{scenario,saved});
  if(scenario==='delayed-registration'){
   await page.setRequestInterception(true);page.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/story-adventure-episode14-release.js'))setTimeout(()=>r.continue(),1800);else r.continue();});
  }
  await page.goto(root,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.BUStoryGenesis13Test?.status==='ready',{timeout:60000});
  await page.evaluate(()=>{document.getElementById('daily-close')?.click();bu3857Open('genesis_ep12');bu3857Save()});
  assert.equal(await page.evaluate(()=>bu3857State.step),4);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(BU_GENESIS_KEY)).genesis_ep14.step),7);
  await page.waitForFunction(()=>window.BUStoryGenesis14Test?.status==='ready',{timeout:60000});await page.evaluate(()=>bu3857Open('genesis_ep14'));assert.equal(await page.evaluate(()=>bu3857State.step),7);
  await context.close();console.log('PASS_RELEASE_CHECKPOINT_READ_FIXTURE',scenario);
 }

 // A revealed answer must remain reward-reserved if only the chapter
 // checkpoint fails. All data is synthetic; this is not backup restoration.
 for(const ep of [13,14]){
  const context=await browser.createBrowserContext(),page=await context.newPage();page.on('dialog',d=>d.accept());
  await page.goto(root,{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.BUStoryGenesis14Test?.status==='ready',{timeout:60000});
  await page.evaluate(ep=>{document.getElementById('daily-close')?.click();completedChapters.genesis_ep12=true;completedChapters.genesis_ep13=true;persistUnified();bu3857Open('genesis_ep'+ep);economy.points=100;economy.coins=200;saveEconomy();window.originalReleaseStorage=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===BU_GENESIS_KEY)throw Error('Synthetic lost reveal checkpoint');return window.originalReleaseStorage.call(this,k,v)};document.getElementById('bu3857-reveal').click()},ep);
  assert.deepEqual(await page.evaluate(()=>({points:economy.points,coins:economy.coins})),{points:75,coins:200});
  // Keep the old window's write failure through unload; the new document gets
  // its normal Storage prototype and reads the durable native wallet receipt.
  await page.reload({waitUntil:'load',timeout:120000});await page.waitForFunction(()=>window.BUStoryGenesis14Test?.status==='ready',{timeout:60000});await page.evaluate(ep=>bu3857Open('genesis_ep'+ep),ep);
  assert.equal(await page.evaluate(()=>!!bu3857State.solved[bu3857Current().id]),false);
  await page.evaluate(()=>{const used=new Set(),tiles=[...document.querySelectorAll('#buhq-wheel [data-buhq]')];for(const c of BU_HQ_WORDS[bu3857Current().id].answer){const b=tiles.find(b=>b.textContent===c&&!used.has(b));used.add(b);b.click();}});
  assert(await page.evaluate(()=>!!bu3857State.solved[bu3857Current().id]));assert.deepEqual(await page.evaluate(()=>({points:economy.points,coins:economy.coins})),{points:75,coins:200});
  await context.close();console.log('PASS_RELEASE_REVEAL_CHECKPOINT_NO_REWARD',ep);
 }
 console.log('PASS_RELEASE_MODE_AUDIO_SETTINGS_AND_SAVE_PRESERVATION',JSON.stringify(evidence));if(process.env.STORY_EVIDENCE)fs.writeFileSync(process.env.STORY_EVIDENCE,JSON.stringify(evidence,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
