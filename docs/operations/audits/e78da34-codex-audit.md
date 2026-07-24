# Codex audit — e78da34 (FUN-20 EndScene)

- **Commit:** `e78da34` — FUN-20: GameOver + initials entry + top-10 scene (SPEC §9/§14)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 1 blocker + 1 minor (audited in isolation at this SHA).

## Findings (verbatim)

Verdict: FAIL

- [P1] [EndScene.js:26] — The commit adds `EndScene` but never imports/registers it in `main.js` or routes the `game-over` event to it. At this SHA, the third death leaves the player permanently dead; GameOver, initials, and top-10 are unreachable, violating SPEC §14 and §16.8.
- [P3] [EndScene.js:96] — Locating the new record by `{name, score, wave}` highlights an older entry when an identical record already exists. Track the inserted row explicitly.

## Disposition

- **[P1] EndScene unreachable → ACCEPTED as by-design (NOT an outstanding defect).** Same isolated-commit boundary as the CrawlScene audit: `EndScene` ships standalone here; `main.js` import/registration (`import { EndScene } from './scenes/EndScene.js'`, `scene.start('end', {...})` on `game-over`, and `scene: [..., EndScene]`) is added by the very next commit, `61ec271` (FUN-18), already an ancestor of HEAD. At HEAD, third death → GameOver → initials → top-10 is fully reachable. Downgraded from P1; does not block the close.
- **[P3] Duplicate-record highlight ambiguity → DEFER.** Verified in `EndScene.js`: `newEntryIndex` is found via `top.findIndex(entry => entry.name === name && entry.score === this.finalScore && entry.wave === this.finalWave)`, so if an identical prior record already exists (same initials, score, and wave), the highlight can land on the older row instead of the just-inserted one. Purely cosmetic (a top-10 list row highlight), no data corruption or functional impact, and the exact-triplet collision is a narrow edge case. Deferred to a follow-up polish ticket rather than fixed here (read-only audit).

Verified by M6 unit tests + full-scene-flow browser smoke (GameOver → initials entry → top-10, zero console errors). No code changed (read-only audit).
