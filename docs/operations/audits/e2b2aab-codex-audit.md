# Codex audit — e2b2aab (FUN-17 followup: brood scoring)

- **Commit:** `e2b2aab` — FUN-17 followup: Roach Queen brood scores fixed 50, not 100 (SPEC §7.4)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** PASS — no findings.

## Disposition

Clean. Fixes the [P2] surfaced auditing `a882ba5`/`61ec271`: `Scoring.addEnemyKill` now honours per-instance `enemy.points` (brood = 50 flat, §7.4) before the §4 table×2. Verified: +2 node unit-тестa (brood diving = 50, regular diving cockroach = 100).
