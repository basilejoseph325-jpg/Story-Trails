#!/usr/bin/env node
'use strict';
/* Selective LIVE Genesis 12 release guard; synthetic browser profiles only. */
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const puppeteer=require('puppeteer-core');
const chrome=cp.execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const base=process.env.STORY_URL||'http://127.0.0.1:8893/index.html';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
 try{
  for(const [width,height] of [[320,568],[390,844]]){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width,height,isMobile:true,hasTouch:true});
   await page.goto(base,{waitUntil:'load',timeout:120000});
   await page.waitForFunction(()=>window.BUStoryGenesis12Test?.discoveryCount===13,{timeout:80000});
   const state=await page.evaluate(()=>{
    makeEpisodes();
    const cards=[...document.querySelectorAll('#episode-list [data-episode]')];
    const d11=BU3857_DATA.genesis_ep11,d12=BU3857_DATA.genesis_ep12;
    const wheel11=Object.keys(BU_HQ_WORDS).filter(k=>/^g11-d/.test(k));
    const wheel12=Object.keys(BU_HQ_WORDS).filter(k=>/^g12-d/.test(k));
    const card12=cards.find(c=>c.dataset.episode==='11');
    return {saveKey:BU_GENESIS_KEY,story:!!document.getElementById('play'),
     home:!!document.getElementById('home'),books:!!document.getElementById('home-books'),
     d11:d11?.discoveries?.length,d12:d12?.discoveries?.length,
     wheel11:wheel11.length,wheel12:wheel12.length,
     ids:[...BU_GENESIS_IDS],cards:cards.length,card12:!!card12,
     locked:card12&&!card12.classList.contains('available'),
     cardImage:card12?.querySelector('img')?.getAttribute('src'),
     loader:!!document.getElementById('bu-story-genesis12-live-loader'),
     testMarker:!!document.getElementById('visual-lab-test-banner')};
   });
   assert.equal(state.saveKey,'bible-unfolded-genesis-adventure-v3860','Existing save key changed');
   assert(state.story&&state.home&&state.books,'An established home/mode control disappeared');
   assert.equal(state.d11,10,'Genesis 11 content changed');
   assert.equal(state.d12,13,'Genesis 12 not installed');
   assert.equal(state.wheel11,10,'Genesis 11 wheel words changed');
   assert.equal(state.wheel12,13,'Genesis 12 wheel words missing');
   assert(state.ids.includes('genesis_ep12'),'Genesis 12 missing from native episode list');
   assert(state.card12&&state.cards>=12,'Genesis 12 card absent');
   assert(state.locked,'Fresh player must finish Episode 11 before Episode 12');
   assert(state.cardImage?.endsWith('story-adventure-art/genesis12/g12-d01.webp'),'Wrong Chapter 12 home artwork');
   assert(state.loader&&!state.testMarker,'LIVE script routing wrong or TEST banner leaked');
   for(let n=1;n<=13;n++){
    const name='g12-d'+String(n).padStart(2,'0')+'.webp';
    const response=await page.goto(new URL('story-adventure-art/genesis12/'+name,base).href,{waitUntil:'domcontentloaded',timeout:20000});
    // Chrome may return 304 for an image already loaded by the real
    // Story renderer. The dedicated wheel QA also checks decoded 640×360 pixels.
    assert([200,304].includes(response.status()),'Missing art '+name);
    if(response.status()===200)
     assert(/image\/webp/.test(response.headers()['content-type']||''),'Wrong image mime '+name);
   }
   assert.deepEqual(errors,[],'LIVE JavaScript errors');
   console.log('PASS_LIVE_G12_BOUNDARIES',JSON.stringify({width,height,scenes:13,images:13,preservedGenesis11:true,lockedUntil11:true}));
   await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL_LIVE_G12_BOUNDARIES',e.stack||e);process.exitCode=1});
