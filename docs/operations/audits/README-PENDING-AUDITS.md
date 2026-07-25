# ⚠️ ОТЛОЖЕННЫЕ CODEX-АУДИТЫ — M7, M8, M9 (17 коммитов)

**Статус:** НЕ ВЫПОЛНЕНЫ. Создано 2026-07-25 при закрытии сессии.

**Причина:** у владельца исчерпан лимит Codex — аудит-гейт `close-session` (Phase 3)
пропущен **по явному решению владельца**, не по недосмотру исполнителя.

**Что это значит:** каждый коммит сессии по контракту `close-session` должен нести запись
`docs/operations/audits/<short-sha>-codex-audit.md`. Для 17 коммитов ниже записи нет.
Вердикт закрытия сессии — **BLOCK 🛑 по одному пункту (аудит-гейт)**; остальные фазы чистые.
Это долг, а не потеря: код запушен, приёмка SPEC §16 пройдена (локально + на проде),
юнит-тесты зелёные — но независимой проверки Codex по этим коммитам НЕТ.

## Коммиты без аудита (в порядке от старого к новому)

Диапазон: `628a162..965b18e` (последний аудированный — `628a162`, M5+M6).

| # | SHA | Коммит |
|---|---|---|
| 1 | `be668f7` | FUN-21: ElevenLabs offline audio generation script |
| 2 | `aff0c17` | FUN-23: audio system — event SFX, scene/wave music, M mute |
| 3 | `46018ae` | FUN-23 followup: correct volume-config comment |
| 4 | `74cbd67` | docs: M7 audio FUN-21/23 done — status + handoff |
| 5 | `c2ba43e` | FUN-21 followup: clamp duration_seconds to API range |
| 6 | `0065162` | FUN-22: 22 generated audio files + BootScene preload |
| 7 | `0037612` | docs: M7 audio complete — status + M8 handoff |
| 8 | `926ee60` | docs: qualify M7 audio acceptance (headless ≠ слышимая) |
| 9 | `f894508` | FUN-25: Golden Throne boss + endless-cycle score ×c |
| 10 | `3c05323` | chore: Apache 2.0 license |
| 11 | `16f9462` | FUN-25 followup: phase-2 ×1.3 covers ALL kinematics |
| 12 | `a097fe8` | chore: NOTICE — copyright holder |
| 13 | `85a68de` | docs: M8 done — status + M9 handoff |
| 14 | `830abf5` | docs: M9 local acceptance done |
| 15 | `eab5f65` | FUN-26: suppress favicon.ico 404 (data: icon) |
| 16 | `dcaee3a` | FUN-26: real favicon — ship sprite → 32×32 PNG |
| 17 | `965b18e` | docs: project complete — all 26 tickets Done |

Приоритет при возобновлении: сначала коммиты с кодом (`be668f7`, `aff0c17`, `46018ae`,
`c2ba43e`, `0065162`, `f894508`, `16f9462`, `dcaee3a`), затем docs/chore.

## Как выполнить, когда лимит восстановится

Для каждого SHA:

```bash
codex exec "Аудит коммита <SHA> в репозитории Pissuarius. Прочитай diff (git show <SHA>) \
и оцени: соответствие docs/SPEC.md, корректность, edge-cases, утечки ресурсов/слушателей, \
секреты. Верни находки как [P1]/[P2]/[P3] с файлом:строкой и вердикт." \
  -C "$(pwd)" -s read-only \
  -c 'model="gpt-5.6-sol"' -c 'model_reasoning_effort="high"' \
  --enable web_search_cached < /dev/null | tee docs/operations/audits/<SHA>-codex-audit.md
```

Затем: `[P1]` — чинить немедленно; `[P2]` — чинить или занести в `status.md` «Known issues»
с TODO; собрать записи в ОДИН audit-only коммит (только пути
`docs/operations/audits/*-codex-audit.md`) и удалить этот файл.

## Что уже проверено без Codex (не заменяет аудит)

- Юнит-тесты: 115 (FUN-21) + 61 (FUN-23) + 58 (FUN-25) + 25 (M8 эффекты/×c) — зелёные.
- Браузерный smoke на реальном Phaser 3.90: M7 (аудио), M8 (Трон/цикл), M9 (полный §16).
- Прод-прогон §16 на GitHub Pages: ноль ошибок консоли, ноль ответов ≥400.
- Баланс-проход §4/§6/§7 двумя read-only проходами: расхождений нет.
- Секрет-скан: `git grep sk_` по трекнутым файлам — только плейсхолдер `.env.example`.
