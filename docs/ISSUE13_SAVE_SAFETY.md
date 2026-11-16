# Reliable LIVE save, export and restore — issue #13

Candidate based on PR #15 (`eed6175`), isolated from LIVE main
`67a9020455f98318c518e5e989a285ac80e167b6`. Main advanced during development; the candidate was rebased without changing main. No merge or deployment.
This supersedes PR #15's temporary restore hold, not its legacy-journal protection.

## Causes and correction

- Previous-only rollback journals could rewind newer progress. Retain those old
  records unchanged as evidence (including pending records from the newly landed
  `8669176` importer); never replay them, including a bare `yes` marker.
- The native v1 handler bypassed coordinated v2 validation. The early sentinel
  still blocks old handlers/cached coordinators until the new coordinator binds.
  Both file formats now use one validated writer and confirmation.
- Multi-key imports could stop halfway. A separate, bounded v3 transaction records
  exact before/after strings, transaction ID, phase and accidental-corruption
  checksum. Every storage mutation is read back. Commit is recorded in that same
  transaction; there is no unrelated global commit flag.
- Interrupted uncommitted transactions recover under an exclusive Web Lock.
  Rollback changes a key only while it still equals this transaction's after-value.
  Conflicting newer values stay untouched; conflict evidence is retained and the
  transaction retired. Malformed transactions stay blocked for review, without
  destructive guesses. Recovery failures retain the journal for a storage-freeing
  retry. Committed transactions are only cleaned, never rolled back.
- Old parent/iframe unload checkpoints could overwrite a successful import. The
  departing document and its existing same-origin frames stop writing storage
  until reload; a new document saves normally. Updated peer tabs refresh their
  stale memory after transaction completion. Startup recovery holds its old page
  until recovery/reload; it cannot race another restore outside the lock.
- Native and Word Trails saves swallowed storage failures. A small storage-boundary
  monitor verifies their writes, reports failed/silently dropped writes visibly,
  and rethrows for the original game's existing error handling. Healthy writes,
  save keys and game implementations are unchanged.

The other restore fix (`8669176`) landed while this candidate was running. Its
before/after and Web Lock approach is retained conceptually; this candidate adds
unload protection, peer-tab refresh, write-health monitoring, checksum validation,
and single-record commit semantics. Its older pending records remain evidence,
not unverified replay input. The current 50-level Word Trails/Daily code is kept
byte-for-byte.

## Backup contract

Complete exports retain the existing v2 format and separate Word Trails extension,
with an added optional accidental-corruption checksum (not authentication).
Validation rejects incompatible versions, oversized files, reserved control keys,
damaged JSON records, invalid chapter shapes, invalid wallets, and invalid LIVE
Word Trails levels/ledgers before touching progress. Older v1 and checksum-free v2
files remain supported. V1 control records are discarded, never replayed.
Matching imported keys replace saves; absent keys are retained. Native-only older
files never erase Word Trails. Current malformed Word Trails data does not prevent
restoring a valid replacement. Wallet primary/recovery values are restored as one
balance; negative Points remain valid, Tokens stay nonnegative, owned wheels are
unioned, and Trail Coins never convert to Insight Tokens.

Only runtime changes: `index.html` early guard/preload and the existing
`bu-platform-saves-v2.js`. No experimental TEST backup system, game engine, chapter,
Word Trails implementation, audio asset, reward system or other mode is copied.
All other current-main baseline files are checked byte-for-byte (excluding the intentionally updated safety QA, workflow and report).

## Verification / resumption

Automated tests use synthetic disposable profiles, never real player storage.
- `node scripts/qa_issue13_safety.cjs`: model validation, legacy quarantine,
  successful v1/v2 restore, damaged-file checksums, damaged-current-save repair,
  write fault boundaries, crash recovery, conflicts, repeated recovery, cached
  old coordinator, original-file preservation and inline syntax.
- `scripts/qa_issue13_browser.cjs`: real Settings export/file restore in mobile
  Chromium and Linux WebKit at 320×568 and 430×932, v1 compatibility, invalid file,
  interrupted transaction, repeated reload, wallet/Story/Trail persistence/layout.
- `scripts/qa_issue13_resilience.cjs`: peer-tab refresh, stale parent/Word Trails
  iframe writers, silent save failure warning and fail-closed missing script.
- Existing Episode 12 test plus disposable combination with PR #12 for Episodes
  13/14, full Story, Word Trails/audio and unrelated-mode/save parity. The parity
  assertion explicitly allows the intended backup API additions; original mode,
  audio, announcer and wallet comparisons remain intact.

The no-deployment workflow records current results; final run details belong in
this PR. Development logs/artifacts stay under ignored `work/`.

## Independent acceptance still required

Physical Android Chrome and iPhone Safari have NOT been tested here. Linux WebKit
is Safari-engine automation, not iPhone Safari. Verify native Files/Downloads export
and picker behavior, actual touch/audio playback, interruption/relaunch, available
storage/private-mode behavior and final delivered script revision on those phones.
Restore requires HTTPS and Web Locks (current Chrome/Safari); unsupported browsers
receive an explicit error and no progress changes. Already-running old published
pages cannot be retroactively controlled: close old tabs before acceptance/release.
No browser-only save can survive clearing site data or guarantee storage when the
OS/browser refuses it. Failed writes are now visible instead of silent.

Keep LIVE main and Pages publishing unchanged until owner/independent review.
Recovery branch `recovery/live-before-genesis13-14-20261115` remains at `1692945`.
