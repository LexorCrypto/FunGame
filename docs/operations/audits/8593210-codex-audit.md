# Codex audit — 8593210 (FUN-14: boss 4 Roach Queen)

- **Commit:** `8593210` — FUN-14: boss 4 Roach Queen — crawl + immediate-dive brood spawner, cap + armored phase 2 (SPEC §7.4)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 1 P2 (matches an already-documented, accepted cross-cutting DEFER).

## Findings (verbatim)

Verdict: **FAIL — 1 P2**

- **[P2] Retired brood leaks game objects** — `BossRoachQueen.js:67`. Killed/offscreen offspring are spliced from `this.brood` without `destroy()`, so `onCleanup()` can no longer reach them while `scene.enemies` retains them. A prolonged fight accumulates objects indefinitely. Phaser treats `setActive(false)` as temporary removal; destroy or pool them.

## Disposition

- **[P2] brood spliced-not-destroyed, inactive objects accumulate → ACCEPTED as by-design (matches known cross-cutting DEFER).** Verified against `BossRoachQueen.js:62-70`: `updateBrood()` splices dead/offscreen brood out of the tracking array on `!e.active`, without calling `destroy()` — identical in kind to the existing `[P2] inactive-object accumulation → DEFER (cross-cutting lifecycle)` finding already recorded and accepted in `docs/operations/audits/ed4258d-codex-audit.md` (established convention since FUN-6/7/8: `die()` deactivates, doesn't destroy). This is not a new regression introduced by this commit — Roach Queen's brood simply extends the same existing enemy-lifecycle pattern used across the whole game. Proper destroy/pooling remains a dedicated cross-cutting cleanup task before endless mode is shippable, per the prior audit's disposition; does not block this commit.

Work is already verified: M5 = 2119 node unit-tests + browser smoke of all 5 bosses (zero console errors).
