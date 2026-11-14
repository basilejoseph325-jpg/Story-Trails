#!/usr/bin/env python3
"""Promote only owner-approved Genesis Episode 10 to LIVE release branch.

Frozen TEST evidence: 171a599c42ab...
Refuse any unexpected difference between LIVE and TEST in native Story sources.
The native serialized parts have exactly 12 (part3) and 3 (part5) isolated
changes, all attributable to the requested episode. Other LIVE source parts,
Book guides, save managers, menus, and Bible modes remain untouched.
"""
from pathlib import Path
import urllib.request, re, json, difflib, hashlib, time

FROZEN_TEST = "171a599c42ab89030d34b7552779ee427586f319"
ROOT = ("https://raw.githubusercontent.com/basilejoseph325-jpg/"
        "Bible-Unfolded-Visual-Lab/" + FROZEN_TEST + "/")

def get_test(path):
    req=urllib.request.Request(ROOT+path,
           headers={"User-Agent":"Bible-Unfolded-verified-selective-LIVE-release"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=60) as r:
                data=r.read()
            if not data: raise ValueError("Empty source: "+path)
            return data
        except Exception:
            if attempt==2: raise
            time.sleep(2)

def git_blob_hash(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

part_expected_sha = {
    3: ("6d1087fa978fc32116646cae5b4b176cbc2cdd3f",
        "ff1d480d0ac034e3e201f244128ff3bea8cbf93a"),
    5: ("225e0a3e530c56f01d0d09aa51d0e3ae7542590c",
        "fe1cac870794684665c2baf20b493bd6fba60dac"),
}
expected3=[
    ("replace","of 9 playable episodes","of 10 playable episodes"),
    ("replace","done/9*100","done/10*100"),
    ("replace","aria-valuemax','9","aria-valuemax','10"),
    ("replace","Genesis Episodes 7–9","Genesis Episodes 7–10"),
    ("replace","EPISODES.push","Jacob and Esau"),
    ("replace","BU_GENESIS_SCENE_ART['g09-d01']","bible-book-art/01_genesis.webp"),
    ("replace","of 9 episodes available","of 10 episodes available"),
    ("insert",None,'Object.assign(BU3857_DATA,{"genesis_ep10"'),
    ("replace","const BU_GENESIS_IDS=","genesis_ep10"),
    ("insert",None,'Object.assign(BU_HQ_WORDS,{"g10-d01"'),
    ("replace","buHQHintLetters","s.book==='genesis_ep10'?0:"),
    ("insert",None,"if(s.book==='genesis_ep10')"),
]
expected5=[
    ("insert",None,"const BU_EP10_SCENE_ART=Object.freeze("),
    ("replace","ch.chapterNumber<9","ch.chapterNumber<10"),
    ("replace","BU_GENESIS_SCENE_ART[d.id]","BU_EP10_SCENE_ART[d.id]"),
]

def decode_native(data):
    s=data.decode("utf-8")
    m=re.search(r'__BU_STAGE41_CORE_PARTS__\[\d+\] = (".*");',s,re.S)
    if not m: raise ValueError("Native Stage 41 source wrapper changed")
    return json.loads(m.group(1))

for i in (3,5):
    path=f"bible_unfolded_core_part{i}.js"
    before=Path(path).read_bytes()
    after=get_test(path)
    live_hash, test_hash=part_expected_sha[i]
    if git_blob_hash(before)!=live_hash:
        raise SystemExit(f"LIVE {path} changed since safe backup; abort rather than overwrite")
    if git_blob_hash(after)!=test_hash:
        raise SystemExit(f"TEST {path} differs from owner-approved reviewed checkpoint")
    a,b=decode_native(before),decode_native(after)
    x,y=a.splitlines(keepends=True),b.splitlines(keepends=True)
    ops=[(kind,ai,aj,bi,bj) for kind,ai,aj,bi,bj in
        difflib.SequenceMatcher(None,x,y).get_opcodes() if kind!='equal']
    expected=expected3 if i==3 else expected5
    if len(ops)!=len(expected):
        raise SystemExit(f"Unexpected native {i} diff hunks {len(ops)}; expected {len(expected)}")
    for n,((kind,ai,aj,bi,bj),(expected_kind,old_marker,new_marker)) in enumerate(zip(ops,expected)):
        old,new=''.join(x[ai:aj]),''.join(y[bi:bj])
        if kind!=expected_kind or (old_marker and old_marker not in old) or new_marker not in new:
            raise SystemExit(f"Unexpected native {i} diff #{n} ({kind}): {old[:80]} -> {new[:80]}")
        if "bu-platform-saves" in new or "Visual Lab" in new:
            raise SystemExit(f"Unexpected non-release TEST subsystem in native diff {i} #{n}")
    if i==3:
        assert b.count("const BU_GENESIS_IDS=")==1
        assert 'const BU_GENESIS_IDS=[\'genesis_ep07\',\'genesis_ep08\',\'genesis_ep09\',\'genesis_ep10\']' in b
        assert a.count("genesis_ep10")==0
        for n in range(1,11):
            for prefix in ('"g10-d',):
                if b.count(prefix+f"{n:02d}"+'"')<2:
                    raise SystemExit(f"Missing Episode 10 discovery and wheel source {n}")
        assert 'bible-unfolded-genesis-adventure-v3860' in b
        assert 'if(s.book===\'genesis_ep10\')' in b
    else:
        assert b.count("const BU_EP10_SCENE_ART=Object.freeze(")==1
        assert b.count("const BU_EP10_SCENE_ALT=Object.freeze(")==1
        assert b.count("function bu3857Render(){")==a.count("function bu3857Render(){")==1
        for n in range(1,11):
            if f"g10-d{n:02d}" not in b: raise SystemExit("Missing Scene art mapping")
    Path(path).write_bytes(after)
    print(f"PASS native part {i}: exactly {len(ops)} expected Episode 10 edits; all other lines preserved")

# Replace only the existing mobile Story hint function, preserving the
# complete original LIVE HTML and all other modes/script blocks.
htmlfile=Path('index.html')
live_html=htmlfile.read_text(encoding='utf-8')
test_html=get_test('index.html').decode('utf-8')
if len(live_html)<11_000_000 or len(test_html)<11_000_000:
    raise SystemExit("Unexpected native index size")
expected_live_hash="4e7a587d2f31c6e7eda350479a2b867132676c4c"
if git_blob_hash(live_html.encode())!=expected_live_hash:
    raise SystemExit("LIVE index changed since verified baseline; refuse overwrite")
def hint_function_region(src):
    start=src.index(" bu3857Hint=function(){")
    end=src.index("\n };\n})();",start)+len("\n };")
    value=src[start:end]
    if not 1250<len(value)<3600:raise ValueError("Unexpected modal hint function length")
    return start,end,value
li,lj,lh=hint_function_region(live_html)
ti,tj,th=hint_function_region(test_html)
if "const ep10=st.book==='genesis_ep10'&&!!entry" not in th:
    raise SystemExit("TEST reviewed thinking hints not found")
if "const ep10=" in lh or "const max=entry?2+entry.answer.length:3;" not in lh:
    raise SystemExit("LIVE hint baseline differs")
# Ensure that the only content change in the function is scoped to the
# episode10 branch: no entire TEST HTML or stylesheet is imported.
hint_ops=[(k,''.join(lh.splitlines(keepends=True)[i:j]),
            ''.join(th.splitlines(keepends=True)[u:v])) for k,i,j,u,v in
          difflib.SequenceMatcher(None,lh.splitlines(keepends=True),
                                   th.splitlines(keepends=True)).get_opcodes() if k!='equal']
if not 4<=len(hint_ops)<=8:
    raise SystemExit("Unexpected change count to LIVE hint modal")
for tag,old,new in hint_ops:
    if tag not in ('insert','replace') or len(old)>600 or len(new)>700:
        raise SystemExit("LIVE hint function edits are too broad")
    if 'function ' in new or '<script' in new or 'location.' in new:
        raise SystemExit("Unrelated hint mechanism changed")
print("PASS native Story modal hint changes",len(hint_ops),"small scoped edits")
out=live_html[:li]+th+live_html[lj:]
for part,ver in ((3,"live-genesis10-story-and-hints-20261114-v1"),
                 (5,"live-genesis10-all10-scenes-20261114-v1")):
    old=f'<script src="bible_unfolded_core_part{part}.js"></script>'
    new=f'<script src="bible_unfolded_core_part{part}.js?v={ver}"></script>'
    if out.count(old)!=1:raise SystemExit("Native LIVE script tag changed: "+old)
    out=out.replace(old,new,1)
assert out.count(" bu3857Hint=function(){")==1
assert out.count("story-adventure-explore-launcher-test-v1.js")==0
assert out.count("visual-lab-test-banner.js")==0
assert out.count("bible_unfolded_core_part1.js")==1
assert out.count("bible_unfolded_core_part2.js")==1
assert out.count("bible_unfolded_core_part4.js")==1
htmlfile.write_text(out,encoding="utf-8")
print("PASS LIVE index: only Episode 10 hint function + two script cache URLs changed")

ART_SHAS={
 "abraham-burial-promise.webp":"e407db4547a3f6cb1630df01b743ca9a084e8f8e",
 "rebekah-inquires-jehovah.webp":"36ebd4c4bda698c2bc9b57e904386bbc8a9b862c",
 "esau-and-jacob.webp":"9becd7b1872120c8a51b287458c88ec748fe0a25",
 "esau-birthright-stew.webp":"b737d880126488e4391a2e4bffecb4ec1c86044f",
 "isaac-stays-gerar.webp":"7095099d9c7d1ec4561918003b1ae7c7840e54d7",
 "rehoboth-water-found.webp":"e7ce24a18e2fa79941f860298c9fd5dac15bd5fc",
 "isaac-abimelech-covenant.webp":"eb63cf44b32f62b2ff627a4ffe9d0001c134e999",
 "rebekah-goatskins-jacob.webp":"e4c3697c8a026db69497fe71b44bf445a85e8699",
 "isaac-blessing-jacob.webp":"6ebcf562994a80853c8ce5ddce425c625f7b78d3",
 "jacob-stairway-dream.webp":"d0b19ca0ee56c5624136169530f480b9a855e456",
}
for filename,sha in ART_SHAS.items():
    rel="story-adventure-art/genesis10/"+filename
    data=get_test(rel)
    if not data.startswith(b"RIFF") or b"WEBP" not in data[:20]:
        raise SystemExit("Wrong image format: "+filename)
    if git_blob_hash(data)!=sha:raise SystemExit("Photo does not match reviewed TEST: "+filename)
    path=Path(rel)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes(data)
    print("PASS reviewed historical art",filename,len(data))

# The existing final QA also checks rendered 640x360 images, wheel,
# one-screen scene layout, saving, and earlier chapter protection.
print("PASS_GENESIS10_SELECTIVE_RELEASE_STAGED",len(ART_SHAS),"photos")
