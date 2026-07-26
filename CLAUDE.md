# CLAUDE.md — Pissuarius (FunGame)

Аркадный шутер в стиле Galaxian (80-е) с туалетным юмором. Браузерная игра,
публичный репо `github.com/LexorCrypto/FunGame`, сайт `lexorcrypto.github.io/FunGame`.

## Старт сессии (в этом порядке)

1. **LightRAG** — глобальное правило воркспейса: первым делом `query_text` (hybrid) по теме
   первого сообщения, namespace проекта — `pissuarius/`. Порядок ниже — уже про этот репо.
2. **🔄 STATE/HANDOFF — [issue #12](https://github.com/LexorCrypto/FunGame/issues/12)** —
   точка входа по репозиторию: машинные указатели (`main_sha`, `next`, `active`,
   `blockers`) и журнал сессий в комментариях.
3. **📌 CONTEXT — [issue #11](https://github.com/LexorCrypto/FunGame/issues/11)** —
   стабильный паспорт проекта (куда ведёт указатель `context` из STATE).
4. Задачи и открытые вопросы — GitHub Issues по `next` / `active`.

## Документы (читать по мере надобности)

1. `docs/SPEC.md` — нормативная спецификация: все числа, волны, боссы, пиксельные
   схемы, аудио, i18n. Чего там нет — не существует (принятое сверх неё — §17).
2. `docs/PRD.md` — концепт и архитектура.
3. `CONTEXT.md` — глоссарий; терминология строго по нему.
4. `status.md` — офлайн-снапшот состояния; `.planning/.continue-here.md` — развёрнутый
   хэндофф. Оба вторичны по отношению к STATE/CONTEXT и сохранены по решению владельца.

## Трекер задач

**Живой трекер — GitHub Issues** этого репозитория (решение владельца 2026-07-25):
туда идут задачи, открытые вопросы, находки аудитов и приёмка. Метки: `audit`,
`owner-decision`, `acceptance`, `priority:p2`, `priority:p3`. В `status.md` список
НЕ дублировать — там только ссылки на трекер.

Два закреплённых singleton-issue (ADR-0026, конфиг — `.github/lexor-context-store.json`):
**#12 🔄 STATE/HANDOFF** (метка `status`, маркер `lexor-state-singleton`) и
**#11 📌 CONTEXT** (метка `context`, маркер `lexor-context-singleton`). Тело STATE —
только типизированные указатели, без прозы; проза и решения — в связанных issue,
`docs/operations/` и LightRAG. Второй такой issue не заводить: резолвить по маркеру.

Linear (org Lexor54, команда **FUN**, проект «Pissuarius v1») — архив: 9 майлстоунов
M1–M9 и 26 задач FUN-1…FUN-26, все Done. История там, новые задачи туда не заводим.
Приёмка по-прежнему по SPEC §16.

## Стек-контракт (не пересматривать без команды пользователя)

- Игра: **Phaser 3.90.0 через CDN** (jsDelivr, пин версии), vanilla JS ES-модули,
  **без сборки**; поле 480×270, pixelArt, `Phaser.Scale.FIT` + autoCenter;
  `game.html` — оболочка, код в `src/`.
- Лендинг: Next.js 14 + Zustand + Tailwind в `landing/` (статический экспорт);
  деплой на GitHub Pages через `.github/workflows/pages.yml`.
- Спрайты: только код из пиксельных схем SPEC §11 (палитра
  `. K W S G B D P Y O R N n E F`; все строки блока одинаковой длины). Внешних PNG нет.
- Аудио: офлайн-генерация через ElevenLabs в `assets/audio/`
  (`scripts/generate_audio.mjs`); ключ только из env `ELEVENLABS_API_KEY`.
  После регенерации луп-треков обязателен `node scripts/trim_music_loops.mjs`
  (бесшовность §12: генератор оставляет тишину на краях).
- i18n: все строки из `src/data/i18n.js` (RU/EN), ни одной строки в коде.

## Жёсткие правила процесса

- **push — только по команде пользователя** («пуш»); коммиты локально — свободно.
- Внешние мутации (Linear, webhook, сервер, issues) — только по явной команде.
- **Секреты никогда не коммитить** (репо публичный). Операционные детали инфры
  (топология, доступы, пути) — во внутренних заметках LightRAG, не в репо.
- Скомпрометированные ранее секреты не использовать.
- `landing/out/` и `.serena/` — в `.gitignore`, не коммитить.

## close_session

- `close_session.task_mode = hybrid` — задачи, открытые вопросы и находки аудитов живут
  в GitHub Issues; `status.md` остаётся офлайн-снапшотом состояния (фаза, майлстоуны,
  прод, блокеры) со ссылками на трекер, список задач в него НЕ копировать. Linear закрыт
  и остаётся архивом M1–M9.
- **Почему не `github_state`.** Схема двух закреплённых issue взята из kvik (ADR-0026) и
  здесь применяется, но канонический режим `github_state` идёт в комплекте с retirement
  `status.md` (tombstone → удаление через два цикла). Владелец 2026-07-25 решил снапшот
  сохранить, поэтому режим остаётся `hybrid`. Конфиг `.github/lexor-context-store.json`
  в этом режиме close-session НЕ активирует: гарантий §4g/MF-J он не даёт, это просто
  зафиксированные номера issue и node-id меток — опора для наших собственных правок по id
  вместо имён. Поле `tombstone_verified_cycles` держим на `0`: форма файла остаётся
  валидной, а tombstone не запускается из-за режима, а не из-за значения поля.
- **Точка входа сессии — #12 → #11** (см. «Старт сессии» выше). Тело #12 — только машинный
  блок `AI-CONTEXT` из типизированных указателей схемы (`last_updated`, `main_sha`, `next`,
  `active`, `blockers`, `context`, `lightrag`, `supabase`, `verification`); проза — только
  в комментариях. В теле нет произвольного текста: каждое значение должно попадать в свой
  типизированный формат (дата, SHA, `repo#N`, LightRAG-путь + `track:`,
  `knowledge.<table>:<uuid>`, `ci:`/`tests:`/`codex:`-токены).
- **Гейт — fail-closed, ДО записи, без следов.** Проверяется КАНДИДАТ, а не то, что уже
  опубликовано. Весь блок — в subshell, чтобы `umask`, `trap` и временные файлы жили ровно
  столько, сколько процедура:

  ```bash
  (
    umask 077
    R=LexorCrypto/FunGame                       # и запись, и проверка — один и тот же репо
    d=$(mktemp -d "${TMPDIR:-/tmp}/state.XXXXXX") || exit 1
    trap 'rm -rf "$d"' EXIT                     # ставим сразу: второй mktemp мог бы упасть
    tmp="$d/body"; back="$d/back"
    V=~/.claude/skills/close-session/validate_state_mfa.py
    DEC='import json,sys; sys.stdout.write(json.load(sys.stdin)["body"])'
    # …сформировать кандидата в "$tmp"…
    python3 "$V" --file "$tmp" --profile typed-pointer-v1 --reader-version 2 || exit 1
    gh issue edit 12 --repo "$R" --body-file "$tmp" || exit 1
    # Побайтово: `gh issue view --jq .body` печатает через Fprintln и добавляет свой
    # перевод строки, а нормализация хвостовых LF скрыла бы подмену концовки.
    gh api "repos/$R/issues/12" | python3 -c "$DEC" > "$back" || exit 1
    cmp -s "$tmp" "$back" || { echo "КЛОББЕР: тело не совпало с кандидатом" >&2; exit 1; }
    python3 "$V" --file "$back" --profile typed-pointer-v1 --reader-version 2
  )
  ```

  Путь идёт через `--file`: голый позиционный аргумент означает только `-` (stdin) — с
  путём валидатор молча читает stdin, то есть проверяет не кандидата, и при постороннем
  валидном stdin даже пройдёт. Без `--profile` валидатор откажет. Настоящий
  verify-after-write — побайтовое `cmp` кандидата с перечитанным телом: повторный прогон
  валидатора подтвердит лишь схему и пропустит чужую валидную перезапись, а `diff` по
  нормализованным хвостовым переводам строк пропустил бы подмену концовки.
  Валидатор живёт в скилле, а не в репо: гейт, который репозиторий может подменить на
  `return 0`, не гейт. **Скилла нет под рукой — тело #12 не трогаем вообще**: ручная сверка
  имён полей проверяет не то (валидатор смотрит ещё типы значений, обязательные поля,
  заголовок, singleton-маркер и отсутствие постороннего текста — именно это ловит секрет,
  случайно попавший в разрешённое поле публичного issue).
  `.planning/.continue-here.md` остаётся развёрнутым хэндоффом.
- **Откуда берутся значения указателей, fail-closed.** `main_sha` — ОПУБЛИКОВАННЫЙ коммит, а
  не локальный HEAD, и одного `0 0` мало: `git remote get-url origin` должен указывать на
  `LexorCrypto/FunGame` (перенастроенный `origin` подтвердит чужой репозиторий), затем
  `git fetch origin '+refs/heads/main:refs/remotes/origin/main'` должен завершиться УСПЕШНО.
  Рефспек с destination обязателен не потому, что иначе tracking-ref не обновится, а потому,
  что без него это обновление отдано на откуп `remote.origin.fetch`: `git fetch origin
  refs/heads/main` гарантированно пишет только `FETCH_HEAD`, а `refs/remotes/origin/main`
  обновится лишь постольку, поскольку его покрывает настроенный refmap (сейчас
  `+refs/heads/*:refs/remotes/origin/*` — покрывает, но процедура не должна зависеть от
  конфигурации). Иначе сверка ниже сравнит с устаревшим значением — ровно та ложная
  синхронность, от которой защищаемся. Fetch упал — процедура остановлена. После этого
  сверяются полные SHA:
  `git rev-parse HEAD^{commit}` = `git rev-parse refs/remotes/origin/main^{commit}`.
  Только тогда значение берётся как `git rev-parse --short=7 origin/main` — в поле идёт
  короткая форма, это конвенция блока. Валидатор такое не ловит: `main_sha` он проверяет
  одной регуляркой `[0-9a-f]{7,40}` — git не вызывает вообще и достижимость коммита на remote
  не проверяет (единственный внешний вызов, `gh issue view`, лишь читает тело в режиме
  `--issue`). Ровно так 2026-07-25 в тело попал `df3d924`, которого на `origin/main` не было.
- `close_session.commit_policy = auto`
- `close_session.push_policy = ask`
- `close_session.context_hygiene = ask`

Два tier-ключа читает не агент, а `audit_coverage.py`, и его регулярка якорится на **нулевой
колонке**. Пунктом списка (`- \`close_session…\``) они не парсятся вообще — молча, с откатом
всего репозитория в full-tier. Поэтому они стоят отдельным блоком, а не в перечислении выше:

```text
close_session.audit_full_tier_paths = .github/workflows/**, scripts/generate_audio.mjs, .env.example, landing/next.config.js
close_session.audit_light_tier_paths = docs/**, assets/**, README.md, LICENSE, NOTICE, CONTEXT.md, status.md, .planning/**, src/data/i18n.js
```

- **full-tier** — CI/деплой (`pages.yml`), офлайн-генерация аудио с ключом
  `ELEVENLABS_API_KEY` из env (`generate_audio.mjs`, `.env.example` — единственные точки, где
  репозиторий вообще касается секретов) и конфиг сборки лендинга, который управляет деплоем на
  GitHub Pages (`next.config.js`). Игра без бэкенда, БД и платежей — auth/money/migrations в
  репозитории нет, поэтому full-tier список короткий и не раздут искусственно.
- **light-tier** — документация и заметки сессий/аудитов (`docs/**`), статические аудио-ассеты
  (`assets/**`), лицензионные и справочные файлы, офлайн-снапшот (`status.md`), развёрнутый
  хэндофф (`.planning/**`) и таблица переводов RU/EN (`src/data/i18n.js`), которая не влияет
  на игровую логику.
