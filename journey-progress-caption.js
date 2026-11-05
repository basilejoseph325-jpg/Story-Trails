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
(()=>{if(document.getElementById('bu-premium-sfx-test'))return;const s=document.createElement('script');s.id='bu-premium-sfx-test';s.src='premium-sfx.js?v=20261105-live-approved-story-next-v9';document.head.appendChild(s)})();


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


/* LIVE: owner-approved graded Daily Discovery completion celebration (0–5).
   Copy exact Visual Lab version. No modifications to game score, reward,
   chapter, wheel, audio settings or other modes. */
(()=>{if(document.getElementById('bu-daily-completion-premium-css'))return;const l=document.createElement('link');l.id='bu-daily-completion-premium-css';l.rel='stylesheet';l.href='daily-completion-premium-test.css?v=20261104-graded-party-v2';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-daily-completion-premium-js'))return;const s=document.createElement('script');s.id='bu-daily-completion-premium-js';s.src='daily-completion-premium-test.js?v=20261104-graded-party-v2';s.defer=true;document.head.appendChild(s)})();


/* LIVE: owner-approved Story Adventure chapter-completion V11.
   Imports exact tested modern+legacy components, approved sound, cinematic art,
   custom chapter story, and centered modern achievement section.
   No Visual Lab TEST banner, no change to Daily Discovery or other modes. */
(()=>{if(document.getElementById('bu-story-chapter-complete-v2-css'))return;const l=document.createElement('link');l.id='bu-story-chapter-complete-v2-css';l.rel='stylesheet';l.href='story-chapter-complete-v2-test.css?v=20261105-live-v11-approved';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-story-finale-stage-v11-css'))return;const l=document.createElement('link');l.id='bu-story-finale-stage-v11-css';l.rel='stylesheet';l.href='story-finale-structural-parity-v11.css?v=20261105-live-paired-v11b';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-story-chapter-complete-v2-js'))return;const s=document.createElement('script');s.id='bu-story-chapter-complete-v2-js';s.src='story-chapter-complete-v2-test.js?v=20261105-live-paired-v11b';s.defer=true;document.head.appendChild(s)})();


/* LIVE owner-approved Behind the Name: bronze/enamel answer screen and
   photographic V3 parchment explanation. Exact tested Visual Lab components.
   Do not load TEST banner or alter the existing live SFX/music. */
(()=>{if(document.getElementById('bn-stone-material-v3'))return;const l=document.createElement('link');l.id='bn-stone-material-v3';l.rel='stylesheet';l.href='behind-name-question-premium-test.css?v=20261105-live-name-enamel-v1';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bn-enamel-material-v1'))return;const l=document.createElement('link');l.id='bn-enamel-material-v1';l.rel='stylesheet';l.href='behind-name-bronze-enamel-test.css?v=20261105-live-name-enamel-v1';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bn-live-visual-skin-v1'))return;const s=document.createElement('script');s.id='bn-live-visual-skin-v1';s.src='behind-name-visual-preview.js?v=20261105-live-name-enamel-v1';document.body.appendChild(s)})();
(()=>{if(document.getElementById('bn-answer-scroll-css-v1'))return;const l=document.createElement('link');l.id='bn-answer-scroll-css-v1';l.rel='stylesheet';l.href='behind-name-explanation-scroll-test.css?v=20261105-live-name-scroll-v1';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bn-answer-scroll-js-v1'))return;const s=document.createElement('script');s.id='bn-answer-scroll-js-v1';s.src='behind-name-explanation-scroll-test.js?v=20261105-live-name-scroll-v1';s.defer=true;document.head.appendChild(s)})();


/* LIVE owner-approved Word Trails visual promotion — November 5, 2026.
   These are the exact tested Visual Lab Word Trails V1 game + V2 finale +
   V3 authentic star effect. This adds only the four isolated components.
   Preserve existing LIVE sound, handlers, saving, and all unrelated modes. */
(()=>{if(document.getElementById('wt-premium-visual-v1'))return;const l=document.createElement('link');l.id='wt-premium-visual-v1';l.rel='stylesheet';l.href='word-trails-premium-game-and-finale-test.css?v=20261105-live-wt-approved-v3';document.head.appendChild(l)})();
(()=>{if(document.getElementById('wt-completion-cinema-v2'))return;const l=document.createElement('link');l.id='wt-completion-cinema-v2';l.rel='stylesheet';l.href='word-trails-cinematic-completion-v2-test.css?v=20261105-live-wt-approved-v3';document.head.appendChild(l)})();
(()=>{if(document.getElementById('wt-star-v3-css'))return;const l=document.createElement('link');l.id='wt-star-v3-css';l.rel='stylesheet';l.href='word-trails-starfield-v3-test.css?v=20261105-live-wt-approved-v3';document.head.appendChild(l)})();
(()=>{if(document.getElementById('wt-star-v3-js'))return;const s=document.createElement('script');s.id='wt-star-v3-js';s.src='word-trails-starfield-v3-test.js?v=20261105-live-wt-approved-v3';s.defer=true;document.head.appendChild(s)})();


/* LIVE owner-approved Mixed Trivia renovation: exact Visual Lab foliage art,
   descriptive nonbutton topics and refined compass-panel typography.
   November 5, 2026. Native trivia questions, handlers, score and all other
   modes remain unchanged. */
(()=>{if(document.getElementById('bu-mixed-nonbutton-v1'))return;const l=document.createElement('link');l.id='bu-mixed-nonbutton-v1';l.rel='stylesheet';l.href='mixed-trivia-noninteractive-visual-v1.css?v=20261105-live-approved-trivia-v2';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-mixed-editorial-v2-css'))return;const l=document.createElement('link');l.id='bu-mixed-editorial-v2-css';l.rel='stylesheet';l.href='mixed-trivia-compass-editorial-v2.css?v=20261105-live-approved-trivia-v2';document.head.appendChild(l)})();
(()=>{if(document.getElementById('bu-mixed-editorial-v2-js'))return;const s=document.createElement('script');s.id='bu-mixed-editorial-v2-js';s.src='mixed-trivia-compass-editorial-v2.js?v=20261105-live-approved-trivia-v2';s.defer=true;document.head.appendChild(s)})();
