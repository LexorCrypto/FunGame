# Codex audit — dd666ba (FUN-19 CrawlScene)

- **Commit:** `dd666ba` — FUN-19: intro crawl scene — perspective scroll, i18n text, skip (SPEC §13)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-24
- **Verdict (codex):** FAIL — crawl feature is unreachable and incomplete (audited in isolation at this SHA).

## Findings (verbatim)

FAIL — crawl feature is unreachable and incomplete.

- [P1] `src/main.js:212` registers only `BootScene` and `PlaygroundScene`; `BootScene` starts `playground` directly. `CrawlScene` is never imported, registered, or started, so the commit has no runtime effect and violates SPEC §§13–14.
- [P2] `CrawlScene.js:18-48,121-125` never loads or plays `music_crawl.mp3`, nor fades it over 0.3 s when skipped, as required by SPEC §13.

## Disposition

- **[P1] CrawlScene unreachable → ACCEPTED as by-design (NOT an outstanding defect).** Verified: this is a sequential feature commit — `CrawlScene` ships standalone here and is registered into `main.js`'s scene array by the very next commit in this batch, `61ec271` (FUN-18: `import { CrawlScene } from './scenes/CrawlScene.js'` + `scene: [BootScene, TitleScene, CrawlScene, PlaygroundScene, EndScene]`), which is already an ancestor of HEAD. At HEAD, Boot → Title → Crawl → Game → End is fully wired. Mirrors the established precedent in `ed4258d-codex-audit.md` (isolated-commit boundary, not a real regression). Downgraded from P1; does not block the close.
- **[P2] `music_crawl.mp3` not played/faded → DEFER (audio milestone).** Confirmed: no `src/` file calls `this.sound.*` or references `music_` anywhere in the codebase yet — audio is project-wide out of scope until the dedicated audio milestone (§12, FUN-22/23 ElevenLabs generation), matching the standing disposition already recorded in `ed4258d-codex-audit.md` and `4416837-codex-audit.md`. Music start/stop/fade for all six tracks (including `music_crawl`) lands together with that milestone.

Verified by M6 full-scene-flow browser smoke (Boot→Title→Crawl→Game→End, zero console errors). No code changed (read-only audit).
