# Codex audit — 4416837 (M6 docs)

- **Commit:** `4416837` — docs: M6 metagame done — status snapshot + M7 handoff
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** SHOULD FIX — 1 [P2] finding.

## Findings (verbatim)

Verdict: SHOULD FIX

- [P2] `.planning/.continue-here.md:30` implies all six music tracks should loop. SPEC §12 loops only `title`, `battle`, and `boss`; `crawl`, `victory`, and `gameover` are one-shot tracks. Following this handoff would repeat victory/game-over jingles indefinitely.

## Disposition

**DEFER.** This commit only touches planning/status prose (`.planning/.continue-here.md`, `status.md`) — no runtime code. The flagged line is the FUN-23 (M7 "Аудио", not yet implemented) handoff summary, which loosely lists all six tracks together as "зациклена без щелчков" (looped without clicks) instead of scoping that to title/battle/boss only, as SPEC §12's table (row descriptions) and §16 acceptance item 12 ("музыка волн/боссов зациклена") actually specify. Codex's catch is correct and worth keeping in mind, but SPEC §12 remains the binding source of truth for the eventual `src/systems/Audio.js` implementation — the imprecise handoff prose does not itself ship any looping behavior. No code changes needed now; flag for the M7 implementer to loop only title/battle/boss and play crawl/victory/gameover as one-shot per SPEC §12.
