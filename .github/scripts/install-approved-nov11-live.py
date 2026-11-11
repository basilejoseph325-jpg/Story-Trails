#!/usr/bin/env python3
"""LIVE promotional release: install approved, isolated assets only.
Intentionally preserve existing live HTML/core scripts and Word Trails host.
Run on release branch; release diff is only HTML loader tags plus new assets.
"""
from pathlib import Path
import re

p=Path('index.html')
before=p.read_text(encoding='utf-8')
assert len(re.findall(r'</head\s*>',before,re.I))==1,'expected one head closer'
assets=[
 ('bu-live-trivia-stone-uniform-nov11',
 '<link id="bu-live-trivia-stone-uniform-nov11" rel="stylesheet" href="trivia-stone-uniform-live-v1.css?v=nov11-live-1">'),
 ('bu-live-trivia-press-nov11',
 '<link id="bu-live-trivia-press-nov11" rel="stylesheet" href="trivia-stone-press-live-v1.css?v=nov11-live-1">'),
 ('bu-live-wordbuilder-score-nov11',
 '<link id="bu-live-wordbuilder-score-nov11" rel="stylesheet" href="word-builder-score-layout-live-v1.css?v=nov11-live-1">'),
 ('bu-live-trivia-lives-css-nov11',
 '<link id="bu-live-trivia-lives-css-nov11" rel="stylesheet" href="trivia-lives-live-v1.css?v=nov11-live-1">'),
 ('bu-live-trivia-press-script-nov11',
 '<script id="bu-live-trivia-press-script-nov11" defer src="trivia-stone-press-live-v1.js?v=nov11-live-1"></script>'),
 ('bu-live-trivia-lives-script-nov11',
 '<script id="bu-live-trivia-lives-script-nov11" defer src="trivia-lives-live-v1.js?v=nov11-live-1"></script>')
]
html=before
for id_,tag in assets:
  if f'id="{id_}"' not in html:
    html=re.sub(r'</head\s*>',lambda m:tag+'\n'+m.group(),html,count=1,flags=re.I)
  assert html.count(f'id="{id_}"')==1, f'duplicate or absent: {id_}'

for forbidden in ['visual-lab-test-banner.js','james-return-loop-test-v1.js',
                  'native-boost-shop-test-v1.js','daily-engagement-hall-test-v1.js']:
  assert forbidden not in '\n'.join(tag for _,tag in assets)
# Ensure the game itself isn't replaced.
assert html.count('word-trails-live-bootstrap-v1.js')==before.count('word-trails-live-bootstrap-v1.js')
assert html.count('journey-progress-caption.js')==before.count('journey-progress-caption.js')
assert html.count('bible_unfolded_core_part')==before.count('bible_unfolded_core_part')
# Strip just newly added tags to verify original source is bit-for-bit preserved.
reconstructed=html
for _,tag in assets:
  reconstructed=reconstructed.replace(tag+'\n','')
assert reconstructed==before,'Unexpected modification outside approved loader tags'
p.write_text(html,encoding='utf-8')
print('PASS: six versioned approved LIVE assets inserted; original source and LIVE bootstrap untouched.')
