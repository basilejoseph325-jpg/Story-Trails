/* Selective port of the validated TEST native economy. LIVE supports 55 levels. */
(()=>{'use strict';
const MAX_LEVEL=55,MAX_RECEIPTS=4000;
const own=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
function transaction({type,level,word,cell}={}){
 if(!Number.isInteger(level)||level<1||level>MAX_LEVEL)return null;
 const id='trails:l'+level;
 switch(type){
 case 'level':return {id:id+':complete',delta:4,kind:'credit'};
 case 'discovery':return typeof word==='string'&&/^[A-Z]{3,12}$/.test(word)?{id:id+':discovery:'+word.toLowerCase(),delta:1,kind:'credit'}:null;
 case 'satchel':return {id:id+':satchel',delta:1,kind:'credit'};
 case 'seal':return level%5===0?{id:id+':seal',delta:3,kind:'credit'}:null;
 case 'hint':return typeof cell==='string'&&/^[0-6]:[0-6]$/.test(cell)?{id:id+':hint:'+cell,delta:-15,kind:'spend'}:null;
 default:return null;
 }
}
function validate(meta){
 if(!own(meta)||meta.version!==1||!own(meta.receipts)||Object.keys(meta.receipts).length>MAX_RECEIPTS)throw Error('Invalid LIVE shared-wallet ledger.');
 for(const [id,r]of Object.entries(meta.receipts)){
  const m=/^trails:l(\d{1,2}):(complete|seal|satchel|discovery:([a-z]{3,12})|hint:([0-6]:[0-6]))$/.exec(id);
  const spec=m&&transaction({level:+m[1],type:m[2]==='complete'?'level':m[3]?'discovery':m[4]?'hint':m[2],word:m[3]?.toUpperCase(),cell:m[4]});
  if(!spec||!own(r)||!(r.kind==='legacy'?r.delta===0:r.delta===spec.delta&&r.kind===spec.kind))throw Error('Invalid LIVE shared-wallet receipt.');
 }
 return meta;
}
function seed(t={}){
 const receipts={},add=req=>{const s=transaction(req);if(s)receipts[s.id]={delta:0,kind:'legacy'};};
 for(const i of t.completed||[]){add({type:'level',level:i+1});if((i+1)%5===0)add({type:'seal',level:i+1});}
 for(const key of t.claimedSparks||[]){const m=/^(\d{1,2}):([A-Z]{3,12})$/.exec(key);if(m)add({type:'discovery',level:+m[1]+1,word:m[2]});}
 for(const key of t.paidBonuses||[]){const m=/^satchel:(\d{1,2})$/.exec(key);if(m)add({type:'satchel',level:+m[1]+1});}
 if(t.progress?.level===t.level)for(const cell of t.progress.hinted||[])add({type:'hint',level:t.level+1,cell});
 return validate({version:1,receipts});
}
window.BULiveWordTrailsEconomy=Object.freeze({MAX_LEVEL,MAX_RECEIPTS,transaction,validate,seed});
})();
