#!/usr/bin/env python3
"""LIVE *release branch* assembly only. Never commit a TEST index or save manager.

Inserts an earliest-head Daily gate and busts only the already-approved LIVE
bootstrap reference. Copies two needed historical illustrations with Git SHA
verification from the frozen TEST candidate; no other repo trees are synced.
"""
from pathlib import Path
from hashlib import sha1
from urllib.request import Request, urlopen
import re

root = Path("index.html")
html = root.read_text(encoding="utf-8")
if not 10_000_000 < len(html) < 15_000_000:
    raise SystemExit("Unexpected original LIVE index size; refusing modification")
if "<!doctype html>" not in html[:200]:
    raise SystemExit("Original LIVE HTML header missing")
if html.count("<style>") != 1:
    raise SystemExit("Unexpected LIVE native HTML head; refusing modification")
if "bu-visual-lab-test-banner" in html or "bu-daily-early-gate-v1" in html:
    raise SystemExit("Unexpected TEST-only HTML in original LIVE")

gate_marker = 'id="bu-daily-live-early-gate-v1"'
gate = r'''<script id="bu-daily-live-early-gate-v1">
/* LIVE: hold rapid Daily Discovery taps until the illustrated reader is ready.
   No dropdown, editor, legacy quiz, score, wallet or save migration. */
(()=>{'use strict';
if(!location.pathname.startsWith('/Story-Trails/') &&
 !['127.0.0.1','localhost'].includes(location.hostname))return;
let queued=false,timer=0,attempts=0;
const card=()=>document.getElementById('bu375-home-cta');
const ready=()=>window.BUDailyInsightV1?.libraryCount?.()===60 &&
 typeof window.BUDailyInsightV1.open==='function';
function feedback(message){
 const label=document.getElementById('bu375-home-status');
 if(label)label.textContent=message;
}
function reset(){
 if(timer){clearInterval(timer);timer=0;}
 attempts=0;queued=false;
 card()?.removeAttribute('aria-busy');
}
function openWhenReady(){
 if(!queued)return false;
 const el=card();
 if(!el||!el.getClientRects().length){reset();return true;}
 if(!ready())return false;
 reset();
 if(window.BUDailyInsightV1.open()===false)
  feedback('Could not open Daily Discovery. Please try again.');
 return true;
}
window.addEventListener('click',event=>{
 if(!event.target?.closest?.('#bu375-home-cta'))return;
 event.preventDefault();event.stopImmediatePropagation();event.stopPropagation();
 if(queued)return;
 queued=true;
 if(openWhenReady())return;
 card()?.setAttribute('aria-busy','true');
 feedback('Opening your Daily Discovery…');
 timer=setInterval(()=>{
  if(openWhenReady())return;
  if(++attempts>=450){
   reset();feedback('Daily Discovery could not load. Refresh to try again.');
  }
 },100);
},true);
window.BUDailyLiveEarlyGateV1=Object.freeze({installed:true,queued:()=>queued,ready});
})();
</script>
'''
if gate_marker not in html:
    html = html.replace("<style>", gate + "<style>", 1)
assert html.count(gate_marker) == 1
assert html.index(gate_marker) < html.index("<style>")

# Change only the single LIVE bootstrap script URL. A different native layout
# must fail closed instead of blindly rewriting a giant HTML document.
pattern = re.compile(r"journey-progress-caption\.js(?:\?v=[A-Za-z0-9_.-]+)?")
matches = list(pattern.finditer(html))
if len(matches) != 1:
    raise SystemExit(f"Expected one LIVE Journey loader reference, got {len(matches)}")
html = pattern.sub("journey-progress-caption.js?v=live-daily60-cross33-20261114-v1", html, count=1)
assert "bu-daily-live-early-gate-v1" in html
assert "bu-daily-early-gate-v1" not in html
root.write_text(html, encoding="utf-8")

# The 30 newly added chapters reference these two TEST images not yet in LIVE.
# Verify Git's SHA-1 blob IDs before accepting artwork, as content integrity QA.
test_ref = "876ee9953486fb0dcb84684e802c64d8282c5b41"
assets = {
    "family-worship-menu-art/v1/topic-26-paul-timothy.webp":
        "119aac2d5aeaf60fb907582e978ffe2a046a0bbd",
    "family-worship-menu-art/v1/topic-38-jesus-ministry.webp":
        "742820c61e9d94d29d87eb03277ee2efa714ef3d",
}
for name, expected_sha in assets.items():
    target = Path(name)
    if target.exists():
        payload = target.read_bytes()
    else:
        url = ("https://raw.githubusercontent.com/"
               "basilejoseph325-jpg/Bible-Unfolded-Visual-Lab/"
               + test_ref + "/" + name)
        req = Request(url, headers={"User-Agent": "Bible-Unfolded-release-verification"})
        with urlopen(req, timeout=45) as stream:
            payload = stream.read(800_000)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(payload)
    observed = sha1(b"blob " + str(len(payload)).encode() + b"\0" + payload).hexdigest()
    if observed != expected_sha:
        target.unlink(missing_ok=True)
        raise SystemExit(f"Art integrity check failed for {name}")
    print(f"PASS image {name}: {observed}")
print("PASS LIVE release branch native head, art, and cache guard verified")
