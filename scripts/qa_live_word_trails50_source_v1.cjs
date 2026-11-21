#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const game=read('experiments/word-trails-next-v1.js');
const html=read('experiments/word-trails-next-v1.html');
const daily=read('experiments/word-trails-daily-v1.html');
const dailyJs=read('experiments/word-trails-daily-v1.js');
const shell=read('word-trails-native-shell-v1.js');
const loader=read('word-trails-live-bootstrap-v1.js');
const root=read('journey-progress-caption.js');
const migration=read('experiments/word-trails-live-migration-v1.js');
assert.match(game,/const STORAGE='bible-unfolded-word-trails-next-v1'/,'Original LIVE Word Trails storage key retained');
assert.doesNotMatch(game,/const STORAGE='bu-visual-lab-wordtrails-next-v1'/,'TEST save key may not replace LIVE save');
for(const index of [31,36,41,46]){
 assert(game.includes('BUWTLevels'+index+'to'+(index+4)),'New level batch '+index+' missing');
 assert(html.includes('word-trails-levels-'+index+'-'+(index+4)+'-v1.js'),'Level batch not loaded '+index);
}
assert(!html.includes('word-trails-live-migration-v1.js'),'Legacy silent TEST-to-LIVE importer must not load');
assert(!html.includes('word-trails-original-voice-clips-v1.js'),'Noncommercial ElevenLabs demo bank cannot enter LIVE');
assert(html.includes('word-trails-announcer-v1.js?v=live-original-recordings'),'LIVE announcer retained');
assert(html.includes('data-wt-open-daily'),'Daily must remain an in-game button');
assert(daily.includes('class="daily-back"')&&!daily.includes('href="../index.html?wt_launch=native"'),'Daily back cannot jump via Home');
assert(dailyJs.includes("const STORAGE_KEY='bu-visual-lab-daily-word-trail-v1'"),'Daily stamp records preserved on shared origin');
assert(shell.includes('function openDaily()')&&shell.includes('function closeDaily('),'Native Daily overlay remains');
assert(shell.includes('rootMusicMuteLease'),'Main-game soundtrack must remain muted inside Word Trails');
assert(game.includes('bu-wt-daily-enter')&&!game.includes("dailyOverlayActive=true;music?.pause()"),'Daily must not pause regular Word Trails music');
assert(loader.includes('word-trails-native-shell-v1.js?v=live-word-trails55-v1')&&root.includes('word-trails-live-bootstrap-v1.js?v=live-word-trails55-v1')&&root.includes('bu-platform-rewards-v1.js?v=live-word-trails55-v1')&&shell.includes('word-trails-next-v1.html?v=live-word-trails55-v1')&&html.includes('word-trails-next-v1.js?v=live-word-trails55-v1'),'Wallet release cache chain must match');
assert(!migration.includes('localStorage.')&&!migration.includes('sessionStorage.')&&!migration.includes('.setItem('),'Legacy importer must be inert');
assert(fs.existsSync('scripts/qa_live_word_trails_native_daily_music_v1.cjs'),'Native test missing');
assert(fs.existsSync('scripts/qa_live_word_trails_daily_v1.cjs'),'Daily test missing');
for(const path of ['experiments/word-trails-levels-31-35-v1.js','experiments/word-trails-levels-36-40-v1.js','experiments/word-trails-levels-41-45-v1.js','experiments/word-trails-levels-46-50-v1.js']){
 const s=read(path);
 assert(s.includes('https://www.jw.org/'),'Scripture sources must remain on JW.org');
}
const arts=new Set();
for(const path of ['experiments/word-trails-next-v1.js','experiments/word-trails-levels-12-30-v1.js','experiments/word-trails-levels-31-35-v1.js','experiments/word-trails-levels-36-40-v1.js','experiments/word-trails-levels-41-45-v1.js','experiments/word-trails-levels-46-50-v1.js']){
 for(const m of read(path).matchAll(/scene:\s*'([^']+)'|"scene"\s*:\s*"([^"]+)"/g))arts.add(m[1]||m[2]);
}
for(const art of arts)assert(fs.existsSync('bible-book-art/'+art),'Missing LIVE scene '+art);
console.log('PASS_WORD_TRAILS50_LIVE_SOURCE_CANDIDATE',JSON.stringify({artworks:arts.size,livesave:true,noSilentImport:true,noDemoVoices:true,dailyOverlay:true,rootMusicExclusive:true}));
