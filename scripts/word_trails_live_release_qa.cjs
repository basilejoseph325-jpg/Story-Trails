/* LIVE release candidate QA — original Bible Unfolded root + staged Word Trails.
   Must run before main ref promotion. Uses isolated CI browser localStorage only. */
const puppeteer=require('puppeteer-core'),assert=require('node:assert/strict');
const {execSync}=require('node:child_process');
const executablePath=execSync('command -v google-chrome || command -v chromium',{encoding:'utf8'}).trim();
const ROOT='http://127.0.0.1:8912/index.html',TEST='bu-visual-lab-wordtrails-next-v1';
const LIVE='bible-unfolded-word-trails-next-v1',WALLET='bible-unfolded-rewards-v17';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath,args:['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  for(const size of [{width:390,height:705},{width:832,height:384}]){
   const page=await browser.newPage();page.setDefaultTimeout(60000);
   const errors=[],notFound=[];page.on('pageerror',x=>errors.push(x.message.slice(0,180)));
   page.on('response',r=>{if(r.status()===404)notFound.push(new URL(r.url()).pathname)});
   await page.setViewport({...size,deviceScaleFactor:2,isMobile:true,hasTouch:true});
   await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.BUWTNativeShell?.nativeReady?.()&&window.BUPlatformSaves?.bound?.(),{timeout:90000});
   const native=await page.evaluate(()=>({
    mainMenu:!!document.getElementById('game-menu'),nativeSettings:!!document.getElementById('settings-dialog'),
    story:!!document.getElementById('home-story'),trivia:!!document.getElementById('home-trivia'),
    homeCard:!!document.getElementById('home-cross'),testRibbon:!!document.getElementById('bu-visual-lab-test-banner'),
    saves:window.BUPlatformSaves?.version,
    rewards:!!window.BUPlatformRewards?.hasNativeHost?.()
   }));
   console.log('LIVE_ROOT_'+size.width,JSON.stringify(native));
   assert(native.mainMenu&&native.nativeSettings&&native.story&&native.trivia&&native.homeCard&&native.rewards);
   assert(!native.testRibbon,'Never copy TEST banner to LIVE');
   assert.equal(native.saves,'2.0.0-test'); // Coordinator API version, not banner text.
   const today=new Date().toISOString().slice(0,10);
   const planted=await page.evaluate(({TEST,LIVE,WALLET,today})=>{
    const w={points:300,coins:244,purchases:['seawheel'],earned:[],spent:[],
      hints:{},streak:1,lastDay:today,rank:1,equippedWheel:'seawheel'};
    localStorage.setItem(WALLET,JSON.stringify(w));
    localStorage.setItem('bible-unfolded-rewards-v17-recovery-v3811',JSON.stringify(w));
    localStorage.setItem('bible-unfolded-wheel-ownership-v3825',JSON.stringify({version:1,owned:['seawheel']}));
    localStorage.setItem(TEST,JSON.stringify({
      level:2,unlocked:2,coins:98765,points:10000,completed:[0,1],sparks:[0],
      claimedSparks:['0:CAIN'],boardBible:[],paidWords:['0|ANTIC','1|RIDE'],
      paidBonuses:['1|RED'],claimedFreeHints:[],sound:true,
      progress:{level:2,found:['RAVE'],bonuses:[],hinted:[],combo:1}
    }));
    localStorage.removeItem(LIVE);
    return {wallet:localStorage.getItem(WALLET),test:localStorage.getItem(TEST)};
   },{TEST,LIVE,WALLET,today});
   await page.evaluate(()=>document.getElementById('home-cross').click());
   await page.waitForFunction(()=>window.BUWTNativeShell?.active?.() &&
     document.getElementById('bu-wt-native-game')?.contentWindow?.document?.getElementById('solved-count')?.textContent==='1 / 4',{timeout:60000});
   const migration=await page.evaluate(({TEST,LIVE,WALLET})=>{
    const root=window.BUWTNativeShell,frame=document.getElementById('bu-wt-native-game');
    const f=frame.contentWindow.document,w=JSON.parse(localStorage.getItem(WALLET)),m=JSON.parse(localStorage.getItem(LIVE));
    const backup=window.BUPlatformSaves.makeBackup();
    return {
      parentMenu:!!document.getElementById('game-menu'),nestedMenuOpen:!!f.getElementById('wt-unified-menu')?.open,
      level:f.getElementById('level-label')?.textContent,solved:f.getElementById('solved-count')?.textContent,
      displayedTrailCoins:f.getElementById('points')?.textContent,coins:m.coins,points:m.points,
      completed:m.completed,migrated:m.migration?.temporaryCoinsExcluded,
      retainedOldTest:!!localStorage.getItem(TEST),testCoins:JSON.parse(localStorage.getItem(TEST)).coins,
      nativeTokens:w.coins,ownedWheel:window.BUPlatformRewards.owned().includes('seawheel'),
      backupVersion:backup.version,backupFormat:backup.extensions?.wordTrailsNext?.format,
      backupCoins:JSON.parse(backup.extensions.wordTrailsNext.state).coins,
      nativeExportKeys:Object.keys(backup.keys).length,hasModeSaveAmongNativeKeys:Object.hasOwn(backup.keys,LIVE),
      childScroll:Math.max(0,f.body.scrollHeight-frame.contentWindow.innerHeight)
    };
   },{TEST,LIVE,WALLET});
   console.log('LIVE_MIGRATION_'+size.width,JSON.stringify(migration));
   assert.equal(migration.coins,60,'Never import TEST coins into LIVE Trail Coins');
   assert.equal(migration.points,0,'Never import TEST points');
   assert.equal(migration.nativeTokens,244,'Preserve native Insight Tokens');
   assert.equal(migration.testCoins,98765,'Preserve original TEST save as fallback');
   assert(migration.retainedOldTest&&migration.migrated&&migration.ownedWheel);
   assert.deepEqual(migration.completed,[0,1]);
   assert.equal(migration.level,'LEVEL 3 / 30');assert.equal(migration.solved,'1 / 4');
   assert.equal(migration.backupFormat,'WordTrailsNextLIVE');assert.equal(migration.backupCoins,60);
   assert(!migration.hasModeSaveAmongNativeKeys,'Mode save should live only in versioned backup extension');
   assert(migration.childScroll<=1,'Crossword gameplay must be one viewport');
   await page.evaluate(()=>document.getElementById('bu-wt-native-game').contentWindow.BUWTUnifiedMenu.open());
   const menu=await page.evaluate(()=>({
    rootOpen:!document.getElementById('game-menu').hidden,
    childOpen:document.getElementById('bu-wt-native-game').contentWindow.document.getElementById('wt-unified-menu')?.open
   }));
   assert(menu.rootOpen&&!menu.childOpen,'Real shared menu must open, not local imitation');
   await page.evaluate(()=>document.querySelector('#game-menu [data-nav="settings"]').click());
   assert.equal(await page.evaluate(()=>document.getElementById('settings-dialog').hidden),false);
   await page.evaluate(()=>window.closeDialog?.());
   // Actual original prerecorded audio engine: don't substitute a mocked-success API.
   const voice=await page.evaluate(()=>{
    window.__wtAudioRecords=[];
    const old=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(...args){
      const p=old.apply(this,args),item={source:String(this.src).slice(0,40),volume:this.volume};
      window.__wtAudioRecords.push(item);
      if(p?.then)p.then(()=>item.ok=true,e=>item.error=e?.name);
      return p;
    };
    return {mode:window.BUWTNativeShell.voicePrefs().mode,
      native:typeof window.bu381Play,accepted:window.BUWTNativeShell.playVoice('excellent_thinking',{milestone:true})};
   });
   await page.waitForFunction(()=>window.__wtAudioRecords?.some(x=>x.ok),{timeout:12000});
   console.log('LIVE_ORIGINAL_VOICE_'+size.width,JSON.stringify(voice));
   assert(voice.native==='function'&&voice.accepted);
   await page.evaluate(()=>document.getElementById('bu-wt-native-game').contentWindow.document.querySelector('#app .back').click());
   await page.waitForFunction(()=>!window.BUWTNativeShell.active());
   await page.evaluate(()=>document.getElementById('home-cross').click());
   await page.waitForFunction(()=>window.BUWTNativeShell?.active?.()&&document.getElementById('bu-wt-native-game')?.contentWindow?.BUWTAnnouncer);
   await page.reload({waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.BUWTNativeShell?.nativeReady?.()&&!window.BUWTNativeShell.active(),{timeout:60000});
   assert.equal(await page.evaluate(()=>location.hash),'','Refresh must return to HOME');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('bible-unfolded-word-trails-next-v1')).completed.length),2);
   await page.evaluate(()=>document.getElementById('home-trivia').click());
   assert.equal(await page.evaluate(()=>document.getElementById('home').hidden),true,'Other original modes remain functional');
   console.log('LIVE_OTHER_MODES_'+size.width,JSON.stringify({story:native.story,trivia:true,refreshHome:true}));
   console.log('LIVE_MISSING_ASSETS_'+size.width,JSON.stringify(notFound.slice(0,16)));
   console.log('LIVE_JS_ERRORS_'+size.width,JSON.stringify(errors.slice(0,16)));
   assert.equal(notFound.length,0,'No missing LIVE mode assets');
   assert.equal(errors.length,0,'No fatal JS errors');
   await page.close();
  }
  console.log('PASS staged LIVE Word Trails 30: native original root preserved, migration coins isolated, real voices, backups, no-scroll, refresh and navigation');
 }catch(e){console.error('LIVE_RELEASE_QA_FAILED',e.stack||e);process.exitCode=1}
 finally{await browser.close()}
})();