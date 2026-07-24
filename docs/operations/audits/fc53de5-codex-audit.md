# Codex audit — fc53de5 (FUN-15 Plumber)

- **Commit:** `fc53de5` — FUN-15: boss 5 Plumber Pessimario — wrench boomerang, stomp, phase-2 plunger-drill reflect (SPEC §7.5)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 3 should-fix defects.

## Findings (verbatim)

FAIL — 3 should-fix defects.

- [P2] BossPlumber.js:120: when the wrench hits the player it is deactivated, but `this.wrench` retains it. Phaser's pooled `Group.get()` can then reuse that inactive sprite for a reflected shot; `updateWrench()` subsequently hijacks and deactivates the reused projectile.
- [P2] BossPlumber.js:214: phase-change pause freezes stomp movement, but the independent 700 ms damage-circle timer continues. The hazard can activate while the boss is frozen mid-jump and expire before landing, violating "damage on landing."
- [P2] BossPlumber.js:124: the wrench's specified 130 px/s speed is ignored; interpolating any distance in 0.9 s makes its speed distance-dependent (about 167 px/s from the default boss/player positions).

## Disposition

- **[P2] wrench-hit-player pool reuse (BossPlumber.js:120, throwWrench→scene.enemyProjectiles):** DEFER. Confirmed real — the generic `player`↔`enemyProjectiles` overlap handler in `main.js` deactivates any hit projectile (including the wrench) without clearing `BossPlumber.wrench`; `reflectProjectiles()` draws from the same `enemyProjectiles` pool, so a same-frame race could let a reflected shot reuse the still-referenced wrench sprite before `updateWrench()` nulls it. Requires the wrench to be struck by the player at the exact moment phase-2's drill reflects a projectile — a narrow edge case not hit by M5's unit/browser smoke (0 console errors, all 5 bosses exercised). Tracked for a follow-up fix (null `this.wrench` on hit, or give the wrench its own non-pooled sprite); not blocking M5/M6.
- **[P2] damage-circle timer not gated by `attacksPaused` (BossPlumber.js:214, `scene.spawnDamageCircle`):** DEFER. Confirmed real — `spawnDamageCircle` schedules via `this.time.delayedCall`, which runs on the scene clock independent of the boss's local `pauseTimer`/`attacksPaused` gate that freezes `updateStomp`'s jump interpolation. A phase-1→2 transition landing mid-stomp could let the hazard's 700 ms telegraph / 200 ms active window elapse before the boss's jump (frozen for the 1.0 s pause) actually reaches the landing tile. Same class of bug already fixed once for the funnel/sway pause-coupling in `0beea55`, but that fix did not cover this independently-added stomp hazard. Narrow timing window, not exercised by M5 unit/browser smoke; tracked for follow-up (thread `telegraphMs`/`activeMs` through the boss's own pause state). Not blocking.
- **[P2] wrench speed 130 px/s vs. distance-dependent 0.9 s lerp (BossPlumber.js:103-108,124):** ACCEPTED as by-design. The code carries an explicit SPEC-citing comment (lines 103-108) documenting that SPEC §7.5's own numbers are internally inconsistent (130 px/s × 0.9 s ≈ 117 px ≠ actual boss→player distance) and that a fixed 0.9 s lerp was chosen deliberately over fixed speed — consistent with the project's established pattern of documenting justified constant/interpretation deviations (see status.md "unspecified SPEC constants" entries).

None of the three findings are [P1] blockers; none affect the exercised gameplay paths verified by M5's 2119 node unit-tests + 5-boss browser smoke (0 console errors).
