# Codex audit — f691893

- **Commit:** `f691893` — docs: открытые вопросы переехали в GitHub Issues, константы — в SPEC §17
- **Auditor:** codex `gpt-5.6-sol`, reasoning=high, `-s read-only`
- **Date:** 2026-07-25
- **Verdict (codex):** REQUEST CHANGES — 3×P2 (SPEC §17 переоценивал полноту).

## Findings (verbatim)

Вердикт: **REQUEST CHANGES** — 3×[P2], без [P1]/[P3].

- **[P2] [docs/SPEC.md:910](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/SPEC.md:910)** — §17 заявляет восстановление принципа «чего в SPEC нет — не существует», но `LANDING_Y = 230` остаётся только в [BossBigMacaque.js:29](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossBigMacaque.js:29) и issue #2. Реализацию зоны приземления невозможно воспроизвести из нормативного SPEC. Нужно либо зафиксировать временное значение в SPEC, либо не заявлять его полноту.

- **[P2] [docs/SPEC.md:920](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/SPEC.md:920)** — «интервал топота 5.0 s» не соответствует фактическому периоду старт-к-старту. В [BossPlumber.js:188](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossPlumber.js:188) таймер растёт только в `idle` и останавливается на время 0.7-секундного прыжка, поэтому реальный период ≈5.7 s плюс фазовые паузы. Следует указать «5 s простоя» либо изменить таймер.

- **[P2] [docs/SPEC.md:926](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/docs/SPEC.md:926)** — «кадансы как у боссов-владельцев» неоднозначно и расходится с фазой 2 реализации. Трон сохраняет фиксированные 2/3/5/4 s в обеих фазах, тогда как исходные боссы ускоряются; плюх выполняется один раз на окно. Это видно в [BossGoldenThrone.js:23](/Users/aleksejsupilin/Documents/GitHub/Pisuarius/src/entities/BossGoldenThrone.js:23). Нужна явная таблица кадансов и поведения по фазам.

Кратко:

- Issues #1–#9 и фильтры GitHub проверены.
- Исполняемый код коммит не меняет: новых утечек таймеров/слушателей нет.
- Секретов и похожих на ключи значений в diff не обнаружено.

Измененные файлы:

- Аудит выполнялся read-only; файлы не изменялись.

Проверки:

- `git diff --check f691893^ f691893` — PASS.
- `node scripts/validate_sprites.mjs` — PASS.
- `node scripts/generate_audio.mjs --dry-run` — PASS, шесть коротких SFX действительно клампуются до 0.5 s.

Git/GitHub:

- Ветка `main`, на 3 коммита впереди `origin/main`.
- Существуют прежние незакоммиченные изменения в `CLAUDE.md` и два audit-файла; аудит их не трогал.
- Связанного PR нет.

## Disposition

- **[P2] §17 заявлял полноту, но `LANDING_Y = 230` жил только в коде → ИСПРАВЛЕНО** в `336b011`: значение внесено в §17 как действующий контракт до пересмотра, заявка на пересмотр — issue #2.
- **[P2] «Интервал топота 5.0 s» не соответствует реальному периоду → ИСПРАВЛЕНО** в `336b011`: записано «5.0 s простоя», указан период старт-к-старту ≈5.7 s и оговорена граница фаз.
- **[P2] «Кадансы как у боссов-владельцев» неоднозначно и неверно для фазы 2 → ИСПРАВЛЕНО** в `336b011`: добавлена явная таблица кадансов Трона (2/3/5/4 s, плюх — раз за окно) с оговоркой, что фаза 2 меняет окно и скорости, но не значения кадансов.
