/* LIVE canonical wallet session and native bridge. No TEST keys are imported,
 * renamed, summed or written. Original native wallet and Trail save keys stay. */
(()=>{'use strict';
const local=['localhost','127.0.0.1'].includes(location.hostname);
if((!local&&!/^\/Story-Trails(?:\/|$)/.test(location.pathname))||/^\/Bible-Unfolded-Visual-Lab(?:\/|$)/.test(location.pathname)||window.parent!==window)return;
const W='bible-unfolded-rewards-v17',R=W+'-recovery-v3811',T='bible-unfolded-word-trails-next-v1';
const CHECKPOINT='bible-unfolded-live-wallet-checkpoint-v1',LOCK='bible-unfolded-live-game-writer-v1';
const storage=localStorage,proto=Storage.prototype,originalSet=proto.setItem,originalRemove=proto.removeItem,originalClear=proto.clear;
const protectedKey=k=>/^(?:bible-unfolded|story-trails)-/i.test(String(k))||['bu-wt-next-feel-v2','bu-platform-audio-preferences-v1','bu-visual-lab-daily-word-trail-v1'].includes(String(k));
let status='pending',release=null,installed=false,lastRaw=null,lastGood=null,lastTrailRaw=storage.getItem(T);
function shield(){
 if(!document.body)return;let el=document.getElementById('bu-live-wallet-session');
 if(status==='owned'){el?.remove();return;}
 if(!el){el=document.createElement('div');el.id='bu-live-wallet-session';el.setAttribute('role','status');el.style.cssText='position:fixed;inset:0;z-index:2147483646;display:grid;place-content:center;text-align:center;padding:28px;background:#092c35f5;color:#fff0cf;font:17px/1.5 system-ui';document.body.append(el);}
 el.textContent=status==='pending'?'Preparing your saved game…':status==='conflict'?'Another Bible Unfolded game tab is open. Close that tab, then reload here. Your saved progress is unchanged.':status==='changed'?'Another page changed the saved game. Close older game tabs and reload to use the latest progress.':'Safe saving needs an updated browser with Web Locks. Your saved progress has not been reset.';
}
const writable=()=>status==='owned';
function check(k){if(protectedKey(k)&&!writable())throw Error('LIVE wallet is read-only: '+status);}
proto.setItem=function(k,v){if(this===storage)check(k);return originalSet.call(this,k,v);};
proto.removeItem=function(k){if(this===storage)check(k);return originalRemove.call(this,k);};
proto.clear=function(){if(this===storage)throw Error('Clearing all game storage is disabled; use the game controls.');return originalClear.call(this);};
const ready=navigator.locks?new Promise(resolve=>{
 navigator.locks.request(LOCK,{mode:'exclusive',ifAvailable:true},async lock=>{
  if(!lock){status='conflict';shield();resolve(false);return;}
  status='owned';shield();resolve(true);window.dispatchEvent(new Event('bu-live-wallet-writable'));
  await new Promise(r=>{release=r});
 }).catch(()=>{status='unsupported';shield();resolve(false)});
}):Promise.resolve(false).then(x=>{status='unsupported';shield();return x;});
window.addEventListener('pagehide',()=>{setTimeout(()=>{status='closed';release?.();},0);});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
window.addEventListener('storage',e=>{if(writable()&&(e.key===W||e.key===T)){status='changed';shield();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',shield,{once:true});else shield();
function storeTrail(raw){try{if(!writable()||storage.getItem(T)!==lastTrailRaw)return false;window.BUPlatformSaves.validateTrails(raw);storage.setItem(T,raw);lastTrailRaw=storage.getItem(T);return lastTrailRaw===raw;}catch(_){return false;}}
window.BULiveWalletSession=Object.freeze({ready,writable,status:()=>status,protectedKey,storeTrail});
const fail=reason=>({ok:false,reason});
const read=k=>{const raw=storage.getItem(k);return raw===null?null:JSON.parse(raw)};
function usable(){return writable()&&window.BUPlatformSaves?.commitNativeWallet&&typeof economy!=='undefined'&&typeof saveEconomy==='function'&&typeof bu3824RefreshWallet==='function'&&window.BULiveWordTrailsEconomy;}
function notify(){window.dispatchEvent(new Event('bu-live-insight-change'));window.dispatchEvent(new Event('bu-platform-rewards-change'));try{document.getElementById('bu-wt-native-game')?.contentWindow?.dispatchEvent(new Event('bu-live-insight-change'));}catch(_){}}
function active(caller){return caller===document.getElementById('bu-wt-native-game')?.contentWindow&&window.BUWTNativeShell?.active?.();}
function restoreMemory(){if(lastGood){economy=JSON.parse(JSON.stringify(lastGood));bu3824LastWalletRaw=lastRaw;updateWallet();}}
function install(){
 if(installed)return true;if(!usable())return false;
 const originalRefresh=bu3824RefreshWallet;
 bu3824RefreshWallet=function(...args){const r=originalRefresh.apply(this,args);lastRaw=storage.getItem(W);const w=read(W);if(w)lastGood=w;return r;};
 bu3824RefreshWallet();if(!lastGood)lastGood=JSON.parse(JSON.stringify(economy));
 saveEconomy=function(){
  if(!writable()){restoreMemory();return false;}
  try{
   if(storage.getItem(W)!==lastRaw){bu3824RefreshWallet();return false;}
   bu3824MergeEntitlements();const raw=JSON.stringify(economy);
   window.BUPlatformSaves.commitNativeWallet(raw,lastRaw);
   lastRaw=storage.getItem(W);lastGood=read(W);bu3824LastWalletRaw=lastRaw;
   bu3824PersistEntitlements();notify();return true;
  }catch(error){restoreMemory();console.warn('LIVE wallet save rejected',error);return false;}
 };
 installed=true;return true;
}
function prepare(){
 try{if(!install())return fail('native-wallet-not-ready');const raw=storage.getItem(T);window.BUPlatformSaves.validateTrails(raw);if(!window.BUWTNativeShell?.active?.())lastTrailRaw=raw;bu3824RefreshWallet();if(!economy.liveSharedWallet&&storage.getItem(CHECKPOINT)===null){const before=JSON.stringify({version:1,wallet:storage.getItem(W),recovery:storage.getItem(R),trail:raw});storage.setItem(CHECKPOINT,before);if(storage.getItem(CHECKPOINT)!==before)return fail('migration-checkpoint-failed');}return {ok:true,balance:economy.coins,points:economy.points};}catch(e){return fail(e.message)}
}
function initialize(){
 const ok=prepare();if(!ok.ok)return ok;
 if(economy.liveSharedWallet){window.BULiveWordTrailsEconomy.validate(economy.liveSharedWallet);return {ok:true};}
 const t=read(T)||{};
 if(storage.getItem(CHECKPOINT)===null){const raw=JSON.stringify({version:1,wallet:storage.getItem(W),recovery:storage.getItem(R),trail:storage.getItem(T)});storage.setItem(CHECKPOINT,raw);if(storage.getItem(CHECKPOINT)!==raw)return fail('migration-checkpoint-failed');}
 economy.liveSharedWallet=window.BULiveWordTrailsEconomy.seed(t);
 if(!saveEconomy())return fail('migration-save-failed');return {ok:true};
}
function proof(req,t){const i=req.level-1;
 if(['level','seal'].includes(req.type))return (t.completed||[]).includes(i);
 if(req.type==='discovery')return (t.claimedSparks||[]).includes(i+':'+req.word);
 if(req.type==='satchel')return (t.paidBonuses||[]).includes('satchel:'+i);
 if(req.type==='hint')return t.level===i&&(t.claimedFreeHints||[]).includes(i)&&!(t.progress?.hinted||[]).includes(req.cell);
 return false;
}
function pay(req){
 const spec=window.BULiveWordTrailsEconomy.transaction(req);if(!spec)return fail('invalid-transaction');
 bu3824RefreshWallet();const meta=window.BULiveWordTrailsEconomy.validate(economy.liveSharedWallet),old=meta.receipts[spec.id];
 if(old)return {ok:true,duplicate:true,balance:economy.coins};
 if(!proof(req,read(T)||{}))return fail('no-gameplay-proof');
 if(Object.keys(meta.receipts).length>=4000||economy.coins+spec.delta<0)return fail('insufficient-or-ledger-full');
 economy={...economy,coins:economy.coins+spec.delta,liveSharedWallet:{...meta,receipts:{...meta.receipts,[spec.id]:{delta:spec.delta,kind:spec.kind}}}};
 if(!saveEconomy())return fail('native-save-failed');return {ok:true,duplicate:false,balance:economy.coins};
}
function reconcile(){
 const t=read(T)||{},requests=[];
 for(const i of t.completed||[]){requests.push({type:'level',level:i+1});if((i+1)%5===0)requests.push({type:'seal',level:i+1});}
 for(const key of t.claimedSparks||[]){const m=/^(\d{1,2}):([A-Z]{3,12})$/.exec(key);if(m)requests.push({type:'discovery',level:+m[1]+1,word:m[2]});}
 for(const key of t.paidBonuses||[]){const m=/^satchel:(\d{1,2})$/.exec(key);if(m)requests.push({type:'satchel',level:+m[1]+1});}
 for(const r of requests){const result=pay(r);if(!result.ok)return result;}return {ok:true};
}
function snapshot(caller){try{if(!active(caller))return fail('inactive-word-trails-frame');const init=initialize();if(!init.ok)return init;const pending=reconcile();if(!pending.ok)return pending;return prepare();}catch(e){return fail(e.message)}}
function transact(caller,req){try{if(!active(caller))return fail('inactive-word-trails-frame');const init=initialize();return init.ok?pay(req):init;}catch(e){return fail(e.message)}}
function hasHint(caller,level,cell){try{if(!active(caller))return false;const spec=window.BULiveWordTrailsEconomy.transaction({type:'hint',level,cell});return !!(spec&&economy.liveSharedWallet?.receipts?.[spec.id]);}catch(_){return false;}}
window.BULiveInsightBridge=Object.freeze({prepare,snapshot,transact,hasHint});
let tries=0;function startup(){if(!install()){if(tries++<240)setTimeout(startup,50);return;}try{bu3824RefreshWallet();if(typeof rewardPopup==='function')rewardPopup();}catch(e){console.warn('LIVE wallet startup',e)}}
ready.then(ok=>{if(ok){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup,{once:true});else startup();}});
})();
