# Codex audit — ed4258d (FUN-10: WaveDirector)

- **Commit:** `ed4258d` — FUN-10: WaveDirector — feed waves 1-25 into formation, wave/act/boss banners (SPEC §6/§14)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** ITERATE — 1 blocking bug and 4 should-fix findings. No security issues or secrets.

## Findings (verbatim)

- **[P1]** Campaign permanently soft-locks at wave 10. The factory registers only `superToilet` (`main.js:93`); missing bosses enter an infinite banner state with no retry or advancement (`WaveDirector.js:119`). Consequently waves 10–25 and Endless are unreachable.
- **[P2]** Combat runs during transition banners. Boss updates are unconditional while the banner timer is active (`WaveDirector.js:199`), and formation/player updates also continue. Super-Toilet fires after 2 s — before its 3 s warning ends — and wave 6 can begin diving during the combined 4.5 s act/wave banners.
- **[P2]** Wave spawning leaks inactive game objects indefinitely. Each wave constructs new enemies (`WaveDirector.js:167`), but deaths only deactivate them; they remain in the physics group / display list. Defeated bosses are similarly discarded by reference without destruction (`WaveDirector.js:219`). Endless mode would grow these collections without bound.
- **[P2]** All added banner and boss strings are hardcoded Russian (`WaveDirector.js:88`), contrary to SPEC §15's requirement that every string come from `src/data/i18n.js`.
- **[P2]** Boss-wave music required by SPEC §14 is never started or switched in the boss branch (`WaveDirector.js:103`).

Checks: `git diff --check` passes; `node --check` on all three changed files passes.

## Disposition

M4 acceptance (§16 п.5 — wave composition matches table §6) is met and verified (unit + browser). Dispositions:

- **[P1] soft-lock at wave 10 → ACCEPTED as intended M4 boundary (NOT a defect).** This is the deliberate, review-mandated "unavailable boss" state: bosses 2–6 are out-of-scope future tickets (FUN-14…19), and the project's own review explicitly required that an unimplemented boss enter an explicit unavailable state — **never** thrown, **never** treated as cleared/skipped. Wave 10 is the current content frontier of an in-development game (M4 of M9); full progression unblocks as FUN-14…19 register their bosses in the factory. Downgraded from [P1] with rationale; does not block the close.
- **[P2] combat during transition banners → DEFER (design).** SPEC §14 freezes the world only for Pause; wave/act/boss banners are overlays (Galaxian-style entry). Gating gameplay behind banners is a polish decision for the owner, not a §16 requirement.
- **[P2] inactive-object accumulation → DEFER (cross-cutting lifecycle).** Enemy `die()` deactivates (established in FUN-6/7/8); proper destroy/pooling spans the whole enemy lifecycle and risks the dive-return contract. Revisit as a dedicated pooling/cleanup task before endless is shippable.
- **[P2] hardcoded RU strings → DEFER (i18n ticket).** `src/data/i18n.js` does not exist yet (§15, FUN-18); the strings are commented as temporary and will move to i18n with that ticket.
- **[P2] boss-wave music → DEFER (audio milestone).** No audio is wired yet (§12, FUN-22 ElevenLabs generation, not reached). Music start/switch lands with the audio milestone.

No code change in M4; deferrals recorded in `status.md` known-issues.
