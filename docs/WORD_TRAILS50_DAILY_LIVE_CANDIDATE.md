# Word Trails 50 + Daily — selective LIVE release candidate

**DRAFT / DO NOT MERGE OR DEPLOY.** Source: Visual Lab main at `72650b278b034f7eafe1dcce468e9dca5882e526`; original LIVE main at `169294536e6bdf3047cd556e8ee0d84a50d9f1ff`. Recovery baseline branch: `recovery/live-before-genesis13-14-20261115`.

## What is staged
- Existing Word Trails puzzle engine plus TEST-approved 50 levels, contemporary wheel/phone layout, star rewards, hints, native shared menu/audio ownership and fullscreen Daily overlay. Daily Back leaves the exact same Word Trails puzzle running; its original music continues, with the root game's competing tracks muted.
- Daily Word Trail 39-source-board rotating selection, clues, journal and stamps. The Daily stamp storage key stays intact because the two GitHub Pages paths share a browser origin.
- Standard LIVE Word Trails storage key `bible-unfolded-word-trails-next-v1` is retained. Already-existing LIVE progression is read with the same key; no automatic import of TEST crossword saves, trial coins, native points or Insight Tokens.
- The legacy auto-import script is made an inert compatibility shim so cached HTML fetching that URL receives a no-storage-action response.
- Existing LIVE native recording/announcer is kept. The 642 kB TEST-only ElevenLabs free-tier, **noncommercial** demo voice clip bank is strictly excluded. The TEST-only review/debug bridge is also excluded.
- Only Word Trails-specific runtime files, its native loader URL, candidate QA and this document have changed. Main Bible Unfolded story, Gallery, Family Worship, daily trivia, wallet service and global backup coordinator are not replaced here.

## Release holds (material, not cosmetic)
1. **Issue #13:** LIVE coordinator may roll older incomplete backup journals over newer Story/wallet/Word Trails progress. Codex draft [safety PR #15](https://github.com/basilejoseph325-jpg/Story-Trails/pull/15) retains ambiguous records and disables all restores; review it and obtain owner/device acceptance independently **before** this Word Trails candidate is merged. This candidate does not replace save coordinator code. Communicate disabled restores explicitly.
2. **Old browser tabs and legacy autoimport:** superseded already-running tabs can still execute old code. Inspect and reconcile draft [PR #10](https://github.com/basilejoseph325-jpg/Story-Trails/pull/10), close stale tabs, and verify new no-import shim is served. A future opt-in progress transfer is separate.
3. **Release ordering:** draft [Genesis 13/14 PR #12](https://github.com/basilejoseph325-jpg/Story-Trails/pull/12) and [Daily-only candidate PR #14](https://github.com/basilejoseph325-jpg/Story-Trails/pull/14) are independent. Do not merge PR #14 in addition to this full Word Trails candidate; they implement overlapping Daily pages.
4. **Browser verification:** pass final-head CI, independent code, NWT/JW.org source/asset review, native backup and save-path checks, real Samsung play + Daily music/Back, iPhone Safari check (James), published LIVE QA and rollback checkpoint. Browser CI alone is not device acceptance.
5. **Data compatibility:** confirm existing 30-level LIVE save records preserve level index, completed/sparks/rewards, resume checkpoint, unlocks and coins when 50 levels become available. Never rewrite the native wallet or auto-credit coins. Test both fresh and existing LIVE saves with independent browser profiles.

Nothing in this draft is currently published in LIVE. Manual owner approval to promote Word Trails does not waive a verified save-overwrite risk. Only merge after release holds are resolved.
