# Codex audit — a882ba5 (FUN-17 scoring + HUD + top-10 records)

- **Commit:** `a882ba5` — FUN-17: scoring + HUD + top-10 records (SPEC §9/§1/§4)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 2 findings, no [P1].

## Findings (verbatim)

- **[P2]** `Scoring.js:120`: `addEnemyKill()` ignores `enemy.points`. Roach Queen brood explicitly carries `points = 50`, but because it is always diving, it awards 100—violating SPEC §7.4.
- **[P2]** `Scoring.js:37`: `isHiscore(0)` always returns false. With an empty leaderboard, a zero-score first run still belongs in the top 10, so the required initials/top-10 flow is skipped.

Codex verified with a static + runtime check: `node --check`'d the module, then exercised `addEnemyKill` with a synthetic diving `{type:'cockroach', points:50}` enemy (observed `100`, not the SPEC-documented `50`) and `isHiscore(0)` against an empty table (observed `false`).

## Disposition

- **[P2] Roach Queen brood scoring (100 vs. SPEC-documented 50) → DEFER.** Confirmed real: `BossRoachQueen.spawnBrood()` sets `e.points = 50` with the comment "SPEC §7.4: 50 очков за отродье (задел на будущий скоринг)" — i.e. the field was pre-set anticipating that `Scoring.addEnemyKill()` would consult per-instance `enemy.points` before falling back to the static `ENEMY_POINTS[type]` table, but `addEnemyKill()` (this commit) only ever reads the table via `enemyKillPoints(enemy.type, diving)`, and brood spawn always sets `diveState = 'diving'`, so `cockroach` (50) × diving (×2) = 100. No later commit touches `Scoring.js` (verified: `git log a882ba5..HEAD -- src/systems/Scoring.js` is empty). Genuine minor scoring-accuracy gap, outside the M5/M6 tested boss-kill-count assertions; not a life/HP/game-over-affecting bug. Deferred — fix is a one-line `enemy.points ?? enemyKillPoints(...)` precedence change, better bundled with the next Scoring/RoachQueen touch than as a standalone read-only-audit fix.
- **[P2] `isHiscore(0)` on empty table → DEFER.** SPEC §9 specifies the top-10 storage shape and sort order but does not mandate that a zero score qualifies for an empty leaderboard; treating 0 as "not a record" is a defensible by-design guard against seeding the leaderboard with degenerate 0-score entries from instant deaths. Edge case (empty table + first-run instant death) not exercised by M5/M6 test/smoke coverage. Deferred pending an explicit owner ruling on whether 0 should count.

Both findings are pre-existing, non-blocking gaps confirmed still present at HEAD; neither affects the M5/M6 verified paths (2119 unit tests + 5-boss/full-scene-flow browser smoke, zero console errors).

**Update (close-session):** the Roach Queen brood-scoring [P2] is now **FIXED** in `e2b2aab` — `Scoring.addEnemyKill` honours `enemy.points` (brood = 50 flat, §7.4). The `isHiscore(0)` [P2] remains DEFER (owner ruling).
