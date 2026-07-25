# Codex audit — 733c9dc

- **Commit:** `733c9dc` — feat(context-store): два закреплённых issue STATE/HANDOFF и CONTEXT по образцу kvik (ADR-0026)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** CHANGES REQUESTED — 3×P2, 1×P3.

## Findings (verbatim)

Кратко:

**Вердикт: CHANGES REQUESTED.** Найдено 3×[P2], 1×[P3]. [P1] нет.

Находки:

- **[P2] [.github/lexor-context-store.json:6](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/.github/lexor-context-store.json:6)** — машинный контракт конфликтует с [CLAUDE.md:64](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/CLAUDE.md:64). Канонический `github_state` использует `tombstone_verified_cycles` для tombstone и последующего удаления `status.md`, тогда как решение владельца требует никогда этого не делать. Поддерживаемого config-флага исключения нет; следующий стандартный close-session может затереть сохраняемый снапшот. Нужен распознаваемый closer-ом `preserve_status_snapshot` либо сохранение режима `hybrid`.

- **[P2] [CLAUDE.md:12](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/CLAUDE.md:12)** — новая точка входа ведёт в STATE #12, где `main_sha=df3d924`, тогда как проверяемый HEAD — `733c9dc`; `origin/main` ещё на `dba0a84`. После публикации текущей серии STATE останется на родителе миграционного коммита, а до публикации его SHA вообще недоступен удалённому читателю. Нужен post-push guarded PATCH #12 с `main_sha=733c9dc` и verify-after-write.

- **[P2] [status.md:1](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:1)** — retained-снапшот продолжает объявлять Linear источником истины, а [status.md:44](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/status.md:44) утверждает, что планового тикета нет. Это противоречит новому `github_state`, STATE с `next=fungame#9`/`active=#1…#10` и [SPEC §17](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/SPEC.md:912), где открытые вопросы живут в GitHub Issues.

- **[P3] [CLAUDE.md:8](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/CLAUDE.md:8)** — раздел требует читать документы в указанном порядке, но STATE/HANDOFF стоит только четвёртым пунктом на [строке 12](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/CLAUDE.md:12). Это расходится с заявленным стартовым контрактом `STATE → CONTEXT → задачи/память`. Лучше отделить session bootstrap и поставить STATE/CONTEXT первыми.

Измененные файлы:

- Аудит read-only; файлы не изменялись.
- Коммит меняет `.github/lexor-context-store.json`, `CLAUDE.md`, `status.md`.

Проверки:

- Прочитан полный `git show 733c9dc`, SPEC §16–17 и канонический контракт `github_state`.
- Проверены live-тела #11/#12 и открытые #1–#10 через GitHub.
- STATE проходит `validate_state_mfa.py`.
- JSON валиден; `git diff --check` чист.
- `gitleaks`: 1 commit, утечек не найдено.
- Исполняемый код не менялся — новых таймеров, ресурсов или слушателей нет.

Git/GitHub:

- Ветка `main`, HEAD `733c9dc`, локально `ahead 7` относительно `origin/main`.
- Есть ранее существовавшие untracked smoke/audit-файлы; не тронуты.
- Pin-статус и label node-id независимо не перепроверены: локальный `gh` не имел сетевого доступа, а connector не возвращает эти поля.

## Disposition

- **[P2] `github_state` требует retirement `status.md`, а владелец решил снапшот сохранить → ИСПРАВЛЕНО** в `5379573`: режим возвращён на `hybrid`, два закреплённых issue остаются нашей конвенцией, конфиг помечен как неактивируемый в этом режиме (гарантий §4g/MF-J не даёт), `tombstone_verified_cycles` оставлен на `0` ради валидной формы файла.
- **[P2] `status.md` объявлял источником истины Linear и «планового тикета нет» при десяти открытых issue → ИСПРАВЛЕНО** в `5379573`: шапка переписана на GitHub Issues, «следующее» отсылает к `next` из STATE #12.
- **[P2] `main_sha` в STATE указывает на родителя миграционного коммита → ЗАКРЫТО ПОСЛЕ ПУША** guarded-патчем issue #12 с verify-after-write: до публикации SHA удалённому читателю недоступен, поэтому патч делается последним шагом.
- **[P3] STATE/HANDOFF стоял четвёртым в порядке чтения → ИСПРАВЛЕНО** в `5379573`: выделен блок «Старт сессии» с #12 → #11 на первом месте.
