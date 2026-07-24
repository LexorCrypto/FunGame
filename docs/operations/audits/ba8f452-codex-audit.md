# Codex audit — ba8f452 (FUN-9: wave data)

- **Commit:** `ba8f452` — FUN-9: wave data — 25 waves + endless-cycle modifiers (SPEC §6)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict:** SHOULD FIX — 1 finding, no [P1].

## Findings (verbatim)

- **[P2]** Endless-cycle modifiers skip the Golden Throne. `applyCycleModifiers()` (`src/data/waves.js:73`) returns boss waves unchanged, while SPEC §6 applies cycle modifiers to the cycle containing the Golden Throne. Consequently its projectile speed — and likely its 2.5 s sway period — cannot scale by `1.1^c` / `0.9^c`. Pass cycle modifiers into boss setup or include them in the boss wave definition.

Checks: all 25 table entries, counts, formation-cycle math, and identifiers otherwise match SPEC §6. No lifecycle, security, or secret issues found.

## Disposition

- **[P2] Golden Throne cycle scaling → DEFER.** The Golden Throne (boss 6) is unimplemented (endless-cycle ticket, beyond M4). Boss projectile/sway scaling for the endless cycle belongs with that boss's implementation, which will consume the per-cycle factor at boss-setup time. `applyCycleModifiers` correctly leaves `{ boss }` records structurally untouched (they carry no `rows`/`swayPeriod`/`bulletSpeedMul` to scale); the throne's scaling is the future boss's responsibility. No change in M4.
