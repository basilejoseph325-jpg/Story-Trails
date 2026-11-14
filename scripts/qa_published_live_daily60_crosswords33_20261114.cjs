#!/usr/bin/env node
'use strict';
/* Read-only synthetic browser at ACTUAL public GitHub Pages LIVE URL.
 * Never reads a real player's localStorage, wallet, saves, or private settings.
 */
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const {execSync}=require('node:child_process');
const chrome=execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const URL='https://basilejoseph325-jpg.github.io/Story-Trails/?public-check=20261114-d60-c33';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
 try{
  for(const width of [390,832]){
   const page=await browser.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height:width===390?705:384,deviceScaleFactor:2,isMobile:true,hasTouch:true});
   const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:110000});
   assert.equal(response?.status(),200,'Published LIVE URL must load');
   await page.waitForFunction(()=>window.BUDailyInsightV1?.libraryCount?.()===60 &&
      window.BUCrosswordExpanded33?.packCount?.()===33 &&
      window.BUDailyLiveEarlyGateV1?.installed===true,{timeout:100000});
   const base=await page.evaluate(()=>({
    total:window.BUDailyDiscoveryLibrary.length,
    mercy:window.BUDailyDiscoveryLibrary.find(x=>x.id==='stephen-mercy')?.share.question,
    originalGame:typeof TRAIL_PACKS!=='undefined'&&TRAIL_PACKS.length===33,
    originalWordTrailsCard:!!document.getElementById('home-cross'),
    newCrosswordsCard:!!document.getElementById('home-crossword-packs'),
    testMarker:!!document.getElementById('bu-visual-lab-test-banner'),
    htmlGate:!!document.getElementById('bu-daily-live-early-gate-v1'),
    codeVersions:[...document.scripts].map(s=>s.src).filter(s=>s.includes('journey-progress-caption.js')),
    sourceName:document.title
   }));
   assert.equal(base.total,60);
   assert.equal(base.mercy,'Why is it sometimes easier to get angry than to show mercy?');
   assert(base.originalGame&&base.originalWordTrailsCard&&base.newCrosswordsCard);
   assert(base.htmlGate&&!base.testMarker);
   assert(base.codeVersions[0]?.includes('live-daily60-cross33-20261114-v1'));
   await page.evaluate(()=>{document.getElementById('daily-continue')?.click();document.getElementById('bu375-home-cta').click();});
   await page.waitForFunction(()=>window.BUDailyInsightV1?.inspect()?.open===true,{timeout:20000});
   const today=await page.evaluate(()=>({
    book:!!document.querySelector('#bu375-body.bu-daily-book-preview .bu-insight-story'),
    previewControl:document.querySelectorAll('[data-insight-book-select]').length,
    storageKey:window.BUDailyInsightV1.storageKey
   }));
   assert(today.book&&today.previewControl===0&&today.storageKey==='bu-daily-insight-live-v1',
    'No TEST picker or changed LIVE save keys');
   await page.evaluate(()=>document.getElementById('bu375-back')?.click());
   await page.waitForFunction(()=>document.getElementById('home-crossword-packs')?.getClientRects().length>0,{timeout:15000});
   await page.evaluate(()=>document.getElementById('home-crossword-packs').click());
   await page.waitForFunction(()=>!document.getElementById('cross-pick')?.hidden,{timeout:15000});
   const cards=await page.evaluate(()=>({
    count:document.querySelectorAll('#cross-pack-list button[data-pack]').length,
    newVisible:[...document.querySelectorAll('#cross-pack-list button[data-pack]')].filter(el=>Number(el.dataset.pack)>=24&&!el.hidden).length
   }));
   assert.deepEqual(cards,{count:33,newVisible:9},'Published board catalog must show all nine additions');
   assert.deepEqual(errors,[],'Published LIVE should not emit JS exceptions');
   console.log('PASS_PUBLISHED_LIVE_DAILY60_CROSS33_'+width,JSON.stringify({base,today,cards,noErrors:true}));
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL_PUBLISHED_LIVE_DAILY60_CROSS33',e.stack||e);process.exitCode=1});
