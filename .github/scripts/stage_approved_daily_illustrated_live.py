#!/usr/bin/env python3
"""Prepare approved illustrated Daily release on the separate LIVE release branch.
Transfers exactly 26 verified WebP assets from immutable TEST commit; updates
only one existing root script URL to bust Android caches. Does not touch
Story/Trivia/Word Trails/rewards or migrate existing TEST or legacy Daily saves.
"""
import hashlib,json,re,subprocess,urllib.request
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[2]
manifest=json.loads((root/"docs/DAILY_ILLUSTRATED_APPROVED_ASSETS_20261113.json").read_text())
assert manifest["sourceRepository"]=="basilejoseph325-jpg/Bible-Unfolded-Visual-Lab"
assert manifest["sourceCommit"]=="5770bdc629ad2a4e091d5aa31eff602d85c7c8df"
art=manifest["art"]
assert len(art)==manifest["expectedCount"]==26
assert len(set(x["path"] for x in art))==26
for entry in art:
    path=entry["path"]
    assert re.fullmatch(r"assets/daily-book/[a-z0-9-]+\.webp",path),(path,"unapproved asset path")
    dst=root/path
    if dst.exists():
        data=dst.read_bytes()
    else:
        url=f"https://raw.githubusercontent.com/{manifest['sourceRepository']}/{manifest['sourceCommit']}/{path}"
        request=urllib.request.Request(url,headers={"User-Agent":"Bible-Unfolded-reviewed-asset-release"})
        with urllib.request.urlopen(request,timeout=60) as resp:
            assert resp.status==200,(url,resp.status)
            data=resp.read(200000)
    assert len(data)==entry["bytes"],("Size mismatch",path)
    assert data[:4]==b"RIFF" and data[8:12]==b"WEBP",("Not WEBP",path)
    # Git blob hash, not the plain file SHA.
    digest=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    assert digest==entry["sha"],("Unapproved or corrupted image",path,digest)
    dst.parent.mkdir(parents=True,exist_ok=True)
    if not dst.exists():dst.write_bytes(data)
    with Image.open(dst) as im:
        assert im.format=="WEBP" and im.size[0]>=600 and im.size[1]>=330 and 1.5<=im.size[0]/im.size[1]<=2.2,("Wrong image format/aspect",path,im.size)
print("PASS: exact 26 approved source images present, original git hashes match immutable TEST build")

js=(root/"daily-discovery-illustrated-v1.js").read_text(encoding="utf8")
css=(root/"daily-discovery-illustrated-v1.css").read_text(encoding="utf8")
content=(root/"daily-discovery-insights-content-v1.js").read_text(encoding="utf8")
loader=(root/"journey-progress-caption.js").read_text(encoding="utf8")
assert "const KEY='bu-daily-insight-live-v1'" in js
assert "const bookEnabled=()=>true" in js
assert "const BOOK_ORIGINALS=new Set(" in js
assert "if(!editorialQA()" in js
assert "bu-live-daily-illustrated-v1-data" in loader
assert "bu-test-home-loader" not in loader
assert "document.querySelector('#home-cross')" not in loader
assert len(re.findall(r"\bid:'",content))==30,("Expected 30 discoveries",len(re.findall(r"\bid:'",content)))
assert "TEST art-first cover v13" in css
assert "bu-book-art-only" in js
assert "bu-daily-book-preview" in css
for path in ["daily-discovery-illustrated-v1.css","daily-discovery-insights-content-v1.js","daily-discovery-illustrated-v1.js"]:
    assert path in loader,("Loader missing",path)

# One isolated version query only, preserving the 11+ MB native LIVE index.
htmlfile=root/"index.html"
html=htmlfile.read_text(encoding="utf8")
pattern=re.compile(r'(?P<stem><script\b[^>]*\bsrc\s*=\s*["\x27][^"\x27]*?journey-progress-caption\.js)(?:\?[^"\x27]*)?(?P<end>["\x27])',re.I)
matches=list(pattern.finditer(html))
assert len(matches)==1,("Expected exactly one original root loader tag; refuse edit",len(matches))
old=matches[0].group(0)
new=matches[0].group("stem")+"?v=20261113-live-daily-illustrated-v1"+matches[0].group("end")
assert old!=new and old.startswith("<script") and "20261113-live-daily-illustrated-v1" not in old or old==new
candidate=html.replace(old,new,1)
assert candidate.replace(new,old,1)==html
if candidate!=html:htmlfile.write_text(candidate,encoding="utf8")
print("PASS: One LIVE native index script URL cache bump; no other HTML changed")
