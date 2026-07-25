# Codex audit — a097fe8

- **Commit:** `a097fe8` — chore: NOTICE — copyright holder for Apache 2.0 attribution
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: **PASS с одним [P3]**. Коммит не нарушает `docs/SPEC.md`, не содержит секретов и не затрагивает исполняемый код.

## Findings (verbatim)

Вердикт: **PASS с одним [P3]**. Коммит не нарушает `docs/SPEC.md`, не содержит секретов и не затрагивает исполняемый код.

Находки:

- **[P3] [NOTICE:4](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/NOTICE:4)** — строки 4–14 копируют лицензионный boilerplate, предназначенный для заголовков исходных файлов, в `NOTICE`. Это не делает лицензию недействительной, но засоряет `NOTICE` и потенциально создаёт лишнюю обязанность воспроизводить этот текст downstream-получателям. Рекомендуется оставить название и copyright из строк 1–2, а Apache-заголовки при необходимости размещать в исходных файлах. Apache рекомендует держать `NOTICE` кратким и включать только необходимые attribution notices: [ASF licensing guidance](https://infra.apache.org/licensing-howto.html), [Apache License FAQ](https://apache.org/foundation/license-faq.html).

Кратко:

- P1/P2 не обнаружены.
- Название `Pissuarius (FunGame)` соответствует `docs/SPEC.md:1`.
- Утечки ресурсов/слушателей и runtime edge-cases неприменимы: добавлен только текстовый файл.
- Секретов, API-ключей, токенов или приватных ключей в diff нет.

Изменённые файлы:

- Аудит read-only, файлы не изменялись.
- Сам коммит добавляет только `NOTICE`.

Проверки:

- Прочитан полный `git show a097fe8`.
- Проверено содержимое `docs/SPEC.md` из снимка коммита.
- Выполнены `git diff-tree --check` и поиск типовых секретов — замечаний нет.
- Runtime-тесты не запускались: исполняемый код не изменён.

Git/GitHub:

- Ветка: `main`.
- До аудита уже были незакоммиченные изменения в `docs/SPEC.md`, `src/data/i18n.js`, `src/entities/PowerUp.js`, `src/main.js`; они не затрагивались.
- Связанных issue/PR не проверялось.

## Disposition

- **[P3] `NOTICE` копирует лицензионный boilerplate вместо атрибуции → ИСПРАВЛЕНО** в `968bb3d`: оставлены название, copyright и ссылка на `LICENSE`.
