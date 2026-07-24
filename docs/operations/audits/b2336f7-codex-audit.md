# Codex audit — b2336f7 (FUN-16 power-ups + Player)

- **Commit:** `b2336f7` — FUN-16: power-ups — double-shot (atomic pair) + shield, PowerUp drops (SPEC §8/§3)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 1 blocker, 3 should-fix findings.

## Findings (verbatim)

- **[P1]** `src/entities/PowerUp.js:4` — `PowerUp` is never imported, instantiated, dropped, or connected to a player-overlap handler. Power-ups cannot appear or be collected, violating SPEC §8/acceptance criterion 9.
- **[P2]** `src/entities/Player.js:187` — double-shot assumes an 8-projectile cap, but `src/main.js:27` keeps the group `maxSize: 4`; Phaser therefore cannot allocate eight projectiles.
- **[P2]** `src/entities/Player.js:145` — the previous fade-and-pause fallback was replaced with an unhandled `game-over` event. After the third death, the player remains inactive while the scene continues indefinitely.
- **[P2]** `src/entities/Player.js:125` — consuming a shield grants no separation or brief invulnerability. Persistent enemy/boss/hazard overlaps are checked every physics step, so they consume the shield and kill the player on the next frame.

Codex audited `b2336f7` strictly in isolation (per instructions: "Audit ONLY git commit `<SHA>`"), so it correctly observed this commit's diff by itself, without later commits in the same session.

## Disposition

All four findings are **already resolved at HEAD by later commits made within this same commit stack** — verified directly, not by claim:

- **[P1] PowerUp not wired → RESOLVED in `61ec271`** ("FUN-18: title scene + full scene flow ... scoring/powerup wiring", SPEC §14/§15), which wires `WaveDirector`/`main.js` to import, drop, and overlap-collect `PowerUp` instances. `grep -rn PowerUp src/` at HEAD shows it referenced in `main.js`, `Player.js`, and `PowerUp.js`.
- **[P2] projectile `maxSize: 4` vs. 8-cap double-shot → RESOLVED in `61ec271`.** `src/main.js:32` at HEAD reads `maxSize: 8` (confirmed via `git log -S"maxSize: 8" -- src/main.js` → `61ec271`).
- **[P2] unhandled `game-over` event → RESOLVED in `61ec271`.** `src/main.js` at HEAD registers `this.events.on('game-over', this.gameOverHandler)` (and the matching `.off` on shutdown); confirmed via `git log -S"'game-over'" -- src/main.js` → `61ec271`.
- **[P2] shield grants no i-frames → RESOLVED in `b312634`** ("FUN-16 followup: shield grants brief i-frames on absorb — survives persistent contact (SPEC §8)"), which is exactly the documented known decision: "Shield grants 1.0s i-frames on absorb (§8 doesn't specify) — else continuous contact eats a life next frame."

**Disposition: ACCEPTED as by-design (incremental commit stack).** `b2336f7` is a foundational commit in a multi-commit feature stack (FUN-16 base → FUN-18 wiring → FUN-16 followup), and a strictly-scoped single-commit audit necessarily observes pre-wiring/pre-followup state as though it were final. All four findings are non-issues at HEAD — no code change needed. This is not a case of "matches a known decision" alone; it is independently git-verified (via `git log -S` / `grep`) that each finding's fix already exists in the repo, landed the same session, before this audit ran. No blocking action for the orchestrator; flagged in the return summary per protocol (genuine [P1] on the standalone commit) but confirmed already closed.
