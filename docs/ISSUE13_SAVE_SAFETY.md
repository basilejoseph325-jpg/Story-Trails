# Issue 13 — permanent safe backup restores, not a disabled Restore button

**STAGED DRAFT. Do not merge into LIVE until final tests and review pass.**
This candidate replaces PR #15's temporary disabled-restore policy while retaining its early old-code protection. This candidate is independent of Word Trails 50/Daily PR #16 and Genesis 13/14 PR #12.

## The actual issue

The old LIVE backup system wrote a version-1 rollback record containing only PREVIOUS values. When reopening the game, it could use those old values to overwrite newer saved Story, Rewards, wheel or Word Trails progress.

## Permanent safe fix

- Both **old version-1 and current version-2** Bible Unfolded backup files can be imported through the original Settings controls. An older file is normalized into the same fully validated restore path; its old rollback records are excluded.
- Each new restore prepares a **version-3 before-and-after transaction journal** and verifies that it is durable before changing a game key. Restores are run inside an exclusive Web Lock on browsers that support it; browsers without this protection fail closed, without touching any game data.
- Each write checks that the current key still matches the exact BEFORE value. A tab that changed progress stops the restore. The completed marker is tied to a unique transaction identifier, not the previous ambiguous bare `yes` marker.
- If interrupted before commit, recovery may undo only keys that still exactly match the attempted AFTER value. If any saved value differs from BOTH before and after, recovery retains the record and **does not overwrite newer data**. Repeated reloads do not trigger a blind rollback.
- If all AFTER values match a transaction-bound committed marker, recovery verifies success and cleans up. Original previous-only journals and orphan markers remain **read-only evidence**; they are never replayed or erased.
- Transaction/recovery metadata is excluded from ordinary backups. The original native wallet remains authoritative. Existing paid wheel ownership is unioned; Word Trails Trail Coins are not converted to native Insight Tokens.
- Normal saving, playing, downloading progress, Import/Restore (v1 and v2), Settings, coins and rewards are retained. A separate backup-recovery details panel is visible only when relevant.
- The early safety gate from PR #15 stays in the original HTML: old cached unsafe coordinator code cannot run on a newly loaded page. The new verified coordinator captures Import/Export before that document-level gate once bound. If the coordinator fails to load, the old gate safely blocks restore, but play continues.

## Honest limits

An already-open *old* browser tab can continue running already-loaded old code. No static update can erase JavaScript running in another tab. Close stale game tabs once when switching to this release. If a different tab changes a value during a restore, the game prefers preserving the new value over guessing a rollback. In that rare case, it retains evidence for review rather than fabricating a recovery.

The old 1MB+ game source is not replaced or modified beyond the early guard already supplied by PR #15. That guard's loader cache token is unchanged, since PR #15 has never shipped to LIVE; the file served at that previously unused token is this permanent implementation.

## Final release verification

Automated safety tests:
- Previous-only, malformed, orphan, committed and future-format old journals cause **zero changes** to saved game values.
- Full version-1 and version-2 imports can be applied, with a durable before/after journal and cleanup.
- Write interruption, prepared/committed transaction recovery, missing Web Locks, malformed input, a competing newer saved value, old coordinator cache behavior and idempotent reload.
- Real disposable Chromium phone profiles (320px and 430px): original Import/Export settings, version-1 and version-2 backup, 30-level Word Trails, old journal, Story checkpoints, native economy, reload.
- Existing Episode 12 regression plus combined safe coordinator and Genesis 13/14 PR #12 touch gameplay. No player data read or written.

The safety PR must be reviewed independently of the Word Trails feature candidate; after passing checks, merge the safety repair first, then rebase/refresh and verify Word Trails before its own LIVE promotion.
