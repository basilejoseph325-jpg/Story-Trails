/* Word Trails LIVE — one-time transfer of crossword progress only.
   Preserve TEST data and all native Insight Tokens, points, wheels and voices.
   Never credit temporary TEST coins or TEST points into LIVE currency. */
(()=>{'use strict';
const LIVE='bible-unfolded-word-trails-next-v1',TEST='bu-visual-lab-wordtrails-next-v1';
if(localStorage.getItem(LIVE)!==null)return;
let x;try{x=JSON.parse(localStorage.getItem(TEST)||'null')}catch(_){return}
if(!x||typeof x!=='object'||Array.isArray(x))return;
const valid=n=>Number.isInteger(n)&&n>=0&&n<30;
if(!valid(x.level)||!valid(x.unlocked))return;
const fields=['completed','sparks','claimedSparks','boardBible','paidWords','paidBonuses','claimedFreeHints'],sets={};
for(const k of fields){
 const a=x[k]===undefined?[]:x[k];
 if(!Array.isArray(a)||a.length>6000||a.some(y=>typeof y==='number'?!valid(y):(typeof y!=='string'||y.length>100||!/^[a-z0-9_:|.-]+$/i.test(y))))return;
 sets[k]=[...new Set(a)];
}
let progress=null;
if(x.progress!==undefined&&x.progress!==null){
 const p=x.progress;if(!p||typeof p!=='object'||!valid(p.level))return;
 for(const k of ['found','bonuses','hinted']){
  if(!Array.isArray(p[k])||p[k].length>120||p[k].some(v=>typeof v!=='string'||!/^[A-Z0-9:]+$/.test(v)))return;
 }
 if(!Number.isFinite(p.combo)||p.combo<0||p.combo>1000)return;
 progress={level:p.level,found:[...new Set(p.found)],bonuses:[...new Set(p.bonuses)],hinted:[...new Set(p.hinted)],combo:p.combo};
}
const level=Math.max(x.unlocked,...sets.completed.filter(y=>typeof y==='number').map(y=>Math.min(y+1,29)));
const save={level:x.level,unlocked:level,coins:60,points:0,...sets,sound:x.sound!==false,progress,migration:{version:1,source:'Visual Lab crossword progress',temporaryCoinsExcluded:true}};
try{if(localStorage.getItem(LIVE)===null)localStorage.setItem(LIVE,JSON.stringify(save));}catch(_){}
})();