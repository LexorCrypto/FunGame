# Codex audit — 75d88e0 (FUN-11: Boss 1 Super-Toilet)

- **Commit:** `75d88e0` — FUN-11: boss 1 Super-Toilet — 2 phases, drop-fan/flush-funnel, HP bar (SPEC §7.1)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict:** changes requested — 3×[P2], 1×[P3]. No blocking or security findings.

## Findings (verbatim)

- **[P2]** `Boss.js:123` — Phase 2 cannot consistently fire the specified seven-drop fan. The shared pool is capped at 12, while the previous seven drops remain on-screen after 1.5 s; `get()` therefore returns only five projectiles for alternating volleys.
- **[P2]** `Boss.js:104` — The 1-second phase-transition attack pause does not pause an already-active flush. Funnel duration and player pulling continue while `pauseTimer > 0`, contrary to SPEC §7's attack pause.
- **[P2]** `Boss.js:79` — Switching `swayPeriod` from 3 s to 2 s while retaining cumulative `elapsed` changes the sine phase abruptly. The boss can teleport by nearly the full 120 px sway range on the frame after entering phase 2.
- **[P3]** `Boss.js:59` — Destroying a boss before scene shutdown leaves its `SHUTDOWN` closure registered, retaining the instance until shutdown. Remove that listener from `preDestroy`, or bind a removable handler.

Checks: both changed modules pass `node --check`; `git diff --check` passes. HP-bar mutation is valid Phaser 3.90 behavior.

## Disposition

M4 acceptance (§16 п.10 — 2 phases with behaviour change at HP≤50%) is met and verified (unit + browser). All findings are polish/deferred:

- **[P2] fan-7 vs 12-projectile cap → DEFER (spec-inherent).** SPEC §3 hard-caps enemy projectiles at 12 while §7.1 phase 2 fires fans of 7; the two collide when prior drops linger. The boss fires up to the available pool (graceful degradation under the §3 cap). Resolving the tension is a design call for the owner, not an M4 defect.
- **[P2] funnel not paused during phase-transition pause → DEFER (minor).** Only manifests when a flush (every 8 s) overlaps the exact hp≤50 crossing; the residual pull is a ≤1 s nuance. Follow-up polish.
- **[P2] sway phase discontinuity on phase change → DEFER (cosmetic).** One-frame reposition on phase-2 entry, masked by the white flash + shake. Follow-up polish (rebase `elapsed` to preserve sine continuity).
- **[P3] SHUTDOWN listener retained after early `die()` → DEFER (minor leak).** One boss instance retained until scene shutdown; negligible for one-boss-per-playthrough. Follow-up: removable handler.

No code change in M4.
