# Codex audit — aff0c17

- **Commit:** `aff0c17` — FUN-23: audio system — event SFX, scene/wave music with crossfade, M mute + title indicator (SPEC §12/§9)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** Вердикт: **ITERATE** — 1×P2, 2×P3. P1 и утечек секретов не найдено.

## Findings (verbatim)

Вердикт: **ITERATE** — 1×P2, 2×P3. P1 и утечек секретов не найдено.

### Находки

- **[P2] `src/main.js:294` — аудиосистема инициализируется после первого `TitleScene.create()`.**  
  `SceneManager` регистрирует свой обработчик `ready` внутри `new Phaser.Game()` раньше пользовательского и синхронно запускает `BootScene`. В этом коммите у Boot нет `preload()`, поэтому он сразу запускает Title, где `getAudio()` ещё возвращает `null` (`TitleScene.js:107,122,176`). Результат: запрос title-музыки теряется, а сохранённый `pissuarius_mute=1` первоначально отображается как «ЗВУК: ВКЛ». Нарушает SPEC §9/§12. Порядок подтверждается исходниками Phaser 3.90: [Game.js](https://github.com/phaserjs/phaser/blob/v3.90.0/src/core/Game.js), [SceneManager.js](https://github.com/phaserjs/phaser/blob/v3.90.0/src/scene/SceneManager.js).

- **[P3] `src/systems/Audio.js:217` — singleton переживает уничтожение игры.**  
  Обработчик `game.destroy` снимает `window.keydown`, но модульный `audioSystem` продолжает держать `game` и `sound`. Повторный `initAudio(newGame)` вернёт объект старой уничтоженной игры, одновременно препятствуя сборке старого графа объектов. Нужен `destroy()` с очисткой состояния и `audioSystem = null`.

- **[P3] `src/systems/Audio.js:98` — ошибочный комментарий о Phaser 3.90.**  
  Утверждается, что play-config `{volume}` не применяется, хотя конфигурация передаётся и применяется механизмом `BaseSound.play()`. На рантайм текущего кода не влияет, но закрепляет неверный контракт API. Это подтверждает и [документация Phaser 3.90 BaseSound](https://docs.phaser.io/api-documentation/3.90.0/class/sound-basesound).

### Кратко

- События SFX, музыкальные переходы, fade crawl, mute и очистка сценовых/global-listeners в основном реализованы корректно.
- Секретов, API-ключей или приватных токенов в diff нет.
- В снимке `aff0c17` отсутствуют mp3 и их preload. Не считаю это отдельной находкой, поскольку код явно относит их к отдельному FUN‑22; если коммит должен быть самостоятельно deployable, это становится P1 — все `cache.exists()` возвращают false и аудио полностью беззвучно.

### Изменённые файлы

- Нет — аудит read-only.

### Проверки

- Прочитаны полный `git show aff0c17` и релевантные разделы SPEC.
- `node --check`: все 14 изменённых JS-файлов прошли.
- `git diff --check`: чисто.
- Выполнен secret-pattern scan.
- LightRAG был недоступен по сети; Serena не обнаружила активного language server, поэтому использованы Git/`rg` и официальные исходники Phaser.

### Git/GitHub

- Ветка: `main`.
- Рабочее дерево чистое.
- Связанных issue/PR не проверялось — задача относится к локальному коммиту.

## Disposition

- **[P2] `getAudio()` = null в первом `TitleScene.create()` → ЗАКРЫТО на HEAD.** Аудит верен для снимка `aff0c17` (у BootScene тогда не было `preload`, и Boot синхронно стартовал Title). Коммит `0065162` (FUN-22) включил предзагрузку 22 аудиофайлов — Boot стал асинхронным, и `initAudio` по событию `ready` успевает до `TitleScene.create()`. Проверено в браузере на Phaser 3.90: на титульнике `audioReady: true`, `currentTrack: 'title'`, `isPlaying: true`, флаг мьюта прочитан.
- **[P3] Синглтон переживает `game.destroy()` → ИСПРАВЛЕНО** в `968bb3d` (сброс `audioSystem` по событию `destroy` игры; проверено в браузере).
- **[P3] Неверный комментарий о play-config → ЗАКРЫТО** коммитом `46018ae` (его собственный аудит — PASS).
