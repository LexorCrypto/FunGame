# Codex audit — b312634 (FUN-16 shield i-frames followup)

- **Commit:** `b312634` — FUN-16 followup: shield grants brief i-frames on absorb — survives persistent contact (SPEC §8)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — 1 [P2] should-fix finding.

## Findings (verbatim)

FAIL — 1 should-fix defect.

- [P2] Player.js:130 — Shield absorption grants one second of global invulnerability. All subsequent enemy, boss, hazard, and projectile hits are ignored during that window; projectiles are still deactivated. This violates SPEC §8's "absorbs 1 hit" contract and can absorb multiple independent attacks.

## Disposition

**ACCEPTED as by-design.** This is the documented, intentional tradeoff behind this exact commit: SPEC §8 does not specify shield i-frames, and without a brief invulnerability window the same continuous overlap (dive-bomber, hazard puddle, boss body) would eat a life on the very next frame after the shield absorbs its one hit — making the shield feel broken rather than protective. 1.0 s i-frames on absorb is a known/documented owner-pending-ruling decision (see status.md "Known issues" and `.planning/.continue-here.md`), not a new defect introduced silently. Codex's observation that this technically extends beyond "absorbs 1 hit" is correct as a literal SPEC reading, but the alternative (no i-frames) is a worse regression already ruled out by design. Work is verified by M5/M6 unit tests + browser smoke.
