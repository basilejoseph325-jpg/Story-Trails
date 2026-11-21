# Issue 25 — Genesis13/14 on current LIVE 55

Candidate only. No merge or deployment. Branch
`feature/live-genesis13-14-current-20261121`; recovery checkpoint
`checkpoint/live-55-before-genesis13-14-20261121` and protected main baseline
`f914a311a1913704ce4a6c0cb5e3149b3704939f`.

## Resume checklist

- [x] Read Issue25 and both independent PR12 reviews. Old backup issue13 is
  closed; its historical startup-rollback warning is not the current system.
- [x] Selectively copy approved PR12 `1e2f3636fb054497a4fae65a283401c2ad96e026`:
  2 content JSONs, 24 individual WebPs, 2 art manifests, 3 scoped chapter adapters.
  Do not merge that stale branch or import its obsolete infrastructure.
- [x] Preserve current loader prefix; append ordered compat→13→14 registration.
  Update only the outer/finale cache URLs and Episode13 altar/caption hook.
- [x] Keep Word Trails55 (including pointerup fix), shared wallet, backup
  coordinator, native core, all other modes, art/audio and settings byte-identical.
- [x] Cross-check 24 narration/explanation records with the cited NWT2013
  accounts and Joseph publication. Record source evidence and six HTTP200 source
  captures in `GENESIS13_14_SOURCE_CHECK.json`; no approved text rewritten.
- [x] Check all 28 approved content/art files against their source hashes;
  check adapters identical to PR12 except the scoped request cancellation; decode all24 WebPs at 640×360 in CI.
- [x] Add current-base Chromium/WebKit320/430 native touch, predecessor gates,
  every scene/hint ladder, endings, restart/resume/reload, reward-once and restore
  checks. Exact pass/fail and workflow links are maintained on the new draft PR.
- [ ] Independent ChatGPT review and later physical-device/publication checks.

## Content and artwork

Episode13 covers Genesis34–35 with contextual links to Genesis28:10–19 and
49:5–7. Dinah is not blamed; the harm and retaliation are handled respectfully
without graphic images. Later condemnation and the chapter's record of Isaac's
burial are not invented chronological events. Episode14 covers Genesis37,
including the NWT special robe, dreams, separate Reuben/Judah proposals, twenty
pieces of silver and the 37:36 arrival/sale to Potiphar. NWT footnotes and the
JW.org *Insight—Joseph* article support the source review. This is an assistant
cross-check of approved content, not a claim of fresh independent human approval.

The art inventory is in `GENESIS13_14_RELEASE_MANIFEST.json` and each chapter's
manifest. All 12 scenes per chapter are owner-approved individual 640×360 images;
no new generation, montage or unrelated art. Sensitive/ending images were
visually spot-checked. Episode13 ending hero/background: `g13-d09.webp` (Bethel
altar), “An altar at Bethel”. Episode14: `g14-d12.webp` (Jacob's grief),
“Jacob grieves for Joseph”. Missing source art still has the approved labelled
placeholder path, rather than substituted unrelated imagery.

## Save and wallet compatibility

The approved Story-only adapter retains existing keys and native receipt IDs,
adds verified additive chapter checkpoints so earlier-chapter saves do not drop
unknown/later chapters, recovers purchased hints from durable native receipts,
and reserves reveal rewards before the older native solver runs. It does not
replace the LIVE wallet or backup system. Current coordinated v2 backups,
transaction journal, rollback checks, paired native wallet copies and single
writable-tab protections remain exactly as shipped. No TEST export/restore or
real-player reset is performed.

Old PR12 QA hooked wallet writes after page load. The current coordinator captures
its verified writer before then, so those old hooks no longer inject a failure.
The reused tests now arm a pre-load failure hook, preserving their original
no-charge/no-solve assertions. Full Chromium cases retain all touch wheels;
new Playwright tests use stable visible touch targets, rather than stale raw
coordinates during native layout changes. No letter assertions are bypassed.

The old synthetic “merge two stale candidates” safety job is excluded for this
current-base chapter branch; its obsolete simulation is replaced by actual
current-code chapter tests and full existing save-safety/Word Trails suites.
Existing Episode12 QA changes only its expected registration/card count.
The Trivia gate still pins all approved hashes and exact prior loader bytes,
allowing only this explicit chapter append/finale cache token.

## Review and recovery boundary

Synthetic browser profiles only; no actual owner backup or browser data used.
Chromium/WebKit touch automation is not physical Samsung/iPhone acceptance.
A current full LIVE backup should be exported and older tabs closed before any
later approved publication. Rollback uses the f914a31 checkpoint with a matching
pre-release LIVE backup; do not silently substitute TEST data. Preserve a current
backup before returning to older code that does not register Episodes13/14.
No speculative mass-player migration or new restore format is introduced.

Historical PR12 test results are not counted as current passes. The current draft
PR records exact-head CI results and limitations. Genesis source/art is reused,
not reported as newly authored chapters. Family Fresh Mix, polish and the 45k
TEST grant are excluded; those remain separate release lanes.

## Current-base navigation fix

WebKit wallet/navigation regression exposed an in-flight Episode13 manifest read
being canceled by navigation to Books and reported as an access-control page
error. New chapter content/manifest reads now use a chapter-local AbortController
and are canceled on beforeunload/pagehide; aborts on a departing document are
not reported as chapter failure, and late artwork reads cannot register into
the departing page. Genuine load errors while staying in the game remain visible.
Only this lifecycle change differs in the two approved episode adapters; all
content/art/source and puzzle/hint/reward logic stays unchanged. A delayed-manifest
real navigation test covers both chapters and browsers. No error assertions are
removed from the original wallet suite.
