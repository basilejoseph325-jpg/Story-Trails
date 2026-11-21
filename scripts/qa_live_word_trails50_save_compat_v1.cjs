#!/usr/bin/env node
'use strict';
// Isolated real-browser check that replacing Word Trails 30 with 50 never
// silently imports TEST saves or loses existing LIVE levels, coins or rewards.
const p=require('puppeteer-core'),assert=require('node:assert/strict');
const {execSync}=require('node:child_process');
const chrome=process.env.CHROME_BIN||execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const URL=process.env.STORY_URL||'http://127.0.0.1:8899/index.html';
const LIVE='bible-unfolded-word-trails-next-v1',TEST='bu-visual-lab-wordtrails-next-v1';
(async()=>{
 const browser=await p.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
 try{
  const legacy={level:29,unlocked:29,coins:175,points:80,completed:Array.from({length:30},(_,i)=>i),sparks:[0,5,29],claimedSparks:['0:CAIN'],boardBible:[],paidWords:['0|ANTIC'],paidBonuses:[],claimedFreeHints:[1],sound:true,progress:null};
  const testSaved={level:12,unlocked:20,coins:999,completed:[0,1,2],progress:null};
  for(const [width,height,seed] of [[320,568,null],[430,932,legacy]]){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e.message)));
   await page.setViewport({width,height,isMobile:true,hasTouch:true,deviceScaleFactor:1});
   await page.evaluateOnNewDocument(({live,test})=>{
    try{
     if(localStorage.getItem('__live50_qa_seeded')==='1')return;
     localStorage.setItem('__live50_qa_seeded','1');
     localStorage.setItem('bu-visual-lab-wordtrails-next-v1',JSON.stringify(test));
     localStorage.setItem('qa-unrelated-preserve','keep');
     if(live)localStorage.setItem('bible-unfolded-word-trails-next-v1',JSON.stringify(live));
     else localStorage.removeItem('bible-unfolded-word-trails-next-v1');
    }catch(_){}
   },{live:seed,test:testSaved});
   await page.goto(URL,{waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.BUWTNativeShell?.nativeReady?.(),{timeout:90000});
   await page.evaluate(()=>document.getElementById('home-cross').click());
   // The HTML already contains a static LEVEL 1 / 55 label. Wait for the
   // actual engine to draw its wheel and persist its restored LIVE save.
   await page.waitForFunction(()=>{
    const child=document.getElementById('bu-wt-native-game')?.contentWindow;
    return !!(child?.BUWTPolish&&
     child.document.querySelectorAll('.wheel-letter').length>=4&&
     child.document.querySelector('#level-label')?.textContent.includes('/ 55')&&
     localStorage.getItem('bible-unfolded-word-trails-next-v1')!==null);
   },{timeout:90000});
   const state=await page.evaluate(()=>{
    const frame=document.getElementById('bu-wt-native-game').contentDocument;
    return {level:frame.querySelector('#level-label')?.textContent,
     live:JSON.parse(localStorage.getItem('bible-unfolded-word-trails-next-v1')||'null'),
     test:JSON.parse(localStorage.getItem('bu-visual-lab-wordtrails-next-v1')||'null'),
     unrelated:localStorage.getItem('qa-unrelated-preserve'),
     displayBalance:Number(frame.querySelector('#points')?.textContent),nativeCoins:economy.coins,platformCoins:BUPlatformRewards.wallet().coins,
     hasDaily:!!frame.querySelector('[data-wt-open-daily]')};
   });
   assert(state.hasDaily,'Daily must remain available');
   assert.equal(state.displayBalance,state.nativeCoins,'Word Trails must display native Insight Tokens');
   assert.equal(state.platformCoins,state.nativeCoins,'Rewards must use the same balance');
   assert.equal(state.unrelated,'keep','Unrelated data may not be changed');
   assert.deepEqual(state.test,testSaved,'TEST save must never be imported or rewritten');
   assert(state.live&&state.level.includes('/ 55'),'50-level LIVE engine must use original LIVE save');
   if(seed){
    assert(state.level.startsWith('LEVEL 30 / 55'),'A legacy 30-level player must resume original level');
    assert(state.live.unlocked>=30,'Completing legacy Level 30 must unlock Level 31');
    assert.equal(state.live.coins,175,'Existing Trail Coins cannot change on update');
    assert.equal(state.live.points,80,'Existing Word Trails points cannot change on update');
    assert.deepEqual(state.live.completed,seed.completed,'Completed levels must be unchanged');
    assert.deepEqual(state.live.sparks,seed.sparks,'Paid/claimed Bible discoveries preserved');
    assert.deepEqual(state.live.claimedFreeHints,seed.claimedFreeHints,'Hint receipts preserved');
   }else{
    assert(state.level.startsWith('LEVEL 1 / 55'),'Fresh LIVE install must begin at Level 1');
    assert.equal(state.live.coins,0,'Fresh Word Trails must not start a separate currency');
    assert.equal(state.nativeCoins,60,'Original native starting daily balance retained; TEST 999 must not transfer');
   }
   assert.deepEqual(errors,[],'Browser exceptions');
   console.log('PASS_WORD_TRAILS_LIVE_30_TO_50_SAVE',JSON.stringify({width,height,legacy:!!seed,level:state.level,coins:state.live.coins,unlocked:state.live.unlocked,testUntouched:true,unrelatedUntouched:true}));
   await context.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error('FAIL_WORD_TRAILS_LIVE_30_TO_50_SAVE',e.stack||e);process.exitCode=1});
