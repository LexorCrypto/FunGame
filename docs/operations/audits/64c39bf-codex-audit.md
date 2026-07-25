# Codex audit — 64c39bf

- **Commit:** `64c39bf` — fix(lifecycle): убитые боссы и отродья уничтожаются, а не висят в группах (codex-аудиты f894508/965b18e)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: PASS.** Коммит соответствует релевантным требованиям `docs/SPEC.md`; lifecycle-исправления корректны.

## Findings (verbatim)

## Кратко

- [P1] отсутствуют.
- [P2] отсутствуют.
- [P3] отсутствуют.
- Секреты не обнаружены: используется только `ELEVENLABS_API_KEY` из окружения.
- **Вердикт: PASS.** Коммит соответствует релевантным требованиям `docs/SPEC.md`; lifecycle-исправления корректны.

`destroy()` безопасно удаляет объект из display/update/physics, а Phaser Group автоматически исключает уничтоженного ребёнка. `preDestroy()` вызывается до обнуления `scene`, поэтому снятие `SHUTDOWN`-слушателя корректно. [Phaser GameObject source](https://raw.githubusercontent.com/phaserjs/phaser/v3.90.0/src/gameobjects/GameObject.js), [Phaser Group source](https://raw.githubusercontent.com/phaserjs/phaser/v3.90.0/src/gameobjects/group/Group.js).

## Измененные файлы

Коммит изменяет:

- `scripts/generate_audio.mjs`
- `src/entities/BossBase.js`
- `src/entities/BossGoldenThrone.js`
- `src/entities/BossRoachQueen.js`
- `src/systems/WaveDirector.js`

Повторный cleanup всех боссов идемпотентен. Кламп SFX к 0.5 секунды соответствует актуальному API ElevenLabs: допустимый диапазон — 0.5–30 секунд. [ElevenLabs API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert).

## Проверки

- `git diff --check 64c39bf^ 64c39bf` — успешно.
- `node --check` для всех пяти файлов — успешно.
- Audio dry-run — `0.2–0.4s` корректно отображаются как фактические `0.5s`.
- Проверены ветки: убито игроком, выход за поле, смерть босса, shutdown сцены, повторный cleanup/destroy.
- Browser smoke в рамках этого аудита не запускался.

## Git/GitHub

- Ветка: `main`, HEAD `64c39bf`, ahead `origin/main` на 4 коммита.
- Во время аудита появились сторонние незакоммиченные изменения: `docs/SPEC.md`, `src/main.js`, `.smoke-phaser.js`, `.smoke.html`. Я их не изменял; добавление про паузу в SPEC к аудируемому коммиту не относится.
- Issue/PR не задействованы.

## Риски и следующие шаги

Трековых автотестов lifecycle в репозитории нет; остаточный риск ограничен Phaser-runtime поведением. Serena LSP и Context7 были недоступны, поэтому контракты проверены по официальному исходнику Phaser 3.90 и документации ElevenLabs.

## Disposition

- Находок нет; действий не требуется.
