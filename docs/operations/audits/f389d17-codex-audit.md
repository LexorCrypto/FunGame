# Codex audit — f389d17

- **Commit:** `f389d17` — fix(audio): подрезка не портит оригинал при неудаче и не оставляет мусор (codex-аудит dca51ea)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** WARN / approve with minor fix — 1×P3 (неполная гарантия очистки временного файла).

## Findings (verbatim)

Кратко:

- [P3] [scripts/trim_music_loops.mjs:138](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/scripts/trim_music_loops.mjs:138), [строка 166](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/scripts/trim_music_loops.mjs:166) — оба вызова `renderTrim()` находятся вне защитного блока. Если `ffmpeg` создаст `.trim.mp3`, а затем завершится ошибкой, `execFileSync` выбросит исключение и cleanup не выполнится. Такое поведение с оставшимся output возможно при повреждённом входе; пример есть в [архиве FFmpeg](https://ffmpeg.org/pipermail/ffmpeg-user/2013-January/012901.html). Оригинал не пострадает, но коммит всё ещё может оставить мусор. Cleanup следует перенести внутрь `renderTrim()` либо обернуть сам рендер в `try/catch`.

Других P1/P2/P3 не найдено. Логика отказа от перезаписи оригинала соответствует `docs/SPEC.md §12`; утечек слушателей и секретов нет.

Вердикт: **WARN / approve with minor fix** — функциональный дефект исправлен, но заявленная гарантия очистки неполная.

Изменённые файлы:

- Нет — аудит read-only.

Проверки:

- `node --check scripts/trim_music_loops.mjs` — успешно.
- `node scripts/trim_music_loops.mjs --check` — успешно, показатели 8.1/12.2/11.3 ms.
- `git diff-tree --check` — успешно.
- Gitleaks по коммиту — утечек не найдено.
- LightRAG был недоступен; Serena не смогла разобрать `.mjs` без language server, использован локальный `rg`.

Git/GitHub:

- Ветка `main`, `HEAD=f389d17`, на 14 коммитов впереди `origin/main`.
- Есть существующие untracked audit-файлы; аудит их не менял.
- Связанных issue/PR не указано.

## Disposition

- **[P3] Оба вызова `renderTrim()` были вне защитного блока: ffmpeg мог создать `.trim.mp3` и упасть уже после этого → ИСПРАВЛЕНО** в `a533aec`: путь временного файла задаёт вызывающий, рендер выполняется внутри `try`, уборка — в `finally` (и в переборе фейдов, и в финальной записи). Заодно битый файл или отсутствующий ffmpeg больше не роняют прогон стек-трейсом. Проверено песочницей с битым `music_boss.mp3`: два целых трека обработаны, битый отчитался одной строкой, временных файлов не осталось, exit 1.
