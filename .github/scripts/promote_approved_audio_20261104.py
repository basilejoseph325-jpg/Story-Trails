#!/usr/bin/env python3
"""Promote approved Visual Lab audio only. One-time, fail-closed, live safe."""
from pathlib import Path
from urllib.request import urlopen
import subprocess, re

TEST_COMMIT="38ac341712a860f2ec1c896c342e2305051d3cff"
TEST_REPO="basilejoseph325-jpg/Bible-Unfolded-Visual-Lab"
OLD={
 "bible_unfolded_core_part3.js":"063f9f8c110b0be8c896c39371c30920936978d4",
 "bible_unfolded_core_part5.js":"cc9f45375800a9fa1421292b454440ff38f3f1f8",
 "premium-sfx.js":"f21a6ee15841dcb8662a472b934a00fb6711fdf4",
 "journey-progress-caption.js":"297be137ff6ca40e4ac92e757e3924c0cd9ee6fb",
}
NEW={
 "bible_unfolded_core_part3.js":"6d1087fa978fc32116646cae5b4b176cbc2cdd3f",
 "bible_unfolded_core_part5.js":"5a9bfcd18460e9a4820c250e65de688d0c1c6643",
 "premium-sfx.js":"7c0b54dbc23be15a43d27dd5c5a544dcb21dc1c7",
}
def blobhash(path):
 return subprocess.check_output(["git","hash-object",path],text=True).strip()
def once(s,a,b,label):
 if s.count(a)!=1: raise RuntimeError(f"{label}: expected 1, got {s.count(a)}")
 return s.replace(a,b,1)
for path,sha in OLD.items():
 if blobhash(path)!=sha: raise RuntimeError(f"Live {path} changed; refusing promotion")
print("Verified exact pre-promotion live file hashes")
download={}
for path,sha in NEW.items():
 url=f"https://raw.githubusercontent.com/{TEST_REPO}/{TEST_COMMIT}/{path}"
 data=urlopen(url,timeout=60).read()
 dest=Path(path+".approved-audio-temp")
 dest.write_bytes(data)
 if blobhash(str(dest))!=sha: raise RuntimeError(f"Visual Lab {path} hash mismatch")
 download[path]=data.decode("utf-8")
 dest.unlink()
print("Verified all approved Visual Lab blob hashes")
part3=Path("bible_unfolded_core_part3.js").read_text()
expected3=once(part3,"try{tick();if(buHQPointer!==null&&buHQPath.length>1)swish()}catch(_){}",
 "/* Story word selection has no independent SFX; one dispatcher owns tap/swipe. */","chapter wheel audio")
if expected3!=download["bible_unfolded_core_part3.js"]:
 raise RuntimeError("Unrelated part3 changes found; aborting")

part5=Path("bible_unfolded_core_part5.js").read_text()
matched=list(re.finditer(r"const FX_PCM=\{tap:'[^']*',",part5))
if len(matched)!=1: raise RuntimeError("Original knock PCM not found exactly once")
expected5=re.sub(r"const FX_PCM=\{tap:'[^']*',","const FX_PCM={",part5,count=1)
expected5=once(expected5,"function playFx(name,level){if(!context||!sfxOn||sfxVolume<=0)return;",
 "function playFx(name,level){if(name==='tap'){/* Old knock retired, no audio sample. Story gesture owns its own cue. */if(!['play','bu3857-screen','episodes'].some(id=>{const root=document.getElementById(id);return root&&!root.hidden&&root.getClientRects().length}))window.BUPremiumSFX?.softTap?.('letter');return;}if(!context||!sfxOn||sfxVolume<=0)return;",
 "original embedded tap")
target=download["bible_unfolded_core_part5.js"]
start=target.index("function swish(){playFx('swish',.055)}")
end=target.index("// Short, gentle success motif",start)
expected5=once(expected5,"function swish(){playFx('swish',.055)}\\n",target[start:end],"approved gesture owner")
expected5=once(expected5,
 "selected.push(i);tick();if(fingerPointer!==null&&fingerMoved&&selected.length>1)swish();updateTrace();",
 "selected.push(i);updateTrace();","classic wheel duplicate audio")
if expected5!=target: raise RuntimeError("Unrelated part5 changes found; aborting")
print("Verified BOTH core files differ ONLY by approved audio source changes")

loader=Path("journey-progress-caption.js").read_text()
loader=once(loader,"premium-sfx.js?v=20261104-unified-audio-v1",
 "premium-sfx.js?v=20261104-live-approved-story-audio-v6","live loader audio cache")
if "Approved live Daily Discovery V3 stone-tablet visuals" not in loader:
 raise RuntimeError("Live styling must be preserved")
for path,data in download.items(): Path(path).write_text(data)
Path("journey-progress-caption.js").write_text(loader)
for path in NEW:
 if blobhash(path)!=NEW[path]: raise RuntimeError("Installed audio file hash mismatch")
for path in [*NEW,"journey-progress-caption.js"]:
 subprocess.run(["node","--check",path],check=True)
print("APPROVED AUDIO ONLY promotion verified; live Daily Discovery styles preserved")
