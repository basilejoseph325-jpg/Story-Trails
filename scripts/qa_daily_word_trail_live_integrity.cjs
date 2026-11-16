#!/usr/bin/env node
'use strict';
/* Standalone Daily candidate scope guard: no changes to LIVE 30-level game logic,
   Story/Trivia, wallet, global backup, audio, original art, or original levels. */
const fs=require('node:fs'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const BASE='169294536e6bdf3047cd556e8ee0d84a50d9f1ff';
const read=f=>cp.execFileSync('git',['show',BASE+':'+f],{maxBuffer:40_000_000});
const touched=['experiments/word-trails-next-v1.html','experiments/word-trails-next-v1.css'];
const allowed=new Set([...touched,
'experiments/word-trails-daily-v1.html','experiments/word-trails-daily-v1.css','experiments/word-trails-daily-v1.js',
'experiments/word-trails-daily-catalog-v1.js',
'scripts/qa_daily_word_trail_live_candidate.cjs','scripts/qa_daily_word_trail_live_integrity.cjs',
'.github/workflows/qa-daily-word-trail-live-candidate.yml',
'docs/DAILY_WORD_TRAIL_LIVE_CANDIDATE.md']);
const original=cp.execFileSync('git',['ls-tree','-r','--name-only',BASE],{encoding:'utf8'}).trim().split('\n');
for(const f of original)if(!touched.includes(f))assert(fs.existsSync(f)&&fs.readFileSync(f).equals(read(f)),'LIVE baseline file changed: '+f);
const changed=cp.execFileSync('git',['diff','--name-only',BASE],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const f of changed)assert(allowed.has(f),'Unauthorized Daily release change '+f);
const before=read(touched[1]).toString(),css=fs.readFileSync(touched[1],'utf8');
assert(css.startsWith(before.trimEnd()+'\n\n'),'LIVE Word Trails stylesheet must stay append-only');
const html=fs.readFileSync(touched[0],'utf8'),oldHtml=read(touched[0]).toString();
assert(html.includes('id="daily-trail-entry"')&&html.includes('target="_top"')&&html.includes('Play Today’s Daily Word Trail'),'New Daily entry missing');
assert(oldHtml.includes('BIBLE · 30 LEVELS')&&html.includes('BIBLE · 30 LEVELS'),'Original 30-level footer altered');
const deltaHtml=html.replace('word-trails-next-v1.css?v=live-daily-bubble-20261115-v1','word-trails-next-v1.css?v=scenic-map-seals-v8')
.replace(/^.*<a class="daily-float" id="daily-trail-entry".*\n/m,'')
.replace(/^.*<a class="daily-map-entry".*\n/m,'');
assert.equal(deltaHtml,oldHtml,'Original LIVE Word Trails HTML changed beyond Daily links and stylesheet token');
const catalog=fs.readFileSync('experiments/word-trails-daily-catalog-v1.js','utf8'),context={window:{}};
vm.runInNewContext(catalog,context);
const data=['BUWTAdditionalLevels','BUWTLevels31to35','BUWTLevels36to40','BUWTLevels41to45','BUWTLevels46to50'].flatMap(k=>context.window[k]||[]);
assert.equal(data.length,39,'Daily isolated catalog must contain the stable 39 TEST-approved puzzles');
const featured=[30,25,24,33,38,36,21,34,31,32,4,26,27,28,23,29,37];
for(const i of featured)assert(data[i].bibleBoard.filter(b=>data[i].words.some(w=>w[0]===b.word)).length>=3,'Not Bible-rich: '+i);
const names=[...new Set(data.map(b=>b.scene))];
for(const name of names)assert(fs.existsSync('bible-book-art/'+name),'Daily scene missing in original LIVE: '+name);
for(const level of data)for(const b of level.bibleBoard)assert(/^https:\/\/www\.jw\.org\/en\/library\/bible\/nwt\/books\//.test(b.url),'Non-JW Bible URL');
const dailyHTML=fs.readFileSync('experiments/word-trails-daily-v1.html','utf8');
assert(dailyHTML.includes('word-trails-daily-catalog-v1.js')&&!dailyHTML.includes('word-trails-levels-31-35-v1.js'),'Daily must load only isolated catalog');
assert(!dailyHTML.includes('BIBLE UNFOLDED · TEST'),'Production page contains TEST branding');
const dailyJS=fs.readFileSync('experiments/word-trails-daily-v1.js','utf8');
assert(dailyJS.includes("const STORAGE_KEY='bu-visual-lab-daily-word-trail-v1'"),'Legacy stamps must remain available on shared browser origin');
for(const f of ['experiments/word-trails-daily-v1.js','experiments/word-trails-daily-catalog-v1.js','scripts/qa_daily_word_trail_live_candidate.cjs'])new vm.Script(fs.readFileSync(f,'utf8'),{filename:f});
console.log('PASS_DAILY_LIVE_SCOPE',JSON.stringify({baseline:BASE,originalFilesPreserved:original.length-touched.length,existingFilesChanged:touched.length,boards:data.length,featured:featured.length,reusedScenicAssets:names.length,sourceUrls:'jw.org',playerKeysUnchanged:true,original30LevelsUnchanged:true}));
