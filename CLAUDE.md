# CLAUDE.md — Pissuarius (FunGame)

Аркадный шутер в стиле Galaxian (80-е) с туалетным юмором. Браузерная игра,
публичный репо `github.com/LexorCrypto/FunGame`, сайт `lexorcrypto.github.io/FunGame`.

## Документы (читать в этом порядке)

1. `docs/PRD.md` — концепт и архитектура.
2. `docs/SPEC.md` — нормативная спецификация: все числа, волны, боссы, пиксельные
   схемы, аудио, i18n. Чего там нет — не существует.
3. `CONTEXT.md` — глоссарий; терминология строго по нему.
4. **🔄 STATE/HANDOFF — [issue #12](https://github.com/LexorCrypto/FunGame/issues/12)** —
   точка входа сессии: машинные указатели (main_sha, next, active, blockers) и журнал
   сессий в комментариях. Оттуда — на 📌 **CONTEXT**
   ([issue #11](https://github.com/LexorCrypto/FunGame/issues/11)), стабильный паспорт проекта.
5. `status.md` — офлайн-снапшот состояния; `.planning/.continue-here.md` — развёрнутый хэндофф.

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

- `close_session.task_mode = github_state` — контекст-стор ADR-0026 на двух закреплённых
  issue (#12 STATE/HANDOFF, #11 CONTEXT), конфиг `.github/lexor-context-store.json`.
  Задачи, вопросы и находки аудитов — GitHub Issues; Linear закрыт и остаётся архивом.
- **Отклонение от ADR-0026 (решение владельца 2026-07-25):** `status.md` НЕ выводится из
  игры и tombstone не ставится — он остаётся офлайн-снапшотом состояния (фаза, майлстоуны,
  прод, блокеры) со ссылками на трекер. Список задач в него не копировать.
  `.planning/.continue-here.md` тоже остаётся: развёрнутый хэндофф для новой сессии.
- `close_session.commit_policy = auto`
- `close_session.push_policy = ask`
- `close_session.context_hygiene = ask`
