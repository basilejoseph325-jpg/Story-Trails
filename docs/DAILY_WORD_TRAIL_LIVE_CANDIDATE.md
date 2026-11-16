# Daily Word Trail — isolated LIVE release candidate (NOT DEPLOYED)

**Status:** Prepared in draft for CI, independent review, physical device acceptance and safe-production release. Do not merge until all blockers are resolved. Built atop protected LIVE baseline `169294536e6bdf3047cd556e8ee0d84a50d9f1ff`. The separate Codex Genesis 13/14 draft PR #12 and unresolved save-safety issue #13 must not be overwritten or inadvertently merged with this candidate.

## Source and intended player experience

Visual Lab TEST PRs #36 (first Daily), #37 (Samsung swipe-line fix), #38 (Bible-focused 17-board rotation, Discovery Journal and refresh-to-home), #39 (prominent Daily floating orb), and #40 (TEST footer centering). Owner personally accepted the improved wheel and later the floating Daily entry. LIVE Regular Word Trails has its own distinct 30-level engine/assets/saves; do NOT promote TEST 50-level Word Trails or TEST Settings while releasing only Daily.

The isolated Daily content is packaged as `experiments/word-trails-daily-catalog-v1.js`: **exact source data and order** of 39 boards from five TEST level-pack scripts. This file defines the same source globals only when Daily is opened; the original LIVE `experiments/word-trails-levels-12-30-v1.js` remains untouched. All 21 scenic WEBPs are reused from LIVE's existing `bible-book-art/`; no art uploads.

Daily HTML/CSS/JS come from tested TEST code, with only branding, version tokens and isolated catalog imports changed. It retains the existing same-origin localStorage key `bu-visual-lab-daily-word-trail-v1` **on purpose** so stamps already earned in TEST remain visible when Daily is released; it never accesses the native wallet, player profile or regular Word Trails save keys. The prior Nov 15 Babel puzzle stays at original index 12; Nov 16+ rotates 17 Bible-rich puzzles, each with 3+ Scripture-linked word clues. Stamps open a Bible Discovery Journal with JW.org Scripture links. Refresh returns to game home, not the standalone Daily puzzle.

LIVE regular Word Trails iframe adds one `☀ DAILY` floating button and a level-map entry. `target="_top"` opens Daily within the same GitHub Pages origin. Normal back link returns via `../index.html?wt_launch=native`. Regular original footer remains **BIBLE · 30 LEVELS**. The existing LIVE original next-v1 HTML changes only by the two anchors and CSS cache token; CSS is append-only. **No native shell, original level files, renderer, audio, reward, backup, Trivia or Story source files are altered.**

## Candidate-only test requirements

- Strict original LIVE baseline comparison on every original file other than the two authorized HTML/CSS edits, validate exact permitted edits, preserve original 30-level footer and 39 Daily puzzle source indexes, verify 21 scenic assets/JW.org references, check syntax
- Chromium touch/tap and real swipe play for two consecutive dates at 320×568 / 390×844 / 430×932; hints, wrong/correct/duplicate inputs, stamp and Journal persistence, no horizontal overflow and no writes to unrelated localStorage keys
- Verify real LIVE native Word Trails shell iframe loads the gold floating Daily button and clicking it launches the Daily page in the top frame; test direct standalone entry as well
- Verify manual Daily refresh returns to home; localhost QA date reload remains on Daily for deterministic saved-progress tests
- Preserve older Nov 15 Babel date/index and historical stamp; no newly granted stamp on replay
- No import/export, restore, rollback journals, global save changes, live publish or live branch merge triggered by this workflow

## Release blockers and rollback

- [ ] Full candidate CI successful at exact final-head SHA
- [ ] Independently inspect candidate and TEST→LIVE parity (NWT/JW.org wording, hints, stamp/reward mechanics, touch, route)
- [ ] Confirm real TEST hosted functionality and owner Samsung acceptance of **Journal and refresh-to-home** (floating button and wheel already accepted)
- [ ] Safari/iPhone validation where available
- [ ] Address/unambiguously mitigate inherited LIVE startup restore risk (issue #13); no automatic player-data restore is safe to promise
- [ ] Confirm pre-release LIVE head and Codex PR #12 sequencing; create a named LIVE recovery branch at the exact merged baseline
- [ ] Merge only this candidate after approval, await LIVE Pages publish, verify real LIVE hosted native Word Trails→Daily flow + refresh + wallet/persistence and record live release SHA in Visual Lab issue #3

**Not a LIVE deployment.** This stage is a separate candidate and does not supersede Genesis PR #12 or issue #13.
