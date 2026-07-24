# CLAUDE.md — Pissuarius (FunGame)

Аркадный шутер в стиле Galaxian (80-е) с туалетным юмором. Браузерная игра,
публичный репо `github.com/LexorCrypto/FunGame`, сайт `lexorcrypto.github.io/FunGame`.

## Документы (читать в этом порядке)

1. `docs/PRD.md` — концепт и архитектура.
2. `docs/SPEC.md` — нормативная спецификация: все числа, волны, боссы, пиксельные
   схемы, аудио, i18n. Чего там нет — не существует.
3. `CONTEXT.md` — глоссарий; терминология строго по нему.
4. `status.md` — текущий статус; `.planning/.continue-here.md` — точка продолжения.

## Трекер задач

Linear (org Lexor54): команда **FUN**, проект «Pissuarius v1», 9 майлстоунов
M1–M9 (этапы §17 PRD), 26 атомарных issues FUN-1…FUN-26. Одна задача = одна
сессия исполнителя; приёмка — по SPEC §16. GitHub Issues для задач не используем.

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
- i18n: все строки из `src/data/i18n.js` (RU/EN), ни одной строки в коде.

## Жёсткие правила процесса

- **push — только по команде пользователя** («пуш»); коммиты локально — свободно.
- Внешние мутации (Linear, webhook, сервер, issues) — только по явной команде.
- **Секреты никогда не коммитить** (репо публичный). Операционные детали инфры
  (топология, доступы, пути) — во внутренних заметках LightRAG, не в репо.
- Скомпрометированные ранее секреты не использовать.
- `landing/out/` и `.serena/` — в `.gitignore`, не коммитить.

## close_session

- `close_session.task_mode = local_status` (задачи — Linear; `status.md` — снапшот)
- `close_session.commit_policy = auto`
- `close_session.push_policy = ask`
- `close_session.context_hygiene = ask`
