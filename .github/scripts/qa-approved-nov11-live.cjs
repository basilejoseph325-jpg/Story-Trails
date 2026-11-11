/* Release regression: LIVE Trivia lives and scoped UI. No network or browser. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
for(const file of ['trivia-stone-uniform-live-v1.css','word-builder-score-layout-live-v1.css',
  'trivia-stone-press-live-v1.css','trivia-lives-live-v1.css'])
  assert(fs.existsSync(file),file);
const stone=fs.readFileSync('trivia-stone-uniform-live-v1.css','utf8');
const word=fs.readFileSync('word-builder-score-layout-live-v1.css','utf8');
const lives=fs.readFileSync('trivia-lives-live-v1.js','utf8');
const press=fs.readFileSync('trivia-stone-press-live-v1.js','utf8');
for(const c of [stone,word,fs.readFileSync('trivia-lives-live-v1.css','utf8')])
 assert.equal((c.match(/{/g)||[]).length,(c.match(/}/g)||[]).length,'CSS braces');
assert(stone.includes('trivia-real-rock-v4.jpg?v=1') && stone.includes('background-blend-mode:normal,normal!important'));
assert(stone.includes(':not(.correct):not(.wrong)')&&stone.includes('.bu3922-eliminated'));
assert(word.includes('.wb36-players.wb37-mini-players .wb36-player small'));
assert(word.includes('.wb36-status.has-message')&&word.includes('max-height:700px'));
assert(!lives.includes('gateBooks(') && !lives.includes('TEST Insight Tokens'));
assert(!lives.includes('stopPropagation()') && !lives.includes('e.stopPropagation('));
assert(lives.includes('15*60*1000,PRICE=75'));
assert(!press.includes('preventDefault('));
for(const file of ['trivia-lives-live-v1.js','trivia-stone-press-live-v1.js'])
 new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});

const handlers={},screen={hidden:true},body={prepend(){},querySelector(){}};
const quiz={items:Array.from({length:9},(_,i)=>({q:'Unique '+i,correct:1})),step:0,answered:false};
let shouldFail=false,commits=0,notices=0;
const wallet={coins:200,points:1234,purchases:[],earned:[]};
const ctx={
  window:{addEventListener(){}},
  document:{
    readyState:'complete',hidden:true,
    body:{append(){}},
    addEventListener(name,fn){handlers[name]=fn},
    querySelector(s){if(s==='#bu34-trivia')return screen;if(s==='#bu34-body')return body;return null},
    createElement(name){return {setAttribute(){},classList:{toggle(){},add(){},remove(){}},style:{},append(){},textContent:''}}
  },
  MutationObserver:class{observe(){}},
  economy:wallet,bu34Quiz:quiz,
  bu3824RefreshWallet(){},
  saveEconomy(){if(shouldFail)return false;commits++;return true},
  updateWallet(){},
  setInterval(){return 1},setTimeout(){return 1},clearTimeout(){},
  Date,Math,JSON,Number,String,Object,Set,WeakMap
};
vm.createContext(ctx);
vm.runInContext(lives,ctx,{timeout:1800});
assert.equal(wallet.buTriviaLivesV1.lives,5);
assert.equal(wallet.coins,200);
assert.equal(ctx.window.BULiveTriviaLivesV1.price,75);
const normalTap={closest(s){if(s.includes('[data-bu-life-refill]'))return null;
 if(s.includes('.bu34-answer[data-answer]'))return {disabled:false,matches:()=>false,dataset:{answer:'0'}};return null;}};
const fire=(target)=>{let prevented=false,stopped=false;handlers.click({target,
 preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}});
 return {prevented,stopped}};
for(let i=0;i<5;i++){
 quiz.step=i;
 assert.deepEqual(fire(normalTap),{prevented:false,stopped:false});
 assert.equal(wallet.buTriviaLivesV1.lives,4-i);
}
quiz.step=5;
assert.deepEqual(fire(normalTap),{prevented:false,stopped:false},'0 hearts cannot block learning');
assert.equal(wallet.buTriviaLivesV1.lives,0);
assert.equal(wallet.coins,200);
const refillBtn={closest(s){return s.includes('[data-bu-life-refill]')?{}:null}};
const click=fire(refillBtn);
assert(click.prevented&&click.stopped);
assert.equal(wallet.buTriviaLivesV1.lives,5);
assert.equal(wallet.coins,125,'refill charges 75 native coins');
quiz.step=6;fire(normalTap);
assert.equal(wallet.buTriviaLivesV1.lives,4);
shouldFail=true;
fire(refillBtn);
assert.equal(wallet.buTriviaLivesV1.lives,4,'failed save restores hearts');
assert.equal(wallet.coins,125,'failed save restores native coins');
assert.equal(wallet.points,1234,'Points untouched');
assert.deepEqual(wallet.purchases,[],'permanent purchases preserved');
console.log('PASS: native wallet saved, five hearts, 15min, 75-token refill, 0-heart free practice, failure rollback, no purchases touched, CSS scoped.');
