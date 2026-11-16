#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const BASE='169294536e6bdf3047cd556e8ee0d84a50d9f1ff';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=f=>cp.execFileSync('git',['show',BASE+':'+f],{maxBuffer:40000000});
const changed=new Set(['index.html','journey-progress-caption.js','story-chapter-complete-v2-test.js','scripts/qa_genesis12_native.cjs','.github/workflows/qa-live-trivia-3-screens.yml']);
const original=cp.execFileSync('git',['ls-tree','-r','--name-only',BASE],{encoding:'utf8'}).trim().split('\n');
for(const f of original)if(!changed.has(f))assert(fs.existsSync(f)&&fs.readFileSync(f).equals(read(f)),'Protected LIVE file changed: '+f);
assert.equal(fs.readFileSync('index.html','utf8').replace('journey-progress-caption.js?v=genesis13-14-release-candidate-v1','journey-progress-caption.js?v=live-daily60-cross33-20261114-v1'),read('index.html').toString(),'HTML changed beyond loader token');
const loader=fs.readFileSync('journey-progress-caption.js','utf8'),prefix=read('journey-progress-caption.js').toString();assert(loader.startsWith(prefix),'Original LIVE loader replaced');
const added=loader.slice(prefix.length);assert(!/visual-lab-test-banner|bu-platform-saves|word-trails|experiments\//i.test(added));
for(const name of ['story-adventure-release-compat.js','story-adventure-episode13-release.js','story-adventure-episode14-release.js'])assert(added.includes(name));
const hook="\n  if(modern&&typeof bu3857State!=='undefined'&&bu3857State?.book==='genesis_ep13')return window.BUStoryGenesis13Test?.currentArtwork?.()||null;";
assert.equal(fs.readFileSync('story-chapter-complete-v2-test.js','utf8').replace(hook,'').replace('const caption=art.caption||chapter?.discoveries?.[0]?.title;','const caption=chapter?.discoveries?.[0]?.title;'),read('story-chapter-complete-v2-test.js').toString(),'Existing finale renderer changed beyond Episode 13 art hook/caption');
assert.equal(fs.readFileSync('scripts/qa_genesis12_native.cjs','utf8'),read('scripts/qa_genesis12_native.cjs').toString().replace("()=>window.BUStoryGenesis12Test?.discoveryCount===13,","()=>window.BUStoryGenesis12Test?.discoveryCount===13&&window.BUStoryGenesis14Test?.status==='ready',").replace('{cards:12,locked:true,words:13}','{cards:14,locked:true,words:13}'),'Episode 12 test changed beyond registration/count expectations');
const triviaGuard='.github/workflows/qa-live-trivia-3-screens.yml';
const priorAssert='          assert loader==expected_loader+approved_story12_suffix, "Unauthorized LIVE bootstrap change detected"';
const revisedAssert='          # Match only the owner-authorized Episodes 13/14 candidate append.\n          approved_story13_14_suffix='+JSON.stringify(added)+'\n          assert loader==expected_loader+approved_story12_suffix+approved_story13_14_suffix, "Unauthorized LIVE bootstrap change detected"';
assert.equal(fs.readFileSync(triviaGuard,'utf8'),read(triviaGuard).toString().replace(priorAssert,revisedAssert),'Trivia guard changed beyond exact candidate suffix approval');
const manifest=JSON.parse(fs.readFileSync('docs/GENESIS13_14_RELEASE_MANIFEST.json'));
assert.equal(manifest.destinationBaseline,BASE);assert.equal(manifest.sourceCommit,'59217dc5d6180fcdb7cb246c7de76f8659b31913');
let images=0;
for(const r of manifest.records)if(r.exactCopy){const b=fs.readFileSync(r.destinationPath);assert.equal(b.length,r.bytes);assert.equal(sha(b),r.sha256,'Approved source changed '+r.destinationPath);if(r.destinationPath.endsWith('.webp')){images++;assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');}}
assert.equal(images,24);
for(const ep of [13,14]){
 const art=JSON.parse(fs.readFileSync('story-adventure-art/genesis'+ep+'/manifest.json'));assert.equal(art.chapterId,'genesis_ep'+ep);assert.equal(Object.keys(art.scenes).length,12);
 for(let i=1;i<=12;i++){const id='g'+ep+'-d'+String(i).padStart(2,'0');assert.equal(art.scenes[id].path,'story-adventure-art/genesis'+ep+'/'+id+'.webp');assert.equal(art.scenes[id].approved,true);}
 assert.equal(art.ending.heroDiscovery,ep===13?'g13-d09':'g14-d12');assert.equal(art.ending.backgroundDiscovery,art.ending.heroDiscovery);
 new vm.Script(fs.readFileSync('story-adventure-episode'+ep+'-release.js','utf8'));
}
new vm.Script(loader);new vm.Script(fs.readFileSync('story-adventure-release-compat.js','utf8'));
let inline=0;for(const m of fs.readFileSync('index.html','utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/\bsrc\s*=|application\/(?:json|ld\+json)/i.test(m[1]))continue;new vm.Script(m[2]);inline++;}
const core=Array.from({length:5},(_,i)=>JSON.parse(fs.readFileSync('bible_unfolded_core_part'+(i+1)+'.js','utf8').match(/__BU_STAGE41_CORE_PARTS__\[\d+\] = (".*")\s*;/s)[1])).join('');new vm.Script(core);
const allowed=new Set([...changed,'story-adventure-release-compat.js','story-adventure-episode13-release.js','story-adventure-episode14-release.js','docs/GENESIS13_14_RELEASE_MANIFEST.json','docs/GENESIS13_14_RELEASE_REVIEW.md','.github/workflows/qa-genesis13-14-release-candidate.yml',...manifest.records.map(r=>r.destinationPath),...['integrity','genesis13','genesis14','preservation','story_regression','word_trails_audio'].map(n=>'scripts/qa_release_'+n+'.cjs')]);
const delta=cp.execFileSync('git',['diff','--name-only',BASE],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const untracked=cp.execFileSync('git',['ls-files','--others','--exclude-standard','--','.',':!work'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const f of new Set([...delta,...untracked]))assert(allowed.has(f),'Unrelated release file '+f);
console.log('PASS_RELEASE_INTEGRITY',JSON.stringify({baseline:BASE,protectedUnchanged:original.length-5,exactSourceFiles:manifest.records.filter(r=>r.exactCopy).length,approvedWebPs:images,inlineScripts:inline,syntax:true,onlyThreeRuntimeEditsAndTwoNarrowQAFixtures:true}));
