# Codex audit — f894508

- **Commit:** `f894508` — FUN-25: Golden Throne boss — 5-attack rotation of all boss signatures, gold glow, phase-2 6s windows x1.3; endless-cycle score multiplier x c (SPEC §7.6/§6)
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** VERDICT: ITERATE — 0 P1, 4 P2, 0 P3.

## Findings (verbatim)

Строки ниже относятся к post-image коммита `f894508`.

### Находки

- [P2] [src/entities/BossGoldenThrone.js:168](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:168) — фаза 2 не ускоряет все движения согласно SPEC §7.6 «все скорости ×1.3». Sway остаётся с периодом 2.5 s; возврат после плюха на строке 352 остаётся 2.0 s; горизонтальная фаза зигзага отродий на строке 467 также не масштабируется. Вердикт: исправить. Это уже закрыто последующим коммитом `16f9462`.

- [P2] [src/entities/BossGoldenThrone.js:334](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:334), [src/entities/BossGoldenThrone.js:529](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:529) — смена фазы во время падения или полёта ключа вызывает скачок позиции. Накопленный при `×1` `seqTimer`/`elapsed` делится на внезапно уменьшенную длительность `base / 1.3`: при половине пути прогресс мгновенно меняется `0.5 → 0.65`, а поздний переход может сразу завершить движение и активировать удар. Вердикт: исправить инкрементным прогрессом. Закрыто в `16f9462`.

- [P2] [src/main.js:168](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/main.js:168) — бесконечный цикл не уничтожает завершённых боссов и накапливает слушатели. Каждый новый Трон добавляется в `scene.bosses`; `BossBase.die()` лишь деактивирует его, а `WaveDirector.advance()` обнуляет ссылку, не вызывая `destroy()`/`remove()`. Одновременно зарегистрированный в `BossBase.js:56` одноразовый `SHUTDOWN`-listener продолжает удерживать экземпляр. Вердикт: исправить; память, physics-group и listeners растут на один объект за цикл.

- [P2] [src/entities/BossGoldenThrone.js:461](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:461), [src/entities/BossGoldenThrone.js:474](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:474) — убитые и ушедшие за экран отродья удаляются только из `this.brood`. Они остаются в `scene.enemies` и display list: `onCleanup()` уничтожает лишь записи, всё ещё присутствующие в `this.brood`. В долгом бою/бесконечном режиме это неограниченно накапливает игровые объекты. Вердикт: исправить через `destroy()` или настоящее пуллирование.

### Итог

**VERDICT: ITERATE — 0 P1, 4 P2, 0 P3.**

Секретов в diff не найдено: добавлены только JS-файлы, совпадений по ключам, токенам, private-key блокам и секретным именам файлов нет.

Кратко:

- соответствие SPEC по скорингу `×c`, HP/очкам, ротации и базовым атакам в целом корректно;
- блокируют принятие коммита неполная фазовая кинематика, скачки при смене фазы и две утечки ресурсов.

Изменённые файлы:

- файлы не изменялись — аудит read-only.

Проверки:

- `git diff --check` — чисто;
- `node --check` для трёх изменённых JS-модулей — успешно;
- secret-pattern scan — чисто;
- тестов для корневой игры в репозитории не найдено;
- Serena не смогла запустить символический анализ: JS language server отсутствует.

Git/GitHub:

- ветка `main`, рабочее дерево чистое;
- текущий HEAD `3f1d21c`; коммит `f894508` входит в историю;
- GitHub/PR-контекст не требовался.

## Disposition

- **[P2] Фаза 2 масштабирует не все кинематики → ЗАКРЫТО** коммитом `16f9462` (его аудит — PASS: ×1.3 применён к sway, падению/возврату, зигзагу отродий и полёту ключа).
- **[P2] Скачок позиции при смене фазы посреди падения/полёта ключа → ЗАКРЫТО** там же: прогресс копится инкрементно (`seqProgress`, `w.progress`), а не пересчитывается от новой длительности.
- **[P2] Побеждённые боссы копятся в `scene.bosses` + SHUTDOWN-слушатель на каждом → ИСПРАВЛЕНО** в `64c39bf`: `WaveDirector.advance()` уничтожает босса, `BossBase.preDestroy()` снимает слушатель. Проверено в браузере: после смерти босса группа пуста, спрайта нет в display list, слушателей 18→17.
- **[P2] Отродья остаются в `scene.enemies` → ИСПРАВЛЕНО** в `64c39bf` (обе ветки `updateBrood` — и убитые, и ушедшие за край). Проверено: прирост `scene.enemies` после полного цикла отродий равен нулю.
