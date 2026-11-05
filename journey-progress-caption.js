/* Preserve the existing Journey layout and dynamic progress. Change caption words only. */
(()=>{'use strict';
const re=/(\d+)\s+of\s+(\d+)/i;
let writing=false;
function update(){
 if(writing)return;
 const el=document.getElementById('journey-progress-label');
 if(!el)return;
 const match=(el.textContent||'').match(re);
 if(!match)return;
 const text=match[1]+' of '+match[2]+' Episodes Complete';
 if(el.textContent===text)return;
 writing=true;el.textContent=text;writing=false;
}
function boot(){const el=document.getElementById('journey-progress-label');if(!el)return;new MutationObserver(update).observe(el,{childList:true,characterData:true,subtree:true});update();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Shared, versioned audio loader — identical in TEST and LIVE. */
(()=>{if(document.getElementById('bu-premium-sfx-test'))return;const s=document.createElement('script');s.id='bu-premium-sfx-test';s.src='premium-sfx.js?v=20261104-live-approved-story-audio-v6';document.head.appendChild(s)})();


/* Approved live Daily Discovery V3 stone-tablet visuals. Question/answers only. */
(()=>{if(document.getElementById('bu-daily-question-visual'))return;const l=document.createElement('link');l.id='bu-daily-question-visual';l.rel='stylesheet';l.href='daily-discovery-question-premium.css?v=20261104-stone-feedback-v4';document.head.appendChild(l)})();


/* Approved Daily Discovery-only polish, promoted from visually accepted Visual Lab.
   Preserve production audio and do not install Visual Lab's TEST banner. */
(()=>{if(document.getElementById('bu-daily-polish-test'))return;const l=document.createElement('link');l.id='bu-daily-polish-test';l.rel='stylesheet';l.href='daily-discovery-polish-test.css?v=20261104-metallic-art-v3';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-daily-gold-icons-test'))return;const s=document.createElement('script');s.id='bu-daily-gold-icons-test';s.src='daily-discovery-gold-icons-test.js?v=20261104-metallic-art-v3';s.defer=true;document.head.appendChild(s)})();

/* Owner-approved V3 realistic explanation scroll — LIVE DAILY DISCOVERY ONLY.
   Preserve game-native explanation text, close/next handlers and live audio.
   Do not enable this scroll in Trivia, Word Builder or any other game mode. */
(()=>{if(document.getElementById('bu-daily-explanation-scroll-css'))return;const l=document.createElement('link');l.id='bu-daily-explanation-scroll-css';l.rel='stylesheet';l.href='daily-discovery-explanation-scroll.css?v=20261104-seamless-paper-v3';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-daily-explanation-scroll-js'))return;const s=document.createElement('script');s.id='bu-daily-explanation-scroll-js';s.src='daily-discovery-explanation-scroll.js?v=20261104-clean-art-wax-v2';s.defer=true;document.head.appendChild(s)})();


/* LIVE Story Adventure only — owner-approved antique metallic gold icons.
   Same assets and behavior as approved Visual Lab, including Genesis 7–9.
   Preserve live music/SFX, game wheel, scoring, chapter art and all other modes. */
(()=>{if(document.getElementById('bu-story-metal-icons-css'))return;const l=document.createElement('link');l.id='bu-story-metal-icons-css';l.rel='stylesheet';l.href='story-adventure-metallic-icons-test.css?v=20261104-all-story-roots-v4';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-story-metal-icons-js'))return;const s=document.createElement('script');s.id='bu-story-metal-icons-js';s.src='story-adventure-metallic-icons-test.js?v=20261104-all-story-roots-v4';s.defer=true;document.head.appendChild(s)})();
