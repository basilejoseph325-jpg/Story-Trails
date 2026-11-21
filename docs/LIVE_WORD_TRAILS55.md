# Issue 23 — LIVE Levels 51–55 candidate

- [x] Start on prepared `feature/live-word-trails-51-55-20261121` branch.
- [x] Preserve checkpoint `checkpoint/live-after-wallet-before-55-20261121`,
  LIVE shared-wallet baseline `d829ed9df3d0da569edf33f20201be2fa0d8b8a0`.
- [x] Copy only approved five-level content, metadata, source ledger and content
  validator from TEST `2836475c8e21bcf080ed2fd0fd812aac7aea1ee8` (PR 65/50).
- [x] Append stable save indices 50–54, Chapter 11 `Learning and Serving`,
  seal 55 `Ready to Serve`; completed Level 50 unlocks 51 without replay.
- [x] Extend LIVE wallet policy to 55 and backup progress bounds to 54.
  Keep original native authority, receipt schema/budget, 4/1/1/3 rewards,
  15-token paid hints, Points, historical Trail Coins and existing save keys.
- [x] Keep original 50-level files/content, shared bridge, native core, modes,
  artwork, Daily and audio unchanged. Update only required cache URLs/labels.
- [x] Match all four imported files to pinned source SHA-256 hashes in
  `qa_live_word_trails55_scope.cjs`. The metadata/source review flags remain
  the historical TEST review record, not a runtime integration switch.
- [x] Correct discovery popup to say +1 Insight Token in the native shared mode;
  its accounting already awarded 1. No reward values change.
- [x] Add focused browser/content/save checks. Exact execution results, remaining
  failures and workflow links are maintained in draft PR #24.
- [ ] Independent ChatGPT review; no Codex merge/deployment.

## Tests and preservation boundary

The new scope gate reverses only the explicitly appended registration, seal,
chapter, completed-50 unlock, dynamic end labels and corrected reward label, then
compares the *entire engine* against the LIVE checkpoint. Only generated,
untracked `work/` artifacts are excluded; tracked changes still require an
explicit allowed file. Wallet policy/save
coordinator and loader edits are also restricted to their exact bounds/cache
changes. All other protected files and imported source hashes must match.
Existing release guards now expect the approved 55-level count/cache chain;
original gameplay assertions and artwork hash checks remain. Existing wallet
browser/model checks still run alongside new expansion cases.

`qa_live_word_trails55_browser.cjs`: Chromium and WebKit 320/430; actual native
50→51→55 progression, every crossword/hidden discovery, bonus satchels,
wrong answers, free/paid/duplicate hints, restart, refresh/resume, seal and
replay without duplicate credit, completed-55 LIVE v1/v2 export/restore, and
pre-expansion completed-50 v2 restore/unlock. All answer letters use real touch
taps; swipe uses Chromium CDP touch and WebKit mouse pointer drag (not claimed
as native WebKit touch swiping). Negative native Points, owned wheels, old
Trail Coins, Story and TEST canaries are asserted throughout.

`qa_live_word_trails55_model.cjs`: old50/completed55 LIVE v1/v2, bounds rejection,
negative Points/ownership, receipt policy and five injected restore failures.
Existing LIVE suites additionally cover wallet rollback/paid-hint recovery,
Settings malformed-file rejection, native v1/v2 round trips, crash recovery,
Daily/music, Genesis12, Family/Clue Relay, Trivia and Books.

Synthetic browser profiles only. No actual player backups or TEST exports are
imported. Physical Android/iPhone acceptance is not claimed or requested here.
The separate unmerged Genesis13/14 combination remains outside this lane.

## Recovery and next lane

LIVE main and checkpoint remain untouched. Before any later approved deployment,
export a current LIVE backup and close older tabs. If rolling back this expansion,
restore checkpoint code with a matching pre-55 LIVE backup (do not feed a completed
55 save to the old 50-only validator). Never substitute TEST saves. Existing
backup journal, paired wallet copies and migration checkpoint protections remain.
After independent approval/release, the next separate lane is Genesis13/14 PR12;
Family Fresh Mix and polish follow. No 45k tester grant is included.

## Follow-up: real swipe-to-tap capture defect (PR review 6007431615)

ChatGPT's 55-level launcher caption and strict guard corrections are retained.
A Chromium CDP swipe followed by a real touch missed its first letter locally
at 320px after a 250ms gap (turn 8). The trace showed an unlocked, non-drag tap
on B with suppression already expired: pointerdown targeted B, but explicit
capture on the wheel retargeted pointerup to the non-clickable wheel. No click
reached B, so selection stayed empty. Old routing was confirmed at 430px too;
other old taps still emitted a compatibility click, explaining intermittent CI.

The fix captures the original letter button instead. Moves/up still bubble to
the existing wheel handlers, hit-testing/SFX/visuals stay unchanged, and swipe
compatibility clicks remain suppressed. The next independent tap resets the
guard as before. No wallet/save/reward code changes in this follow-up.

`qa_live_word_trails55_touch.cjs` observes native event targets and internal
selection/drag/guard state without synthesizing clicks. Chromium uses real CDP
swipes and Playwright/CDP instant/held touch. It asserts the very first letter,
exactly-one selection/toggle, pointerup on that letter, canceled gesture cleanup,
keyboard Space activation, and unchanged balance at 320/430, with 0/20/250ms gaps.
Run with `TOUCH_BASELINE=1` to record old routing from reviewed commit 2fca84b;
old compatibility-click delivery is timing-dependent, not claimed to miss on
every attempt. JSON traces are CI artifacts. The unmodified full-game suite
now has **no post-swipe delay workaround** and retains strict prefix assertions.
Only the exact capture change is allowed by the whole-engine scope guard.
Release-loader cache versions advance specifically for the fixed engine.
Final exact-head regression results are recorded on PR #24. No merge/deploy.
