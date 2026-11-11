/* Bible Unfolded LIVE — Trivia lives, safe native-wallet integration.
 * This is a deliberately scoped promotion of James's 5-life rule, NOT his
 * separate TEST token economy, locked Bible Books, or token-farming streak pot.
 * Five lives, one restored per 15 minutes, optional 75-token full refill.
 * Players can always continue learning at 0 lives; normal native answering
 * and saved progress are never blocked. Native wallet save is atomic for
 * spending and life restoration, with rollback on storage failure.
 */
(()=>{'use strict';
if(window.BULiveTriviaLivesV1)return;
const FIELD='buTriviaLivesV1',LIMIT=5,REFILL_MS=15*60*1000,PRICE=75;
let active=false,lastQuiz=null,lastKey='',lastShown='',toastTimer=0;
const $=selector=>document.querySelector(selector);
const pad=n=>String(n).padStart(2,'0');
const snapshot=()=>{try{return JSON.stringify(economy)}catch(_){return null}};
const available=()=>typeof economy!=='undefined'&&typeof bu3824RefreshWallet==='function'&&typeof saveEconomy==='function';
function base(){return {v:1,lives:5,nextRefillAt:0,wrongCount:0}}
function freshState(raw,now=Date.now()){
 const state=raw&&raw.v===1&&Number.isInteger(raw.lives)&&raw.lives>=0&&raw.lives<=LIMIT
  ?{v:1,lives:raw.lives,nextRefillAt:Number.isFinite(raw.nextRefillAt)&&raw.nextRefillAt>0?Math.floor(raw.nextRefillAt):0,
     wrongCount:Number.isSafeInteger(raw.wrongCount)&&raw.wrongCount>=0?raw.wrongCount:0}:base();
 if(state.lives>=LIMIT){state.nextRefillAt=0;return state}
 if(!state.nextRefillAt){state.nextRefillAt=now+REFILL_MS;return state}
 if(now>=state.nextRefillAt){
  const gained=1+Math.floor((now-state.nextRefillAt)/REFILL_MS);
  state.lives=Math.min(LIMIT,state.lives+gained);
  state.nextRefillAt=state.lives===LIMIT?0:state.nextRefillAt+gained*REFILL_MS;
 }
 return state;
}
const same=(a,b)=>a.v===b.v&&a.lives===b.lives&&a.nextRefillAt===b.nextRefillAt&&a.wrongCount===b.wrongCount;
function restoreBefore(before){
 try{
  const snapshotObj=JSON.parse(before);
  for(const k of Object.keys(economy))if(!Object.prototype.hasOwnProperty.call(snapshotObj,k))delete economy[k];
  Object.assign(economy,snapshotObj);
  if(typeof updateWallet==='function')updateWallet();
 }catch(_){}
}
function transact(change){
 if(!available())return {ok:false,reason:'Wallet unavailable'};
 try{
  bu3824RefreshWallet();
  const before=snapshot(),prior=freshState(economy[FIELD]);
  if(!before)return {ok:false,reason:'Wallet unavailable'};
  const action=change({...prior});
  if(!action||!action.next)return {ok:false,reason:action?.reason||'No change'};
  const cost=Math.max(0,Math.floor(action.cost||0));
  if(cost&&(!Number.isFinite(economy.coins)||economy.coins<cost))
   return {ok:false,reason:'Need '+(cost-Math.max(0,economy.coins||0))+' more Insight Tokens'};
  if(cost)economy.coins-=cost;
  economy[FIELD]=action.next;
  if(!saveEconomy()){restoreBefore(before);return {ok:false,reason:'Could not save. No tokens charged'};}
  if(typeof updateWallet==='function')updateWallet();
  if(cost&&typeof playCoinFx==='function')try{playCoinFx('spend')}catch(_){}
  return {ok:true,state:action.next,cost};
 }catch(e){return {ok:false,reason:'Unable to update lives'}}
}
function read(){
 if(!available())return base();
 try{bu3824RefreshWallet();return freshState(economy[FIELD]);}catch(_){return base()}
}
function sync(){
 if(!available())return;
 try{
  bu3824RefreshWallet();
  const stored=economy[FIELD];
  const cur=freshState(stored);
  if(stored&&same(stored,cur))return;
  transact(()=>({next:cur}));
 }catch(_){}
}
function timerLabel(s){
 if(s.lives>=LIMIT)return 'Full';
 if(!s.nextRefillAt)return '15:00';
 const seconds=Math.max(0,Math.ceil((s.nextRefillAt-Date.now())/1000));
 return pad(Math.floor(seconds/60))+':'+pad(seconds%60);
}
function feedback(message,good){
 let node=$('#bu-live-life-toast');
 if(!node){node=document.createElement('div');node.id='bu-live-life-toast';node.setAttribute('role','status');document.body.append(node)}
 node.textContent=message;node.classList.toggle('good',!!good);
 node.classList.add('show');
 clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>node.classList.remove('show'),3300);
}
function render(){
 const screen=$('#bu34-trivia'),body=$('#bu34-body');
 if(!screen||screen.hidden||!body){const old=$('#bu-live-lives-bar');if(old)old.remove();return}
 const s=read();
 let el=$('#bu-live-lives-bar');
 if(!el){el=document.createElement('div');el.id='bu-live-lives-bar';el.setAttribute('role','status');body.prepend(el)}
 const quiz=typeof bu34Quiz!=='undefined'?bu34Quiz:null;
 const activeQuestion=!!(quiz&&quiz.items&&quiz.items[quiz.step]&&quiz.answered===false);
 el.hidden=!activeQuestion;
 if(!activeQuestion)return;
 let markup='<div class="bu-live-lives-head"><strong>♥ '+s.lives+'/5</strong><span>'+
  (s.lives===LIMIT?'All lives ready':'Next life '+timerLabel(s))+
  '</span><button type="button" data-bu-life-refill '+(s.lives===LIMIT?'disabled':'')+'>'+
  (s.lives===LIMIT?'Lives full':'Refill all · ◈75')+'</button></div>';
 if(s.lives===0)markup+='<p class="bu-live-life-practice">Out of lives? Keep answering for free, or refill to restore your five hearts.</p>';
 if(markup!==lastShown){el.innerHTML=markup;lastShown=markup}
}
function refill(){
 const result=transact(s=>{
  if(s.lives===LIMIT)return {reason:'Your five lives are already full'};
  return {cost:PRICE,next:{...s,lives:LIMIT,nextRefillAt:0}};
 });
 feedback(result.ok?'Five lives restored · 75 Insight Tokens spent':result.reason,!!result.ok);
 lastShown='';render();
}
function answerCapture(e){
 if(e.target?.closest?.('[data-bu-life-refill]')){
  e.preventDefault();e.stopImmediatePropagation();
  refill();return;
 }
 const button=e.target?.closest?.('#bu34-trivia #bu34-body .bu34-answer[data-answer]');
 if(!button||button.disabled||button.matches(':disabled'))return;
 if(!available())return;
 const quiz=typeof bu34Quiz!=='undefined'?bu34Quiz:null;
 if(!quiz||quiz.answered!==false||!quiz.items?.[quiz.step])return;
 if(quiz!==lastQuiz){lastQuiz=quiz;lastKey=''}
 const item=quiz.items[quiz.step],key=quiz.step+':'+String(item.q||'');
 if(lastKey===key)return;
 const i=Number(button.dataset.answer);
 if(!Number.isInteger(i)||i<0||i>3)return;
 lastKey=key;
 // No deduction for correct answers; keep original native scoring/feedback.
 if(i===Number(item.correct))return;
 const result=transact(s=>{
  if(s.lives===0)return {reason:'Practice available — no lives remaining'};
  const wasFull=s.lives===LIMIT;
  return {next:{...s,lives:s.lives-1,wrongCount:s.wrongCount+1,
   nextRefillAt:wasFull?Date.now()+REFILL_MS:s.nextRefillAt}};
 });
 if(result.ok&&result.state.lives===0)feedback('All five lives used. You can still learn for free, or refill for 75 Insight Tokens.');
 lastShown='';setTimeout(render,90);
}
function mount(){
 if(active)return true;
 if(!available()||!$('#bu34-body'))return false;
 active=true;
 document.addEventListener('click',answerCapture,true);
 window.addEventListener('pageshow',()=>{sync();lastShown='';render()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){sync();lastShown='';render()}});
 setInterval(()=>{if(document.hidden)return;sync();lastShown='';render()},15000);
 sync();render();
 // Existing Trivia UI recreates its body during question changes.
 new MutationObserver(()=>{if($('#bu34-trivia')&&!$('#bu34-trivia').hidden&&!$('#bu-live-lives-bar')){
  lastShown='';render();
 }}).observe($('#bu34-body'),{childList:true});
 return true;
}
let attempts=0;function boot(){
 if(mount())return;
 if(++attempts<=40)setTimeout(boot,250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.BULiveTriviaLivesV1=Object.freeze({version:'1.0.0-live',status:()=>read(),price:PRICE,refillMinutes:15});
})();