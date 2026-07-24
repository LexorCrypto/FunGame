# Codex audit — 91a33d7 (FUN-12: boss 2 Bolshaya Makaka)

- **Commit:** `91a33d7` — FUN-12: boss 2 Bolshaya Makaka — 2 phases, jump parabola + landing telegraph + arced drops (SPEC §7.2)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL as an isolated commit — 2 P1 (both are single-commit-audit artifacts, resolved by the follow-up integration commit) + 1 P2 (genuine, minor edge case).

## Findings (verbatim)

FAIL — wave 10 is not playable in this commit.

- [P1] `BossBigMacaque` is never imported or registered in `main.js`; `WaveDirector` therefore leaves wave 10 permanently blocked as "COMING SOON."
- [P1] `BossBigMacaque.js:131` calls `scene.spawnDamageCircle`, but no such method exists at `91a33d7`; instantiating the boss crashes on its first jump.
- [P2] `BossBigMacaque.js:64` processes jumps and schedules landing damage before checking `attacksPaused`. Landing attacks can therefore damage the player during SPEC §7's mandatory 1-second phase-transition attack pause.

## Disposition

- **[P1] `BossBigMacaque` not registered in `main.js` → ACCEPTED as by-design (NOT a defect).** Same pattern already established and accepted in `docs/operations/audits/ed4258d-codex-audit.md` (per-boss commits land standalone; factory registration lands in a dedicated wiring commit). Registration lands in the follow-up integration commit `eff2c01` ("M5: wire bosses 2-5 factories + scene damage-zone helper + boss-defeated cleanup"), confirmed present and correct at HEAD (`main.js:156` — `bigMacaque: () => new BossBigMacaque(...)`). This is an artifact of auditing a single commit in isolation from a stacked commit series, not an ongoing bug.
- **[P2] landing damage scheduled unconditionally in `startJump()` (BigMacaque.js:127-135), bypassing `attacksPaused` → DEFER.** Genuine, verified: the code's own comment (`BigMacaque.js:65-66`) states state-stepping (hover/jump) runs every frame unconditionally and only new projectile fire is gated by `attacksPaused`. Since a jump already in flight when a phase transition begins still lands and schedules `spawnDamageCircle` via `scene.time.delayedCall`, the boss can deal landing damage inside the 1s phase-transition pause window. This is the same category of edge case found in `BossSuperPoop` (874397f: fall/impact bypassing `attacksPaused`) — both stem from the shared "movement isn't gated, only new-attack starts are" convention across boss files. Cosmetic/minor (only the tail of an already-started jump can land during the pause), not blocking. Revisit in a dedicated cross-boss pause-gating pass rather than a one-off patch.

Work is already verified: M5 = 2119 node unit-tests + browser smoke of all 5 bosses (zero console errors).
