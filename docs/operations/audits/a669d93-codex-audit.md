# Codex audit — a669d93

- **Commit:** `a669d93` — feat(pause): Esc-пауза с заморозкой мира — закрывает пропуск SPEC §14 (codex-аудиты 965b18e/830abf5/85a68de)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: **REQUEST_CHANGES** — P1 нет, но lifecycle-утечку P2 стоит исправить.

## Findings (verbatim)

Вердикт: **REQUEST_CHANGES** — P1 нет, но lifecycle-утечку P2 стоит исправить.

### Находки

- [P2] [src/main.js:216](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:216) — `window.keydown` снимается только на `SHUTDOWN`. Phaser при `game.destroy()` или `SceneManager.remove()` вызывает `DESTROY` напрямую, поэтому обработчик остаётся в `window`, удерживает сцену и после пересоздания игры накапливается. Последующий Esc может обратиться к уничтоженному `ScenePlugin` и упасть. Нужен идемпотентный cleanup на `SHUTDOWN` и `DESTROY` либо на game `destroy`. Phaser отдельно предписывает окончательную очистку на `DESTROY`: [Scenes.Events](https://docs.phaser.io/api-documentation/event/scenes-events), [SceneManager 3.90 source](https://github.com/phaserjs/phaser/blob/v3.90.0/src/scene/SceneManager.js).

- [P3] [src/main.js:208](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:208) — обработчик не проверяет, что сцена ещё активна и переход не поставлен в очередь. Например, после `gameOverHandler()` операция `start('end')` уже queued, но listener жив до следующего кадра; Esc в этом окне добавит `pause` после `stop/start`, что даст `Cannot pause non-running Scene playground` в консоли. Операции ScenePlugin действительно выполняются через очередь: [Phaser ScenePlugin](https://docs.phaser.io/api-documentation/class/scenes-sceneplugin). Нужен флаг перехода или проверка фактического состояния сцены.

- [P3] [docs/SPEC.md:792](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/SPEC.md:792) — добавленный переход `Pause --Q--> Title`, описанный ниже на строках 809–815 и реализованный в коде, отсутствует в нормативной диаграмме состояний. SPEC внутренне расходится сам с собой.

Кратко:

- Заморозка физики, Clock/delayedCall, tweens, UpdateList и анимаций через `scene.pause()` корректна.
- Удерживаемые игровые клавиши не залипают: Phaser 3.90 сбрасывает Key-состояния при pause.
- Секретов, токенов, ключей или паролей в diff не найдено.

Измененные файлы:

- Нет — аудит read-only.

Проверки:

- `git show a669d93`, `git diff --check`;
- синтаксическая проверка `src/main.js`;
- targeted secret scan diff;
- сверка с `docs/SPEC.md` и исходниками Phaser 3.90.
- Runtime smoke независимо не повторялся: в коммите нет автоматизированного тестового harness.
- Serena активирована, но JS language server отсутствует; использованы Git/`rg` и официальный исходный код Phaser.

Git/GitHub:

- Ветка `main`, на момент завершения `ahead 9` относительно `origin/main`.
- Tracked-изменений нет.
- Уже присутствовали untracked `.smoke-phaser.js` и `.smoke.html`; не изменялись.
- Связанные PR/issue не указаны.

## Disposition

- **[P2] Слушатель `window.keydown` снимался только на `SHUTDOWN` → ИСПРАВЛЕНО** в `98b4734`: снятие повешено и на `DESTROY` (`removeEventListener` идемпотентен). Проверено: после `game.destroy(true)` Esc не бросает исключение.
- **[P3] Обработчик не проверял, что сцена ещё на ходу (Esc в окне перехода game-over → EndScene дал бы «Cannot pause non-running Scene») → ИСПРАВЛЕНО** в `98b4734`: добавлена проверка `paused ? scene.isPaused() : scene.isActive()`. Проверено: два Esc в этом окне — ноль ошибок консоли.
- **[P3] Диаграмма §14 не содержала перехода `Pause --Q--> Title` → ИСПРАВЛЕНО** в `98b4734`.
