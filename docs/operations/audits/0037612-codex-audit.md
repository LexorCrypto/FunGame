# Codex audit — 0037612

- **Commit:** `0037612` — docs: M7 audio complete (FUN-21..23) — status snapshot + M8 handoff
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: WARN** — документационный коммит преждевременно фиксирует полное соответствие M7 спецификации из-за небесшовного battle-loop; P3 не блокирует обычный запуск.

## Findings (verbatim)

## Находки

- [P2] [status.md:33](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:33) — M7 объявлен прошедшим §16, но проверялся лишь флаг `loop`, а не бесшовность файлов. `music_battle.mp3` содержит около 1.84–2.21 с тишины в конце, `music_title.mp3` — 0.36–0.53 с. При каждом повторе возникает заметная пауза, что расходится с `seamless loop` из §12. Нужна обрезка/перегенерация и слуховая проверка границы цикла.

- [P3] [src/systems/Audio.js:219](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/systems/Audio.js:219) — модульный `audioSystem` не сбрасывается при `game.destroy()`. Глобальный клавиатурный слушатель снимается, но singleton продолжает удерживать уничтоженные `game`/`sound`; повторный `initAudio(newGame)` возвращает старый экземпляр. Подтверждено probe-тестом: `sameInstance=true`, `boundGame="first"`. Для обычного одиночного запуска влияние минимально, но ломаются recreate/hot-reload и сохраняется ссылка на ресурсы.

[P1] не найдено. Секретов не найдено: gitleaks чист для `0037612` и всей локальной истории из 67 коммитов.

## Кратко

Коммит меняет только `.planning/.continue-here.md` и `status.md`. Основные утверждения подтверждены: 22/22 файлов присутствуют, соответствуют manifest, имеют MP3/44.1 kHz, preload подключён, слушатель `mute-changed` снимается при shutdown.

## Проверки

- `git show 0037612`, `git diff --check`;
- ESM syntax-check затронутой M7-реализации;
- ffprobe длительностей, частоты и каналов;
- анализ тишины на границах loop-треков;
- gitleaks коммита и полной истории;
- lifecycle-probe аудиосинглтона;
- браузерный smoke повторно не запускался.

## Git/GitHub

- Ветка: `main`.
- Рабочее дерево уже было dirty: изменены `docs/SPEC.md`, `src/data/i18n.js`, `src/entities/PowerUp.js`, `src/main.js`; присутствуют `.smoke-phaser.js` и `.smoke.html`. Я ничего не изменял.
- Связанных issue/PR не проверялось.

**Вердикт: WARN** — документационный коммит преждевременно фиксирует полное соответствие M7 спецификации из-за небесшовного battle-loop; P3 не блокирует обычный запуск.

## Disposition

- **[P2] M7 объявлен прошедшим §16, хотя лупы не бесшовны → ИСПРАВЛЕНО** по существу (`e4819af` + `fb7a242`) и по формулировке (status.md переписан: слуховая часть §16 п.12 явно за владельцем).
- **[P3] Синглтон аудио не сбрасывается при `game.destroy()` → ИСПРАВЛЕНО** в `968bb3d`.
