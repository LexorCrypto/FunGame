# Codex audit — df3d924

- **Commit:** `df3d924` — docs: SPEC без самопротиворечия по плюху, трекер без хрупких перечислений (codex-аудит 336b011)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** CHANGES REQUESTED — 1×P2, 1×P3 (маршрутизация issue и остаток перечисления).

## Findings (verbatim)

## Находки

- [P2] [.planning/.continue-here.md:19](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/.planning/.continue-here.md:19) — вопросы владельца теперь ищутся по `owner-decision`, но [issue #10](https://github.com/LexorCrypto/FunGame/issues/10), прямо требующий решения владельца, имеет только метки `audit` и `priority:p3`. После удаления номеров он выпадает из целевой очереди. Нужно добавить метку `owner-decision`.

- [P3] [status.md:11](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:11) — остался хрупкий перечень «два отклонения», хотя обновлённый SPEC теперь явно фиксирует третье открытое отклонение — повторный плюх Трона, issue #10. Это противоречит цели коммита не дублировать трекер. Следует убрать число и перечисление.

**Вердикт: CHANGES REQUESTED.** Формулировка в SPEC корректно отражает реализацию (`onEnterPhase2()` действительно сбрасывает `plopFiredThisWindow`), но маршрутизация и статус не синхронизированы.

## Изменённые файлы

Аудит read-only; файлов не изменял.

## Проверки

- Прочитан полный diff `df3d924`.
- Выполнен `git diff-tree --check` — ошибок нет.
- Gitleaks: один коммит, утечек секретов не найдено.
- Issue #2 и #10 проверены через GitHub.
- Код не менялся: новых утечек ресурсов/слушателей и runtime edge-cases коммит не создаёт.
- LightRAG был недоступен; Serena активирована, но language server отсутствовал — использован точечный `rg`.

## Git/GitHub

- Ветка `main`, на момент финальной проверки опережает `origin/main` на 6 коммитов.
- Рабочее дерево уже содержит посторонние изменённые/неотслеживаемые файлы; аудит их не трогал.
- Issue #10 открыт.

## Риски и следующие шаги

Добавить `owner-decision` к issue #10 и убрать фиксированный перечень отклонений из `status.md`; после этого блокирующих замечаний к коммиту нет.

## Disposition

- **[P2] issue #10 требует решения владельца, но имел только метки `audit`/`priority:p3` — после отказа от перечисления номеров выпадал бы из очереди `owner-decision` → ИСПРАВЛЕНО** в `733c9dc`: метка добавлена через guarded-путь MF-J (GraphQL `labelIds` по node-id из `.github/lexor-context-store.json`, с проверкой имени метки по id и verify-after-write).
- **[P3] В шапке `status.md` остался перечень «два отклонения» → ИСПРАВЛЕНО** в `733c9dc`: перечисление убрано, осталась ссылка на открытые issue по меткам.
