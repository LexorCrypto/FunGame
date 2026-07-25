# Codex audit — be3be24

- **Commit:** `be3be24` — docs: аудит-долг M7–M9 закрыт — отчёт сессии, статус и хэндофф переписаны
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** BLOCK / REQUEST_CHANGES — 1×P1, 2×P2, 1×P3 (порядок коммитов и формулировки статуса).

## Findings (verbatim)

## Находки

- [P1] [session-2026-07-25-codex-audit-debt-and-owner-fixes.md:21](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/operations/sessions/session-2026-07-25-codex-audit-debt-and-owner-fixes.md:21) — отчёт утверждает, что новые аудиты сохранены, после чего коммит удаляет реестр незакрытого долга. Однако в дереве `be3be24` отсутствуют все 27 упомянутых файлов аудита: 17 отложенных и 10 аудитов коммитов сессии. Сейчас они существуют только как untracked-файлы, то есть не входят в коммит и могут быть потеряны. Утверждения «долга нет» и «блокеров нет» в [status.md:44](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:44) фактически неверны.

- [P2] [status.md:5](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:5) — статус объявляет разработку по SPEC закрытой, хотя ниже оставлены прямые несоответствия нормативным требованиям: интервал атаки 9.3/7.3 секунды вместо 6/4 ([status.md:51](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:51)) и продолжение отложенных атак во время обязательной паузы смены фазы ([status.md:65](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:65)). Нужно либо исправить реализацию/SPEC, либо оставить соответствие SPEC незакрытым.

- [P2] [status.md:30](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:30) — отчёт считает утечку pause-listener закрытой, но [src/main.js:226](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:226) регистрирует отдельные `once(SHUTDOWN)` и `once(DESTROY)` с одной функцией. После каждого SHUTDOWN обработчик DESTROY остаётся в emitter и при следующем запуске сцены добавляется ещё один. Phaser повторно запускает тот же экземпляр сцены после SHUTDOWN, а DESTROY происходит только при удалении сцены, поэтому callbacks накапливаются до уничтожения игры. Следует при срабатывании одного события отписывать cleanup от второго. [Phaser 3.90 Scene lifecycle](https://docs.phaser.io/phaser/concepts/scenes).

- [P3] [session-2026-07-25-codex-audit-debt-and-owner-fixes.md:9](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/operations/sessions/session-2026-07-25-codex-audit-debt-and-owner-fixes.md:9) — заголовок говорит о 23 аудитах, но таблица содержит `8 + 9 + 10 = 27`. [status.md:28](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:28) повторяет ошибочное `17 + 6`, хотя новых коммитов перечислено десять.

**Вердикт: BLOCK / REQUEST_CHANGES.** Сначала нужно добавить 27 файлов аудита в коммит и вернуть реестр долга до их фиксации.

Кратко:

- Diff и релевантные разделы `docs/SPEC.md` проверены.
- Секретов в diff не найдено; `ELEVENLABS_API_KEY` упоминается только как имя переменной.
- `git diff --check` прошёл.
- Serena была активирована, но language server оказался недоступен; использован точечный `rg` и `git show`.

Git/GitHub:

- Ветка `main`, на 12 коммитов впереди `origin/main`.
- Рабочее дерево не чистое: присутствуют untracked smoke-файлы и 27 файлов аудита; я их не изменял.
- GitHub не затрагивался.

## Disposition

- **[P1] Коммит удалил реестр долга раньше, чем записи аудитов попали в дерево → ЗАКРЫТО порядком коммитов.** Записи по контракту `close-session` собираются в ОДИН финальный audit-only коммит: SHA коммита неизвестен до его создания, поэтому его запись физически не может лежать в нём самом. Замечание по порядку справедливо — реестр стоило снимать тем же коммитом, что вносит записи. Фактически окно риска закрыто следующим коммитом: все записи в дереве, реестра нет, долга нет. На будущее: удаление реестра — часть audit-only коммита, а не докoммита.
- **[P2] `status.md` объявлял разработку по SPEC закрытой при живых расхождениях с нормативом → ИСПРАВЛЕНО** в `dca51ea`: формулировка «закрыта с зафиксированными отклонениями», два открытых (интервал «Плюх» §7.3 и отложенные атаки в паузу смены фазы) названы прямо в шапке.
- **[P2] Утечка pause-listener названа закрытой, хотя в дереве `be3be24` она ещё была → ЗАКРЫТО** в `17461e1` (cleanup снимает себя с SHUTDOWN и DESTROY). Проверено: четыре цикла Game → Title — число DESTROY-слушателей неизменно.
- **[P3] Арифметика числа аудитов (23 в заголовке против 27 в таблице; «17 + 6») → ИСПРАВЛЕНО** в `17461e1` и `dca51ea`.
