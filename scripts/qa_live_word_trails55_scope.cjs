'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const BASE='d829ed9df3d0da569edf33f20201be2fa0d8b8a0',git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8',maxBuffer:40000000}),read=f=>fs.readFileSync(f,'utf8'),old=f=>git('show',BASE+':'+f);
const allowed=new Set(['index.html','journey-progress-caption.js','word-trails-live-bootstrap-v1.js','word-trails-native-shell-v1.js','word-trails-next-launcher.js','live-word-trails-economy-v1.js','bu-platform-saves-v2.js','experiments/word-trails-next-v1.js','experiments/word-trails-next-v1.html','experiments/word-trails-levels-51-55-v1.js','experiments/word-trails-levels-51-55-metadata-v1.json','scripts/fixtures/word-trails-51-55-sources.json','scripts/qa_word_trails_levels_51_55.cjs','scripts/qa_live_shared_wallet_scope.cjs','scripts/qa_live_shared_wallet_model.cjs','scripts/qa_live_shared_wallet_browser.cjs','scripts/qa_live_word_trails50_source_v1.cjs','scripts/qa_live_word_trails50_save_compat_v1.cjs','scripts/qa_live_word_trails55_scope.cjs','scripts/qa_live_word_trails55_browser.cjs','scripts/qa_live_word_trails55_model.cjs','docs/LIVE_WORD_TRAILS55.md','.github/workflows/qa-live-word-trails55.yml','.github/workflows/qa-issue13-save-safety.yml','.github/workflows/qa-live-trivia-3-screens.yml']);
for(const f of [...git('diff','--name-only',BASE).trim().split('\n'),...git('ls-files','--others','--exclude-standard','--',':!:work/**').trim().split('\n')].filter(Boolean))assert(allowed.has(f),'Outside Issue23 scope: '+f);
let count=0;for(const f of git('ls-tree','-r','--name-only',BASE).trim().split('\n'))if(!allowed.has(f)){assert.equal(git('hash-object',f).trim(),git('rev-parse',BASE+':'+f).trim(),f);count++;}
const source={
 'experiments/word-trails-levels-51-55-v1.js':'57790cd999a84db8cd4e714a4ac4f397960a5418bb67b1801c104666f2750f4f',
 'experiments/word-trails-levels-51-55-metadata-v1.json':'a96a5d9beff3d6f1f9ac35198c34b83ac7904b41438ec451c042ee590621cd25',
 'scripts/fixtures/word-trails-51-55-sources.json':'f0996a122aefdb18564718f3a6949e7d1ee2bdc8d15dcfe0019505d81248181d',
 'scripts/qa_word_trails_levels_51_55.cjs':'b907763480f6cebd11094334ddc461bef30dcb7ca9ae9c50575d395cd0b38ded'};
for(const[f,sha]of Object.entries(source))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),sha,'Approved TEST source drift: '+f);
for(const f of ['index.html','journey-progress-caption.js','word-trails-live-bootstrap-v1.js','word-trails-native-shell-v1.js']){
 let s=read(f).replaceAll('?v=live-word-trails55-v1','?v=live-shared-wallet-v1');
 if(f==='word-trails-live-bootstrap-v1.js')s=s.replace('word-trails-next-launcher.js?v=live-shared-wallet-v1','word-trails-next-launcher.js?v=live-33-crosswords-20261114-v1');
 if(f==='index.html')for(const name of ['live-word-trails-economy-v1.js','live-shared-wallet-v1.js'])s=s.replace(name+'?v=live-shared-wallet-v1',name+'?v=shared-live-v1');
 assert.equal(s,old(f),'Only cache URLs may change: '+f);
}
assert.equal(read('live-word-trails-economy-v1.js').replace('LIVE supports 55 levels','LIVE remains 50 levels').replace('MAX_LEVEL=55','MAX_LEVEL=50'),old('live-word-trails-economy-v1.js'));
assert.equal(read('bu-platform-saves-v2.js').replaceAll('>54','>49'),old('bu-platform-saves-v2.js'),'Only save bounds extended');
let engine=read('experiments/word-trails-next-v1.js').replace("(newlyFound?(SHARED_WALLET?'Bible discovery unlocked · +1 Insight Token. ':'Bible discovery unlocked · +25 Trail Coins. '):'')","(newlyFound?'Bible discovery unlocked · +25 Trail Coins. ':'')");const start=engine.indexOf('// Approved continuation:'),end=engine.indexOf('const BIBLE_SPARKS=',start);assert(start>0);engine=engine.slice(0,start)+engine.slice(end);
engine=engine.replace(",\n 55:{symbol:'✧',name:'Ready to Serve',detail:'Fifty-five trails explored'}",'').replace(",'Learning and Serving'",'').replace('  if(LEVELS.length>50&&x.completed.includes(49))x.unlocked=Math.max(x.unlocked,50);\n','').replace('LIVE Word Trails 55-level','LIVE Word Trails 50-level').replaceAll("'All '+Object.keys(MILESTONE_SEALS).length+' Journey Seals collected'","'All ten Journey Seals collected'").replace("'✦ '+seal.title+'!'","'✦ All ten Journey Seals collected!'").replaceAll("'✦ '+seal.title","'✦ All ten Journey Seals collected'").replace("'Your '+LEVELS.length+'-level journey is complete!'","'Your 50-level journey is complete!'");
{const prior=old('experiments/word-trails-next-v1.js');if(engine!==prior){let i=0;while(engine[i]===prior[i])i++;throw Error('Engine drift at '+i+' actual '+JSON.stringify(engine.slice(i-60,i+100))+' prior '+JSON.stringify(prior.slice(i-60,i+100)));}}
console.log('PASS_LIVE_55_SCOPE',count,'existing files unchanged; native wallet bridge/core/audio/art/50 levels protected; approved TEST hashes match');

assert.equal(read('word-trails-next-launcher.js').replace('Play the 55-level Bible Word Trails','Play the 50-level Bible Word Trails'),old('word-trails-next-launcher.js'));
