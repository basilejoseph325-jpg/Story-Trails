#!/usr/bin/env python3
"""Selectively add one direct Bible Books card script to LIVE candidate index.
   Never rewrites native game logic, rewards, story routes, or existing scripts. """
from pathlib import Path
import re

path=Path('index.html')
old=path.read_text(encoding='utf-8')
needle='<script id="bu-books-made-simple-live-v1" defer src="bible-books-made-simple-card-v1.js?v=20261114-live-books-v1"></script>'
if needle in old:
    print("PASS: independent Books card entry already installed")
    raise SystemExit(0)
if len(old)<7_000_000 or old.count('<!doctype html>')!=1 or old.count('</body></html>')!=1:
    raise SystemExit('Unexpected LIVE index layout; refusing giant HTML edit')
anchor=re.compile(r'<script\s+defer\s+src="journey-progress-caption\.js\?[^"]+"\s*></script>')
matches=list(anchor.finditer(old))
if len(matches)!=1:
    raise SystemExit('No unique native journey loader anchor; refusing edit')
if 'bu-books-direct-entry-v5' in old or 'bu-daily-early-gate-v1' in old:
    raise SystemExit('TEST-only native gates must never appear in LIVE')
m=matches[0]
new=old[:m.end()]+'\n'+needle+old[m.end():]
if new.count(needle)!=1 or len(new)-len(old)!=len(needle)+1:
    raise SystemExit('Unexpected diff; refusing LIVE edit')
if 'id="home-story"' not in new or 'id="home-books"' not in new:
    raise SystemExit('Original Story Adventure entry unavailable; refusing edit')
path.write_text(new,encoding='utf-8')
print('PASS: directly load Books Made Simple card while preserving LIVE native game')
