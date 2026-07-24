# Codex audit — 874397f (FUN-13: boss 3 Super-Kakaha)

- **Commit:** `874397f` — FUN-13: boss 3 Super-Kakaha — plop telegraph + wave-puddle with gap + phase-2 radial splash (SPEC §7.3)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL as an isolated commit — 1 P1 (single-commit-audit artifact, resolved by the follow-up integration commit) + 2 P2 (genuine, deferred).

## Findings (verbatim)

Verdict: FAIL

- [P1] `BossSuperPoop` is never imported or registered in `main.js`. Wave 15 follows `WaveDirector`'s missing-factory path, permanently blocking campaign progress with the "СКОРО" banner.
- [P2] `plopTimer` advances only while idle (`BossSuperPoop.js:69`). Including the 3.3-second sequence, plops occur every 9.3s/7.3s—not the SPEC-required 6s/4s.
- [P2] `stepSequence()` runs before the `attacksPaused` check (`BossSuperPoop.js:47–66`), so an in-progress fall can create waves and phase-2 projectiles during the required 1-second phase-transition attack pause.

## Disposition

- **[P1] `BossSuperPoop` not registered in `main.js` → ACCEPTED as by-design (NOT a defect).** Same precedent as `ed4258d-codex-audit.md` and `91a33d7-codex-audit.md`: registration lands in the follow-up integration commit `eff2c01` ("M5: wire bosses 2-5 factories..."), confirmed present at HEAD (`main.js:157` — `superPoop: () => new BossSuperPoop(...)`). Artifact of single-commit isolation, not an ongoing bug.
- **[P2] plop cadence is 9.3s/7.3s, not SPEC's 6.0s/4.0s → DEFER (owner interpretation call).** Genuine, verified: `plopTimer` only accumulates while `sequenceState === 'idle'` (`BossSuperPoop.js:69-74`), and the telegraph (1.0s) + fall (0.3s) + return (2.0s) sequence adds 3.3s before the timer resumes — real cadence between plop starts is `plopInterval + 3.3s` (9.3s phase 1 / 7.3s phase 2) vs. SPEC §7.3's literal "Плюх каждые 6.0 s". Whether SPEC's "каждые 6.0 s" means idle-cooldown-only or full-cycle-period is genuinely ambiguous text, comparable in kind to the already-accepted `LANDING_Y`/stomp-interval/wander-range interpretation calls recorded in status.md. Does not break the encounter, only changes pacing; deferred for owner ruling rather than a unilateral pacing change.
- **[P2] `stepSequence()` bypasses `attacksPaused`, so an in-flight fall's impact (wave/splash) can land during the transition pause → DEFER.** Same intentional-movement-not-gated convention as `BossBigMacaque` (91a33d7): the code comment (`BossSuperPoop.js:49`) explicitly states movement runs independent of `attacksPaused`, and `onImpact()` (spawning the wave/splash) is invoked from within that unconditional step. Minor edge case (only an already-started fall can complete during the pause window); same disposition as BigMacaque's landing-during-pause finding — revisit together in a dedicated cross-boss pause-gating pass, not a one-off patch.

Work is already verified: M5 = 2119 node unit-tests + browser smoke of all 5 bosses (zero console errors).
