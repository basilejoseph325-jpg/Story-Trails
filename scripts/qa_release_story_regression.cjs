#!/usr/bin/env node
'use strict';
// Selective LIVE candidate: both original Story engines, all old/new discoveries.
// Local synthetic profiles only. DOM player controls exercise both original engines;
// real CDP touch input is checked separately. This is not physical-device acceptance.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const puppeteer=require('puppeteer-core');
const {execSync}=require('node:child_process');
const chrome=execSync('command -v chromium || command -v google-chrome',{encoding:'utf8'}).trim();
const base=process.env.STORY_URL||'http://127.0.0.1:8913/index.html';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
 const evidence={viewports:[],errors:[]};
 const artBaseline={};
 const hash=s=>require('node:crypto').createHash('sha256').update(s||'').digest('hex');
 try{
 const before=await browser.newPage();await before.goto(process.env.LIVE_BASELINE_URL||'http://127.0.0.1:8890/index.html',{waitUntil:'load',timeout:120000});await before.waitForFunction(()=>!!window.BUStoryGenesis12Test);
 const oldIds=await before.evaluate(()=>[...BU_GENESIS_IDS,...BU3857_IDS]);
 for(const id of oldIds){
  await before.evaluate(id=>{document.getElementById('daily-close')?.click();completedChapters.genesis_ep11=true;bu3857Open(id,true);bu3857State.complete=true;bu3857Render()},id);await before.waitForSelector('.bu-story-finale-actions');
  const scene=await before.evaluate(()=>({hero:document.querySelector('.bu-story-finale-cinematic-photo')?.getAttribute('src')||'',bg:document.querySelector('.bu-story-finale-atmosphere-art')?.style.backgroundImage||'',caption:document.querySelector('.bu-story-finale-scene-label')?.textContent||''}));artBaseline[id]={hero:hash(scene.hero),bg:hash(scene.bg),caption:scene.caption,present:!!scene.hero};
 }
 await before.close();console.log('BASELINE_OLD_FINALE_ART',JSON.stringify(Object.fromEntries(Object.entries(artBaseline).map(([k,v])=>[k,{present:v.present,caption:v.caption}]))));
 for(const [width,height] of [[320,568],[430,932]]){
  const context=await browser.createBrowserContext(),page=await context.newPage();
  page.on('pageerror',e=>evidence.errors.push(e.message));
  await page.setViewport({width,height,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await page.goto(base,{waitUntil:'load',timeout:120000});
  await page.waitForFunction(()=>typeof bu3857Open==='function'&&typeof bu3864AskHint==='function'&&window.BUStoryGenesis13Test?.status==='ready'&&window.BUStoryGenesis14Test?.status==='ready');
  const row={width,height,modern:0,legacy:0,finales:0,hints:[],overflow:[],pendingArt:[]};
  // Ledger snapshots make replay checks independent of daily welcome rewards.
  const ledger=()=>page.evaluate(()=>({points:economy.points,coins:economy.coins}));
  const close=()=>page.evaluate(()=>{for(const id of ['bu3864-modal-layer','bu3863-dialog-layer','bu3898-scripture-layer']){const e=document.getElementById(id);if(e?.buClose)e.buClose();else e?.querySelector('.bu3864-modal-close,.bu3863-close,.bu3898-close')?.click();}});
  const open=async id=>{await close();await page.evaluate(id=>{if(id.startsWith('genesis_ep')||id.startsWith('exodus-'))bu3857Open(id,true);else startChapter(id,false,true);},id);await pause(70);};
  const buy=()=>page.evaluate(()=>{const b=document.querySelector('#bu3864-modal-layer .bu3864-modal-body .gold-button');assertButton(b);b.click();function assertButton(b){if(!b||b.hidden)throw Error('No offered purchase');}});
  // Check every later-engine discovery through its real rendered controls.
  const modern=await page.evaluate(()=>[...BU_GENESIS_IDS,...BU3857_IDS]);
  for(const id of modern){
   await open(id);console.log('PLAY_CHAPTER',id);
   const chapterScenes=await page.evaluate(id=>BU3857_DATA[id]?.discoveries?.length||0,id);
   assert(Number.isInteger(chapterScenes)&&chapterScenes>=1,'Missing chapter discovery records '+id);
   for(let n=0;n<chapterScenes;n++){
    await close();
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const problem=await page.evaluate(()=>{
     const root=document.getElementById('bu3857-content'),d=bu3857Current();
     const image=root.querySelector('figure img');
     const pending=(bu3857State.book==='genesis_ep13'&&!window.BUStoryGenesis13Test.artwork[d.id].available)||(bu3857State.book==='genesis_ep14'&&!window.BUStoryGenesis14Test.artwork[d.id].available);
     if(pending){if(image||!root.querySelector('[data-bu-genesis13-scene],[data-bu-genesis14-scene]')?.textContent.includes('illustration pending'))throw Error('Unlabelled or substituted pending art '+d.id);}
     else if(!image)throw Error('No scene art '+d.id);
     const viewport={w:innerWidth,h:innerHeight};
     const out=[...root.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.right>viewport.w+2||r.bottom>viewport.h+2||r.left< -2)}).map(e=>e.id||e.dataset.id||e.textContent);
     // An incomplete/wrong answer must never solve or reward a discovery.
     const points=economy.points,coins=economy.coins;
     const wrong=root.querySelector('#bu3857-check');if(wrong)wrong.click();
     if(bu3857State.solved[d.id]||economy.points!==points||economy.coins!==coins)throw Error('Incorrect check rewarded '+d.id);
     document.getElementById('bu3863-dialog-layer')?.buClose?.();
     const click=(a,id)=>{const b=root.querySelector('[data-action="'+a+'"][data-id="'+id+'"]');if(!b)throw Error('Missing '+a+' '+id+' '+d.id);b.click();};
     const word=BU_HQ_WORDS[d.id];
     if(word){const letters=[...root.querySelectorAll('[data-buhq]')],used=new Set();for(const c of word.answer){const b=letters.find(b=>b.textContent===c&&!used.has(b));if(!b)throw Error('Missing letter '+d.id);used.add(b);b.click();}}
     else{const {type:t,solution:s}=d.interaction;
      if(t==='order_cards')for(const x of s.order)click('order',x);
      else if(t==='route_trace')for(const x of s.path.slice(1))click('route',x);
      else if(t==='find_hotspots'||t==='doorframe_trace')for(const x of s.targetIds||s.markedIds)click('toggle',x);
      else for(const [k,v] of Object.entries(s.pairs?Object.fromEntries(s.pairs):s.assignments||s.placements||s.directionsByStage||s.filterByScene)){click('choose',k);click('assign',v);}
      document.getElementById('bu3857-check').click();
     }
     return {id:d.id,out,pendingArtwork:pending};
    });
    if(problem.pendingArtwork)row.pendingArt.push(problem.id);
    row.overflow.push(...problem.out.map(control=>({id:problem.id,control})));
    await page.waitForFunction(()=>!!bu3857State.solved[bu3857Current().id]);
    await close();await page.$eval('#bu3857-continue',b=>b.click());row.modern++;
   }
   await page.waitForSelector('.bu-story-finale-actions');
   assert.equal(await page.$$eval('.bu-story-finale-actions button',a=>a.length),2);
   if(id==='genesis_ep13'||id==='genesis_ep14'){
    const ep=id==='genesis_ep13'?13:14,ending=ep===13?'g13-d09':'g14-d12';
    assert.equal(await page.$eval('.bu-story-finale-cinematic-photo',e=>e.getAttribute('src')),'story-adventure-art/genesis'+ep+'/'+ending+'.webp');
    assert((await page.$eval('.bu-story-finale-atmosphere-art',e=>e.style.backgroundImage)).includes(ending+'.webp'));
   }else{
    const scene=await page.evaluate(()=>({hero:document.querySelector('.bu-story-finale-cinematic-photo')?.getAttribute('src')||'',bg:document.querySelector('.bu-story-finale-atmosphere-art')?.style.backgroundImage||'',caption:document.querySelector('.bu-story-finale-scene-label')?.textContent||''}));
    assert.deepEqual({hero:hash(scene.hero),bg:hash(scene.bg),caption:scene.caption,present:!!scene.hero},artBaseline[id],'Old ending artwork changed '+id);
   }
   row.finales++;
   const before=await ledger();
   await page.$eval('#bu3857-replay',b=>b.click());
   await page.evaluate(()=>{const root=document.getElementById('bu3857-content'),d=bu3857Current();if(BU_HQ_WORDS[d.id]){const letters=[...root.querySelectorAll('[data-buhq]')],used=new Set();for(const c of BU_HQ_WORDS[d.id].answer){const b=letters.find(b=>b.textContent===c&&!used.has(b));used.add(b);b.click();}}});
   if(id.startsWith('genesis'))assert.deepEqual(await ledger(),before,'Replay farmed rewards '+id);
  }
  // Original nine chapters: use pointer events on visible letter controls.
  for(const id of ['genesis','eden','cain','noah','babel','abraham','moses','moses_midian','moses_bush']){
   await open(id);console.log('PLAY_LEGACY',id);
   const total=await page.evaluate(()=>BEATS.length);
   for(let n=0;n<total;n++){
    await close();
    await page.evaluate(()=>{const used=new Set(),tiles=[...document.querySelectorAll('#wheel .tile')];for(const c of BEATS[stage].word){const tile=tiles.find(b=>b.textContent===c&&!used.has(b));if(!tile)throw Error('Missing early letter');used.add(tile);tile.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:0,clientY:0}));tile.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}));}});
    await page.waitForFunction(()=>mode==='reveal');
    await page.waitForSelector('#bu3864-next-legacy');
    await close();await page.$eval('#bu3864-next-legacy',b=>b.click());row.legacy++;
   }
   assert.equal(await page.evaluate(()=>mode),'done');row.finales++;
  }
  assert.equal(row.modern,117);assert.equal(row.legacy,84);assert.equal(row.finales,20);
  assert.deepEqual(row.overflow,[],'Active controls clipped');assert.deepEqual(row.pendingArt,[]);
  evidence.viewports.push(row);console.log('PASS_RELEASE_ALL_STORY_PLAYABLE',JSON.stringify(row));await context.close();
 }
 assert.deepEqual(evidence.errors,[]);if(process.env.STORY_EVIDENCE)fs.writeFileSync(process.env.STORY_EVIDENCE,JSON.stringify(evidence,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
