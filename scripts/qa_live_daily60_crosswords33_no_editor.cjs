#!/usr/bin/env node
'use strict';
/* Prelaunch LIVE release-candidate browser smoke. No real player or stored
 * progress is touched. This reads the staged branch via localhost only.
 */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const {execSync}=require('node:child_process');
const chrome=execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const root='http://127.0.0.1:8899/index.html';
const entry='family-worship-menu-art/v1/';
for(const asset of ['topic-26-paul-timothy.webp','topic-38-jesus-ministry.webp'])
 assert(fs.existsSync(entry+asset),'New Daily content art must exist: '+asset);
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('<script id="bu-daily-live-early-gate-v1">'),'Early HTML gate must be installed');
assert(html.indexOf('bu-daily-live-early-gate-v1')<html.indexOf('<style>'),'Gate before old handlers');
const reader=fs.readFileSync('daily-discovery-illustrated-v1.js','utf8');
assert(reader.includes('const editorialQA=()=>false'),'LIVE editor must remain disabled');
assert(reader.includes('x.dailyBatch===2?x.art:null'),'Thematic art must render for new 30');
assert(!html.includes('bu-visual-lab-test-banner'),'Never ship TEST banner to LIVE');
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:chrome,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
  protocolTimeout:120000});
 try{
  for(const width of [390,832]){
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height:width===390?705:384,deviceScaleFactor:2,isMobile:true,hasTouch:true});
   await page.goto(root,{waitUntil:'domcontentloaded',timeout:110000});
   await page.waitForFunction(()=>window.BUDailyInsightV1?.libraryCount?.()===60,{timeout:70000});
   await page.waitForFunction(()=>window.BUCrosswordExpanded33?.packCount?.()===33,{timeout:70000});
   const info=await page.evaluate(()=>{
    const list=window.BUDailyDiscoveryLibrary;
    const packs=TRAIL_PACKS;
    return {
     count:list.length,unique:new Set(list.map(x=>x.id)).size,
     oldIDs:list.slice(0,30).map(x=>x.id),
     newCount:list.slice(30).length,
     validSources:list.every(x=>x.url.startsWith('https://www.jw.org/en/')&&
       x.share.url.startsWith('https://www.jw.org/en/')),
     clearMercy:list.find(x=>x.id==='stephen-mercy')?.share.question,
     missingNewImages:list.slice(30).filter(x=>!x.art).map(x=>x.id),
     packCount:packs.length,
     newBoardNames:packs.slice(24).map(p=>p.bank),
     earlyGate:window.BUDailyLiveEarlyGateV1?.installed===true,
     oldWordTrails:!!document.querySelector('#home #home-cross'),
     newCrosswords:!!document.getElementById('home-crossword-packs')
    };
   });
   assert.equal(info.count,60);
   assert.equal(info.unique,60);
   assert.equal(info.newCount,30);
   assert(info.validSources);
   assert.equal(info.missingNewImages.length,0);
   assert.equal(info.clearMercy,'Why is it sometimes easier to get angry than to show mercy?');
   assert.equal(info.packCount,33);
   assert.equal(info.newBoardNames.length,9);
   assert(info.earlyGate&&info.oldWordTrails&&info.newCrosswords,'Shared navigation remains playable');
   await page.evaluate(()=>{
    document.getElementById('daily-continue')?.click();
    document.getElementById('bu375-home-cta').click();
   });
   await page.waitForFunction(()=>window.BUDailyInsightV1?.inspect()?.open===true,{timeout:15000});
   const daily=await page.evaluate(()=>({
    book:document.querySelector('#bu375-body.bu-daily-book-preview .bu-insight-story')!==null,
    editor:document.querySelectorAll('[data-insight-book-select]').length,
    oldQuiz:document.getElementById('bu375-body')?.textContent?.includes('Today’s Bible Challenge'),
    savedCount:window.BUDailyInsightV1.inspect().saved.length,
    appStore:window.BUDailyInsightV1.storageKey
   }));
   assert(daily.book,'New illustrated Daily reading screen must open');
   assert.equal(daily.editor,0,'No 60-chapter dropdown in LIVE');
   assert.equal(daily.oldQuiz,false,'Old five-question selector must never display');
   assert.equal(daily.appStore,'bu-daily-insight-live-v1','Do not change saved-data key');
   await page.evaluate(()=>document.getElementById('bu375-back')?.click());
   await page.waitForFunction(()=>document.getElementById('home-crossword-packs')?.getClientRects().length>0,{timeout:15000});
   await page.evaluate(()=>document.getElementById('home-crossword-packs').click());
   await page.waitForFunction(()=>!document.getElementById('cross-pick')?.hidden,{timeout:14000});
   const catalog=await page.evaluate(()=>{
    const buttons=[...document.querySelectorAll('#cross-pack-list button[data-pack]')];
    return {total:buttons.length,
      old:buttons.filter(x=>Number(x.dataset.pack)<24).length,
      new:buttons.filter(x=>Number(x.dataset.pack)>=24).length,
      visible:buttons.filter(x=>Number(x.dataset.pack)>=24&&!x.hidden).length
    };
   });
   assert.deepEqual(catalog,{total:33,old:24,new:9,visible:9},
    'LIVE new Crosswords route must preserve original 24 and expose nine more');
   await page.evaluate(()=>document.querySelector('#cross-pack-list button[data-pack="24"]').click());
   await page.waitForFunction(()=>!document.getElementById('crossword-screen')?.hidden,{timeout:12000});
   const board=await page.evaluate(()=>({
    wheel:!!document.getElementById('xword-wheel'),
    filled:!!document.getElementById('xword-content')?.textContent?.length,
    legacyLivesKey:localStorage.getItem('bible-unfolded-word-trails-next-v1')
   }));
   assert(board.wheel&&board.filled,'New Scripture crossword must open native wheel');
   assert.deepEqual(errors,[],'No JS runtime exceptions');
   console.log('PASS_LIVE_CANDIDATE_'+width,JSON.stringify({
    daily60:true,old30Preserved:true,noEditor:true,fastGate:true,
    newCrosswords9:true,nativeBoard:true,noJSExceptions:true
   }));
   await page.close();
  }
  // Crucial regression from owner: even with the entire late loader missing,
  // the first tap cannot get through to the old 5-question daily game.
  const early=await browser.newPage(),earlyErrors=[];
  early.on('pageerror',e=>earlyErrors.push(e.message));
  await early.setViewport({width:390,height:705,isMobile:true,hasTouch:true});
  await early.setRequestInterception(true);
  let blocked=false;
  early.on('request',req=>{
   if(req.url().includes('/journey-progress-caption.js')){
    blocked=true;return req.abort().catch(()=>{});
   }
   req.continue().catch(()=>{});
  });
  await early.goto(root,{waitUntil:'domcontentloaded',timeout:110000});
  await early.evaluate(()=>document.getElementById('daily-continue')?.click());
  await early.waitForSelector('#bu375-home-cta',{timeout:20000});
  assert.equal(await early.evaluate(()=>window.BUDailyLiveEarlyGateV1?.installed),true);
  await early.evaluate(()=>{const c=document.getElementById('bu375-home-cta');c.click();c.click();});
  const held=await early.evaluate(()=>({
   queued:window.BUDailyLiveEarlyGateV1?.queued(),
   busy:document.getElementById('bu375-home-cta')?.getAttribute('aria-busy'),
   legacyHidden:document.getElementById('bu375-daily')?.hidden,
   modernLoaded:!!window.BUDailyInsightV1
  }));
  assert(blocked,'QA must truly block the legacy-external loader');
  assert(held.queued&&held.busy==='true'&&held.legacyHidden&&held.modernLoaded===false,
   'HTML head gate blocks legacy mode before any dynamic Daily code');
  assert.deepEqual(earlyErrors,[],'No early head parse/runtime errors');
  console.log('PASS_LIVE_CANDIDATE_FIRST_TAP_BEFORE_JS',JSON.stringify(held));
  await early.close();
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL_LIVE_CANDIDATE',e.stack||e);process.exitCode=1});
