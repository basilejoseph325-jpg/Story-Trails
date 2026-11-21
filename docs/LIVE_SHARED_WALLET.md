# LIVE shared wallet candidate — Issue 21

Prepared branch: `feature/live-shared-wallet-single-tester-20261121`.
Recovery checkpoint: `checkpoint/live-before-shared-wallet-20261121`,
`fe9e77374707e39501f629cad72bdd41e177438e` (unchanged LIVE main).
No deployment or merge is part of this work.

## Save contract

The existing LIVE `bible-unfolded-rewards-v17` wallet remains authoritative;
Points remain separate. Word Trails keeps its existing
`bible-unfolded-word-trails-next-v1` save, all 50 levels and existing unlocks.
Historical Trail Coins remain in that save and are never added to native tokens.
The first shared launch retains the original wallet/recovery/Trail raw records in
`bible-unfolded-live-wallet-checkpoint-v1`. Existing completed achievements,
discoveries, seals, satchels and hinted letters get zero-value legacy receipts,
so replay cannot pay old rewards again. No TEST namespaces are read or written.
No TEST backup import or cross-environment translation is provided.

New Trail events reuse the reviewed TEST policy: level 4, discovery 1,
three-word satchel 1, five-level seal 3, paid hint 15. The parent native host
checks active-frame identity, saved progress proof, balance and a bounded
receipt ledger. Token delta and receipt commit together. A paid letter whose
Trail checkpoint failed can be recovered once after reload, including at zero
balance. Pending earned rewards reconcile against saved proof without duplicates.

The existing LIVE v2 backup coordinator and recovery journal commit native wallet
and recovery copy together, with expected-value checks and rollback. It validates
receipt metadata and the paired wallet copies for migrated backups. Existing
valid LIVE v1/v2 backups remain supported; malformed, foreign and TEST backups
are rejected before writes. The original stale-page/iframe restore freeze stays.
The migration checkpoint is recovery evidence, not a record overwritten by imports.

A browser Web Lock permits one writable LIVE game tab. A second tab or unexpected
external wallet/Trail write is read-only with a close-and-reload message. Native
iframe Trail writes are routed through the parent so ordinary play does not look
like a competing tab. A failed wallet commit restores in-memory balance and reports
failure; it cannot award a paid letter. Unsupported browsers fail closed.

## Review and recovery

Packed native core, all existing level content, other modes, artwork and audio
are byte-identical to the checkpoint (automated scope gate). Only host loading,
wallet/backup adapters and Word Trails economy calls change. Loader query versions
are advanced so cached pre-wallet scripts cannot silently bypass the new bridge. Existing restore
resilience fixtures now mirror both wallet copies and reacquire a single writer
after the intentional two-tab restore test; their failure checks remain.

Before an eventual owner-approved deployment, export a current LIVE v2 backup.
For rollback, use the checkpoint code and a matching LIVE backup/recovery record;
never substitute TEST data. Old-code tabs must be closed before using the new
candidate. No actual player save/import has been used in automated checks.

Run `scripts/qa_live_shared_wallet_{scope,model,browser}.cjs` plus the existing
Issue 13 safety, browser, resilience and Episode 12 checks. Browser evidence is
written under ignored `work/`. CI runs Chromium and WebKit at 320 and 430 pixels.
These are synthetic profiles and emulated touch, not physical iPhone or Samsung
acceptance. See the draft PR for exact execution results. No owner device work
is requested during this off-duty development run.

Levels 51–55, Genesis 13/14, Family Fresh Mix, testing grants and audio/visual
polish remain separate release lanes; none is bundled here.
