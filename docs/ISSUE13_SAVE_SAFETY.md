# Issue #13 — narrow save-safety hold

Separate from chapter PR #12. Base: LIVE `169294536e6bdf3047cd556e8ee0d84a50d9f1ff`. No merge/deployment or LIVE main write is authorized. The existing verified recovery branch `recovery/live-before-genesis13-14-20261115` remains unchanged.

## Root cause and conservative resolution

The old LIVE `recoverPending()` automatically replayed every `previous` value in an interrupted import journal. There is no per-key intended AFTER value or transaction-bound committed marker, so neither an old journal nor the string `yes` proves ownership of current saves. A newer Story, wallet or Word Trails write could be overwritten. Native v1 imports also bypassed the coordinator's v2 review through the original file handler.

This fix uses issue #13's explicit **restore-disabled option**. It does not import any TEST/experimental backup implementation or enable a replacement restore system.

- `recoverPending()` is now read-only. Legacy, partially applied, malformed, orphan-marker, committed-but-unverifiable and unsupported future records are logically quarantined: the original raw journal/marker remain byte-for-byte in storage. No rollback, cleanup or automatic reload occurs.
- All restores are paused: native v1/v2 buttons, file-change dispatch, direct `onchange` and `applyBackup` calls fail closed. `dryRun` can inspect a compatible backup but reports `canApply:false`. No new import journals are created.
- Existing current-progress backup export remains the same format/version. It excludes the hazardous rollback control records, which can be downloaded separately as **evidence**, not a restore payload. Review warns that current progress might already be partly restored and cannot recreate an earlier known-good state.
- A small early index guard blocks UI restores before native handlers run. Its frozen pending sentinel also makes the actual cached old coordinator exit before reaching unsafe recovery, even if the new safety script fails to load. The safe coordinator is loaded explicitly with a new version URL; the existing loader/Word Trails bootstrap is otherwise untouched.
- Normal play, native checkpoint saving, wallet/Points/Insight Tokens, purchases, settings, audio, Word Trails and all chapters/images are unchanged. Only **two runtime files** change: `index.html` (the early guard/preload) and `bu-platform-saves-v2.js` (this safety hold).

“Quarantine” does not move/delete records or guess that a committed marker is trustworthy. The review panel offers only current-progress and retained-record downloads—no Apply, Roll Back, Clear Journal or Restore action.

## Re-enabling restore is a separate future feature

This candidate deliberately does **not** write future transaction journals. Before restores are re-enabled, a separately reviewed format must persist a bounded transaction identity, verified per-key BEFORE and intended AFTER values (or equivalent verified hashes), a committed marker bound to that identity, conditional/idempotent handling of each current value, and conflict detection that refuses to overwrite newer independent writes. The unresolved old journal cannot supply that missing evidence. No speculative format or experimental migration is added to this release.

An already-running old page can still write using its old code. A newly loaded protected page does not rewind it, and a cached old coordinator is blocked by the early sentinel, but this cannot retroactively control old windows or saved copies of old API functions. Closing/reloading old tabs and verifying the delivered safety revision belong to final release verification. This is not a claim of universal cross-tab locking.

## Automated verification

- Nine isolated model cases: no journal, stale Story, stale wallet, true interrupted legacy import, malformed, empty, committed, orphan marker and future format. Startup, repeated recovery reads, API restore attempts and export inspection make **zero storage writes**. Repeated loads preserve all raw records and game data. The actual old coordinator was evaluated behind the sentinel and made no writes.
- Disposable Chromium profiles at **320×568 and 430×932**: stale Story/wallet and partial import states, malformed/committed/orphan records, two repeated reloads per case; newer Story progress, negative Points, Tokens, owned/equipped Ocean Glow and Word Trails saves retained. No real player data is used.
- Native v1/v2 file entry points and direct API/property calls are blocked **before reading the file or asking for confirmation**. The test makes any attempted file read throw, so a guard failure cannot perform an import. Export and separate evidence downloads are inspected without restoring anything.
- New coordinator load failure: native restore UI/API remains blocked while ordinary Story play remains available.
- CI also exercises unchanged Episode 12 and a disposable combined copy of chapter PR #12 (`1e2f3636fb054497a4fae65a283401c2ad96e026`) with this safety guard: all Episodes 13/14 touch puzzles, hints, rewards, checkpoint handling and endings. Combining QA files is not a merge into either candidate or LIVE main.

Actual final-head pass/fail and artifacts are recorded on this safety PR's Checks tab. Syntax checks are not physical-device acceptance. Physical Samsung/Android and iPhone/Safari acceptance, independent review, and final release verification/authorization remain outstanding. Restore remains disabled, including when no journal exists; this is an intentional safety feature hold, not a silently enabled new importer.

## Exact scope and recovery

Runtime: `bu-platform-saves-v2.js`, `index.html`.
QA/documentation: `scripts/qa_issue13_safety.cjs`, `scripts/qa_issue13_browser.cjs`, `.github/workflows/qa-issue13-save-safety.yml`, this file.
No chapter content, artwork, engine transport, wallet service, audio file, Word Trails implementation, original save key or other runtime file is changed. PR #12 is not modified. The original recovery checkpoint remains the rollback reference; no player-data restore was used to prepare this fix.
