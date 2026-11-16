# Genesis Episodes 13 and 14 — LIVE release preparation

**Candidate only. Do not merge or deploy.** Destination: `basilejoseph325-jpg/Story-Trails`, branch `release/genesis13-14-candidate-20261115`. Source: approved Visual Lab TEST main **`59217dc5d6180fcdb7cb246c7de76f8659b31913`**. Existing LIVE main and Pages remain at **`169294536e6bdf3047cd556e8ee0d84a50d9f1ff`**.

## Recovery checkpoint established before editing

Remote [recovery branch](https://github.com/basilejoseph325-jpg/Story-Trails/tree/recovery/live-before-genesis13-14-20261115) points to the exact original LIVE SHA above. Local complete-history bundle: `/workspace/recovery/Story-Trails-before-genesis13-14-1692945.bundle`; `git bundle verify` passed. Bundle SHA-256: `d0c5feee7b2f0437005d8fbf758f5362273cb300c7114da3727555e521fbebee`. Original tree inventory is saved separately in `/workspace/release-evidence/genesis13-14/live-baseline-tree.txt`. A detached, untouched baseline checkout is served only locally for comparative QA. No player backup was imported/restored and no LIVE deployment was triggered. Pages configuration was read and is `legacy`, branch `main`, path `/`; candidate/recovery branches are not the publishing source. Triggered pre-existing workflow paths were audited for writes before pushing.

## Selective transfer and compatibility

- Approved narration, puzzles, 72 contextual hint stages, explanations, Scripture references, two chapter manifests and **24 individually approved 640×360 WebPs** are exact TEST copies. [Source manifest](GENESIS13_14_RELEASE_MANIFEST.json) lists every copied path, source SHA-256 and runtime adaptation. No artwork or biblical content was rewritten.
- Normal `index.html` uses the existing native Story engine. Episode 12 completion unlocks 13; 13 completion unlocks 14. Both Genesis cards, Journey counts, back/Chapters, Next controls, refresh-to-Home, resume/replay/restart, and reward-once IDs are retained. Ending 13 uses **g13-d09 (Bethel altar)** for hero/background, caption **An altar at Bethel**; ending 14 uses **g14-d12 (Jacob's grief)** for both slots, caption **Jacob grieves for Joseph**.
- LIVE lacks TEST's `bu3857ReadSave` and uses a saver that drops entries not yet registered. The new Story-only compatibility module supplies a namespaced reader, additive verified Genesis checkpoints, and recovery of missing in-memory entries from a valid Story checkpoint. It retains original save keys and all unknown chapter entries. Only new chapter opens normalize/recover purchased hint receipts. This is not a replacement backup/import system.
- LIVE menu Continue otherwise starts a legacy chapter. For Episodes 13/14 only, it now returns to the native modern screen and offers the approved confirmed Restart action. New-chapter modal cleanup/focus uses the existing native X handlers. No new modal renderer, sizing engine, audio owner or economy is introduced.
- Existing LIVE loader bytes are preserved with one ordered Story append. HTML changes only the loader cache token. The shared finale gets only the new Episode 13 artwork provider and support for its provided caption; older chapter fallbacks are unchanged. Episode 12 QA changes only its expected card count and waiting for new registration.
- Core transports, Word Trails (including its original 30 levels), native settings/backup coordinator, rewards/wallet/entitlements, premium SFX, announcers, Daily/Trivia/Family Worship/Books, existing artwork and other pre-existing files remain byte-identical. Integrity QA verifies **417 untouched baseline files**, the three narrowly changed runtime files and the one count-only QA fixture. No TEST banner, TEST backup pipeline, Word Trails 31–50, isolated preview page or unrelated experiment is transferred.

## Actual automated results

- [x] Full source/integrity and syntax checks: 28 exact source files, 24 WebP checksums/byte counts; full Pillow decode at 640×360; five original core transports and 237 inline scripts compile.
- [x] Episode 13: all 12 wheels with actual Chromium touch taps, wrong guesses, all contextual hints at 0/15/25 Tokens, reward-once/reveal-once, wallet-write failure and purchased-clue recovery, reload/resume, menu Continue/Restart, replay, completion, Bethel ending art/caption and real Next to Episode 14 at **320×568 and 430×932**.
- [x] Episode 14: all 12 wheels with actual touch taps, wrong guesses, all hints, exact 250-Point/60-Token chapter bonus, reveals/replays, native save/recovery, navigation and grief ending hero/background at **320×568 and 430×932**. Both chapters also passed a real CDP touch-swipe path.
- [x] Existing Episode 12: all 13 discoveries/images, hints, reload/resume/replay at 320×568 and 390×844; existing boundary/art checks remain separate. Native Episode 12 ending→13 is checked through its actual button in preservation QA; 13 ending→14 is checked after real puzzle completion in Episode 13 QA.
- [x] All Story: **117 modern + 84 legacy = 201 discoveries and 20 completion paths**, at 320×568 and 430×932; no active-control overflow or missing scene art. Original older finale art is compared to the untouched LIVE baseline, not TEST's different renderer.
- [x] Baseline/candidate mode, native settings and save parity: Trivia wrong/correct retry, Family Worship answer, Word Trails entry, Word Builder, Watch, rewards/help navigation; negative Points, native Tokens, purchased/equipped Ocean Glow and unrelated data retained. New Story checkpoints survive an earlier-chapter save. Read-only `makeBackup` includes the Story checkpoint without writing storage.
- [x] Delayed Episode 14 registration preserves an existing Episode 14 checkpoint. Synthetic corrupt-primary Story reads use the valid checkpoint and retain earlier Episode 12 progress. These are fresh-profile checkpoint reads, **not import/restore transactions**; no rollback journals are seeded.
- [x] Word Trails normal LIVE Main Settings, native SFX/volume propagation, original announcer delegation, curved Ocean Glow/halo/mist/glitter, unchanged progress/rewards, and no overflow passed on baseline and candidate at 390×705 and 320×568. The newer TEST advanced-feel shortcut/ownership assertions were first tried and failed on untouched LIVE; release QA instead tests the actual LIVE entry and its original behavior. No Word Trails code was changed.
- [ ] Hosted candidate CI: see the release PR's current head checks. Workflow has read-only repository permissions and no merge/deploy step.
- [ ] Independent ChatGPT/owner review and physical iPhone/Safari acceptance. **No physical phone is claimed tested.** Chromium viewports and API/audio-control checks do not prove audible device behavior or Safari compatibility.

## TEST backup/Settings investigation and remaining risks

Four checks at TEST `59217dc` failed in their shell prerequisite loop **before browser safety assertions**, demanding the literal outer loader token `visual-lab-test-banner.js?v=20261113-native-import-paused-v35`:

| Check | Run | Actual result |
|---|---|---|
| Verified backup preview v34 | [43783720916](https://github.com/basilejoseph325-jpg/Bible-Unfolded-Visual-Lab/actions/runs/43783720916) | “public TEST read-only v34 file picker not yet deployed” |
| Native Settings import suspended v35 | [43783720942](https://github.com/basilejoseph325-jpg/Bible-Unfolded-Visual-Lab/actions/runs/43783720942) | “published TEST v35 old import gate not yet deployed” |
| External-page writer guard v32 | [43783720994](https://github.com/basilejoseph325-jpg/Bible-Unfolded-Visual-Lab/actions/runs/43783720994) | “published native external-writer guard not yet deployed” |
| Cold legacy migration review v33 | [43783720995](https://github.com/basilejoseph325-jpg/Bible-Unfolded-Visual-Lab/actions/runs/43783720995) | “public TEST v33 bootstrap not published” |

Investigation found **a stale prerequisite, not missing deployed code**: current repository and published TEST files match byte-for-byte. The outer loader intentionally uses the later `20261114-books-chrome-route-v4` token. Its banner still loads the coordinator with `20261113-native-import-paused-v35`, and that coordinator contains all the expected functions. A passive published TEST browser probe confirmed `BUPlatformSaves.bound()`, the read-only preview, `verifyCurrentBackupCopy`, `previewRestoreReview`, `externalChangeStatus`, `legacyTransitionStatus`, and the native Import accessibility label **“Review TEST backups; restore is temporarily disabled”**. No picker, import, apply or restore action was requested. The initial passive probe hit the execution browser's certificate-authority limitation; it was repeated in a disposable test browser accepting that certificate, with the three source hashes independently checked by HTTPS. These findings do not turn the four failed workflow runs into passes; their stale token assertions need separate TEST maintenance.

**LIVE's existing backup risk is real and separate:** its unchanged `bu-platform-saves-v2.js` loads through `word-trails-live-bootstrap-v1.js`. It still permits confirmed version-2 imports and delegates version-1 imports to the original native handler. `recoverPending()` runs at startup and can rewind every entry from a previous-only interrupted-import journal without comparing current values against trusted AFTER values. An old journal could therefore overwrite newer progress. This release does not import TEST's newer global backup experiments, disable/replace existing Settings, apply a backup, or exercise that destructive recovery path. **Backup/import safety is not certified.** A separate reviewed hardening decision is needed before relying on restore/recovery for a release.

TEST and LIVE also share the GitHub Pages browser-storage origin. Older already-open pages/API writers can still write canonical keys without a global lock. The additive candidate saver protects unknown Genesis entries in the updated page; it cannot stop unmodified old tabs or restore writers. Closing/reloading old tabs before eventual promotion deserves explicit review, not a promise of universal concurrency safety.

**Inherited visual limitation:** the original LIVE finale provider recognizes Genesis 7–9 only. Original Episodes 10–12 consequently lack its cinematic hero/background on the baseline and candidate. A first TEST-oriented expectation failed on Episode 10; comparison against untouched LIVE reproduced it, and full regression now explicitly checks preservation. New Episodes 13/14 have their required approved ending art. No unrelated old finale redesign is included.

**Review status:** the scoped candidate is prepared for independent review; it is not deployment-approved. Physical iPhone/Safari (and physical Android visual/audio acceptance), independent review of compatibility and backup risks, and owner approval remain open. Nothing is merged or published. Recovery is by the verified original commit/branch/bundle, not a player-data restore operation.

## Exact changed-file inventory

The complete inventory below includes QA and documentation. `M` is an existing file with a narrow edit; `A` is a new file. The source manifest supplies exact hashes for the 28 copied content/art files. New runtime adapters preserve the approved TEST chapter logic with only destination guard/metadata and namespaced save-reader substitutions.

```text
A .github/workflows/qa-genesis13-14-release-candidate.yml
A docs/GENESIS13_14_RELEASE_MANIFEST.json
A docs/GENESIS13_14_RELEASE_REVIEW.md
M index.html
M journey-progress-caption.js
M scripts/qa_genesis12_native.cjs
A scripts/qa_release_genesis13.cjs
A scripts/qa_release_genesis14.cjs
A scripts/qa_release_integrity.cjs
A scripts/qa_release_preservation.cjs
A scripts/qa_release_story_regression.cjs
A scripts/qa_release_word_trails_audio.cjs
A story-adventure-art/genesis13/g13-d01.webp
A story-adventure-art/genesis13/g13-d02.webp
A story-adventure-art/genesis13/g13-d03.webp
A story-adventure-art/genesis13/g13-d04.webp
A story-adventure-art/genesis13/g13-d05.webp
A story-adventure-art/genesis13/g13-d06.webp
A story-adventure-art/genesis13/g13-d07.webp
A story-adventure-art/genesis13/g13-d08.webp
A story-adventure-art/genesis13/g13-d09.webp
A story-adventure-art/genesis13/g13-d10.webp
A story-adventure-art/genesis13/g13-d11.webp
A story-adventure-art/genesis13/g13-d12.webp
A story-adventure-art/genesis13/manifest.json
A story-adventure-art/genesis14/g14-d01.webp
A story-adventure-art/genesis14/g14-d02.webp
A story-adventure-art/genesis14/g14-d03.webp
A story-adventure-art/genesis14/g14-d04.webp
A story-adventure-art/genesis14/g14-d05.webp
A story-adventure-art/genesis14/g14-d06.webp
A story-adventure-art/genesis14/g14-d07.webp
A story-adventure-art/genesis14/g14-d08.webp
A story-adventure-art/genesis14/g14-d09.webp
A story-adventure-art/genesis14/g14-d10.webp
A story-adventure-art/genesis14/g14-d11.webp
A story-adventure-art/genesis14/g14-d12.webp
A story-adventure-art/genesis14/manifest.json
A story-adventure-content/genesis-episode13-bethel-v1.json
A story-adventure-content/genesis-episode14-joseph-v1.json
A story-adventure-episode13-release.js
A story-adventure-episode14-release.js
A story-adventure-release-compat.js
M story-chapter-complete-v2-test.js
```
