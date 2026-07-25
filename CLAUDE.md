# CLAUDE.md — Pissuarius (FunGame)

Аркадный шутер в стиле Galaxian (80-е) с туалетным юмором. Браузерная игра,
публичный репо `github.com/LexorCrypto/FunGame`, сайт `lexorcrypto.github.io/FunGame`.

## Старт сессии (в этом порядке)

1. **🔄 STATE/HANDOFF — [issue #12](https://github.com/LexorCrypto/FunGame/issues/12)** —
   единственная точка входа: машинные указатели (`main_sha`, `next`, `active`, `blockers`)
   и журнал сессий в комментариях.
2. **📌 CONTEXT — [issue #11](https://github.com/LexorCrypto/FunGame/issues/11)** —
   стабильный паспорт проекта (куда ведёт указатель `context` из STATE).
3. Задачи и открытые вопросы — GitHub Issues по `next` / `active`.

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
- **Точка входа сессии — #12 → #11** (см. «Старт сессии» выше). Поддерживать вручную:
  тело #12 — только машинный блок `AI-CONTEXT` из типизированных указателей
  (`last_updated`, `main_sha`, `next`, `active`, `blockers`, `context`, `lightrag`,
  `supabase`, `verification`), проза — только в комментариях. Валидатор
  `validate_state_mfa.py` живёт в скилле (`~/.claude/skills/close-session/`), а не в репо —
  так задумано: гейт, который репозиторий может подменить на `return 0`, не гейт. Если
  скилла под рукой нет, тело сверяется с этим списком полей руками.
  `.planning/.continue-here.md` остаётся развёрнутым хэндоффом.
- `close_session.commit_policy = auto`
- `close_session.push_policy = ask`
- `close_session.context_hygiene = ask`
