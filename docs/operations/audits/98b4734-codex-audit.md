# Codex audit — 98b4734

- **Commit:** `98b4734` — fix(pause): слушатель снимается и на DESTROY, Esc не трогает уходящую сцену (codex-аудит a669d93)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** REQUEST_CHANGES — P1/P2 нет, найдены два P3.

## Findings (verbatim)

Вердикт: **REQUEST_CHANGES** — P1/P2 нет, найдены два P3.

### Находки

- **[P3] [src/main.js:212](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:212)** — проверка `isActive()` не устраняет заявленную гонку. После `gameOverHandler()` состояние всё ещё `RUNNING`, потому что `start('end')` лишь ставит `stop/start` в очередь. Esc в этом окне проходит проверку и добавляет `pause`; очередь выполняется как `stop playground → start end → pause playground`, снова выдавая `Cannot pause non-running Scene`. Это нарушает требование чистой консоли из SPEC §16. Нужен явный флаг `exiting/transitionPending`, устанавливаемый перед `scene.start()`, либо синхронное отключение обработчика. Phaser подтверждает очередь операций в [ScenePlugin](https://docs.phaser.io/api-documentation/3.90.0/class/scenes-sceneplugin) и её обработку в [SceneManager 3.90](https://raw.githubusercontent.com/phaserjs/phaser/v3.90.0/src/scene/SceneManager.js).

- **[P3] [src/main.js:227](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:227)** — после каждого `SHUTDOWN` обработчик окна снимается, но соответствующий `once(DESTROY, removeKeyHandler)` остаётся в `this.events`. Сцена может запускаться многократно, а emitter переживает shutdown, поэтому каждый цикл Game → Title добавляет ещё один ожидающий DESTROY-listener. Накопление продолжается до удаления сцены или уничтожения игры. Cleanup должен снимать оба lifecycle-listener через `events.off(...)`. Жизненный цикл с повторным запуском после shutdown описан в [официальной документации Phaser](https://docs.phaser.io/phaser/concepts/scenes).

### Кратко

- Изменение диаграммы `docs/SPEC.md` соответствует текстовому поведению `Pause --Q--> Title`.
- Секретов, токенов, паролей или ключей в коммите не найдено.
- Cleanup глобального `window.keydown` при прямом `DESTROY` теперь работает.

### Изменённые файлы

- Аудит read-only; файлов не изменял.
- Коммит изменяет `docs/SPEC.md` и `src/main.js`.

### Проверки

- `git show 98b4734`
- `git diff --check 98b4734^ 98b4734`
- синтаксическая проверка `src/main.js`
- `gitleaks` по диапазону коммита — утечек нет
- сверка с исходниками и документацией Phaser 3.90
- Serena активирована, но JS language server отсутствует; использованы Git/`rg`

### Git/GitHub

- Ветка `main`, `ahead 10` относительно `origin/main`.
- Во время аудита появились чужие tracked-изменения в `.planning/.continue-here.md` и `status.md`, плюс существующие untracked-файлы; я их не трогал.
- Связанных PR/issue не указано.

### Риски и следующие шаги

- Исправить обе находки.
- Повторить smoke: Esc между постановкой `start('end')` и следующим RAF; затем много циклов Game → Title с проверкой стабильного числа DESTROY-listeners.

## Disposition

- **[P3] `isActive()` не закрывает гонку с очередью ScenePlugin (после `game-over` сцена ещё RUNNING) → ИСПРАВЛЕНО** в `17461e1`: явный флаг `leaving`, который выставляют оба выхода из сцены. Проверено: один Esc сразу после `game-over` паузу не ставит, EndScene стартует, ноль ошибок консоли.
- **[P3] Висящий `once(DESTROY)` копится по одному за цикл Game → Title → ИСПРАВЛЕНО** в `17461e1`: cleanup снимает себя с обоих событий. Проверено: четыре цикла подряд — DESTROY-слушателей стабильно 14, SHUTDOWN 18.
