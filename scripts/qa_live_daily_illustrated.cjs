/* Release-candidate browser QA for owner-approved illustrated Daily Discovery.
 * Entire original LIVE homepage is loaded. No remote writes, TEST wallet changes,
 * experimental menus, or arbitrary navigation through unreleased future lessons. */
'use strict';
const assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const {execSync}=require('node:child_process');
const exe=execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const root='http://127.0.0.1:8897/';
const KEY='bu-daily-insight-live-v1';
(async()=>{
 let browser;
 try{
  browser=await puppeteer.launch({headless:true,executablePath:exe,
   args:['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required'],
   protocolTimeout:120000});
  for(const size of [{width:320,height:568},{width:390,height:705},{width:832,height:384}]){
   const context=await browser.createBrowserContext(),page=await context.newPage();
   page.setDefaultTimeout(60000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({...size,isMobile:true,hasTouch:true,deviceScaleFactor:2});
   await page.goto(root+'index.html?daily_preview=peter&daily_qa=1&daily_book=0',
       {waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.BUDailyInsightV1?.libraryCount?.()===30,{timeout:120000});
   const before=await page.evaluate(()=>{
    localStorage.setItem('bu-daily-insight-test-v1',JSON.stringify({v:1,saved:['peter'],read:['2026-11-10'],shared:[]}));
    const legacy=Object.fromEntries(Object.keys(localStorage).filter(k=>/^(bible-unfolded|story-trails)-/i.test(k))
       .map(k=>[k,localStorage.getItem(k)]));
    return {legacy,test:localStorage.getItem('bu-daily-insight-test-v1'),
      insight:window.BUDailyInsightV1.storageKey,hasMenu:!!document.getElementById('game-menu'),
      hasCross:!!document.getElementById('home-cross'),
      source:window.BUDailyInsightV1.source};
   });
   assert(before.hasMenu&&before.hasCross,'Original Bible Unfolded menu and crosswords must remain');
   assert.equal(before.insight,KEY,'Isolated LIVE save key; never adopt shared TEST progress');
   await page.evaluate(()=>{document.getElementById('daily-continue')?.click();
      document.querySelector('#bu375-home-cta').click()});
   await page.waitForSelector('#bu375-body.bu-daily-book-preview .bu-insight-story',{timeout:25000});
   const info=await page.evaluate(()=>({
    id:window.BUDailyInsightV1.inspect().id,
    first:window.BUDailyDiscoveryLibrary[0].id,
    item:window.BUDailyDiscoveryLibrary.find(x=>x.id===window.BUDailyInsightV1.inspect().id),
    book:document.querySelector('#bu375-body').classList.contains('bu-daily-book-preview'),
    photo:document.querySelector('.bu-insight-cover')?.style.backgroundImage,
    photoWidth:document.querySelector('.bu-insight-cover')?.getBoundingClientRect().width,
    photoHeight:document.querySelector('.bu-insight-cover')?.getBoundingClientRect().height,
    star:getComputedStyle(document.querySelector('.bu-insight-cover'),'::after').content,
    onPhotoText:document.querySelector('.bu-insight-cover')?.children.length,
    title:document.querySelector('.bu-book-title-band h2')?.textContent,
    picker:document.querySelectorAll('[data-insight-book-select], [data-insight-preview]').length,
    savedRows:document.querySelectorAll('[data-insight-open]').length,
    source:document.querySelector('a.bu-insight-source')?.href,
    textColor:getComputedStyle(document.querySelector('.bu-insight-story p')).color,
    bleed:(()=>{const r=document.querySelector('.bu-insight-wrap').getBoundingClientRect();return {left:r.left,right:r.right}})(),
    testText:document.querySelector('#bu375-body').innerText.includes('TEST version')
   }));
   assert(info.item&&info.book&&info.photo,'Illustrated scheduled daily thought is shown');
   assert.equal(info.id,info.item.id);
   assert(info.photo.includes('assets/daily-book/')||info.photo.includes('family-worship-menu-art/'),'Approved curated art shown');
   assert(info.photoWidth>280&&info.photoHeight>145,'Illustration visible in phone');
   assert.equal(info.star,'none','No gold star may cover the illustration');
   assert.equal(info.onPhotoText,0,'No copy/labels placed over illustration');
   assert.equal(info.title,info.item.title,'Title is on the parchment under its own art');
   assert.equal(info.picker,0,'Never offer future lesson browse to LIVE visitors');
   assert.equal(info.textColor,'rgb(54, 45, 35)','Parchment must have readable dark writing');
   assert(info.source?.startsWith('https://www.jw.org/en/'),'Official source only');
   assert(info.bleed.left>=-2&&info.bleed.right<=size.width+2,'No horizontal overflow');
   assert(!info.testText,'No TEST-version footer');
   const img=await page.evaluate(src=>new Promise(resolve=>{
     const probe=new Image();probe.onload=()=>resolve({ok:true,w:probe.naturalWidth,h:probe.naturalHeight});
     probe.onerror=()=>resolve({ok:false});probe.src=src;
   }),info.photo.match(/url\(["']?([^"')]+)["']?\)/)?.[1]);
   assert(img.ok&&img.w>=600&&img.h>=300,'Exact original illustration must load');
   console.log('LIVE_DAILY_ART',JSON.stringify({size,id:info.id,title:info.title,img,picker:info.picker}));
   if(size.width===390){
    await page.screenshot({path:'/tmp/LIVE-DAILY-READING-390.png'});
    await page.evaluate(()=>document.querySelector('[data-insight-action=save]').click());
    const saved=await page.evaluate(()=>window.BUDailyInsightV1.inspect().saved);
    assert(saved.includes(info.id),'Save to LIVE collection');
    await page.evaluate(()=>document.querySelector('[data-insight-tab=saved]').click());
    const shelf=await page.evaluate(()=>({
      count:document.querySelectorAll('[data-insight-open]').length,
      first:document.querySelector('[data-insight-open]')?.dataset.insightOpen,
      thumb:document.querySelector('[data-insight-image]')?.getAttribute('src')
    }));
    assert.equal(shelf.count,1);
    assert.equal(shelf.first,info.id);
    assert(shelf.thumb?.endsWith('.webp'));
    await page.evaluate(()=>document.querySelector('[data-insight-open]').click());
    assert.equal(await page.evaluate(()=>window.BUDailyInsightV1.inspect().id),info.id);
    await page.evaluate(()=>document.querySelector('[data-insight-tab=share]').click());
    assert(await page.evaluate(()=>!!document.querySelector('[data-insight-action=copy]')));
    await page.screenshot({path:'/tmp/LIVE-DAILY-SHARE-390.png'});
    await page.evaluate(()=>document.querySelector('#bu375-back').click());
    assert(!await page.evaluate(()=>window.BUDailyInsightV1.inspect().open),'Back closes LIVE reader');
    await page.reload({waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>window.BUDailyInsightV1?.libraryCount?.()===30,{timeout:120000});
    assert((await page.evaluate(()=>window.BUDailyInsightV1.inspect().saved)).includes(info.id),
      'Saved discoveries persist across reload');
   }
   const after=await page.evaluate(()=>({
     legacy:Object.fromEntries(Object.keys(localStorage).filter(k=>/^(bible-unfolded|story-trails)-/i.test(k))
       .map(k=>[k,localStorage.getItem(k)])),
     test:localStorage.getItem('bu-daily-insight-test-v1'),
     live:localStorage.getItem(KEY)
   }));
   assert.equal(after.test,before.test,'Existing TEST data must be untouched');
   // Native game initialization can create live keys; pre-existing values may not be changed.
   for(const [k,v] of Object.entries(before.legacy))
     assert.equal(after.legacy[k],v,'Legacy game save/wallet changed: '+k);
   console.log('LIVE_DAILY_SAVE_ISOLATION',JSON.stringify({size,legacyKeysPreserved:Object.keys(before.legacy).length,liveSaved:!!after.live}));
   await context.close();
  }
  console.log('PASS: LIVE illustrated Daily, 30 lessons, artwork, no advance selector, no quiz/wallet rewrites, Saved, Share, back, phone/landscape');
 }catch(e){console.error('LIVE_DAILY_QA_FAIL',e.stack||e);process.exitCode=1}
 finally{await browser?.close()}
})();
