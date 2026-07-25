# Codex audit — c2ba43e

- **Commit:** `c2ba43e` — FUN-21 followup: clamp sound-generation duration_seconds to API range [0.5,30] — SPEC durations 0.2-0.4s rejected by API floor
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: PASS WITH FOLLOW-UP.** P1/P2 не найдено. Clamp соответствует SPEC §12 («ближайший эквивалент») и официальному диапазону API 0.5–30 s, указанному в [ElevenLabs API reference](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert).

## Findings (verbatim)

### Находка

- [P3] [scripts/generate_audio.mjs:68](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/scripts/generate_audio.mjs:68) — clamp применяется только при построении запроса, а `--dry-run` продолжает показывать исходные 0.2–0.4 s. Например, preview сообщает `sfx_hit.mp3 0.2s`, тогда как API получит `0.5`. Диагностика вводит в заблуждение; стоит показывать фактически отправляемую длительность.

**Вердикт: PASS WITH FOLLOW-UP.** P1/P2 не найдено. Clamp соответствует SPEC §12 («ближайший эквивалент») и официальному диапазону API 0.5–30 s, указанному в [ElevenLabs API reference](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert).

Кратко:

- Все 16 SFX формируют допустимый payload.
- Утечек ресурсов или слушателей нет — изменение является чистым преобразованием данных.
- Секретов в diff нет; значение API-ключа не логируется и не сохраняется.

Измененные файлы:

- Аудит read-only, файлы не изменялись.

Проверки:

- `node --check scripts/generate_audio.mjs`
- Динамическая проверка payload всех записей MANIFEST
- `--dry-run` для коротких SFX
- `git diff-tree --check`
- Поиск признаков секретов в diff

Git/GitHub:

- Ветка `main`, рабочее дерево чистое.
- GitHub не использовался; связанных issue/PR не задано.

## Disposition

- **[P3] `--dry-run` печатал табличные 0.2–0.4 s вместо уходящих в API 0.5 → ИСПРАВЛЕНО** в `64c39bf`: обе точки идут через общий `sfxDurationSeconds()`; проверено запуском `--dry-run`.
