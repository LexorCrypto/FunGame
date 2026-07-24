# SPEC — Pissuarius (FunGame)

**Назначение.** Нормативный документ исполнителя: ТОЧНО КАК строить игру.
Каждое число здесь — обязательное, не примерное. Чего здесь нет — не существует.
Концепты и обоснования — в `docs/PRD.md`, термины — в `CONTEXT.md`.

**Стек:** Phaser 3.90.0 (CDN, пин), vanilla JS ES-модули, без сборки.
Поле 480×270, pixelArt, `Phaser.Scale.FIT`, `autoCenter: CENTER_BOTH`.

---

## 1. Поле, зоны, HUD

Система координат: логическая 480×270, начало — левый верхний угол, y вниз.

| Зона | Область (px) | Назначение |
|---|---|---|
| HUD | y 0–20 | счёт, рекорд, жизни, волна, бонусы |
| Полоса босса | y 22–28 | HP-бар босса (только в босс-волнах) |
| Формация | y 36–124, sway ±20 по x | строй врагов |
| Середина | y 124–176 | пролёт пикирующих, зона якоря Сушки |
| Зона игрока | y 176–270 | движение корабля (нижняя треть) |

Масштаб: целочисленный zoom (3× при 1440×810 и т.п.), `roundPixels: true`,
`image-rendering: pixelated` для canvas в CSS.

**HUD (y 0–20):** слева `СЧЁТ 000000` (x 8), по центру `РЕКОРД 000000` (x 240),
справа иконки жизней (x 440..472, шаг 16). Под HUD слева: `ВОЛНА n` (x 8, y 24).
Активные пауэр-апы — иконка + полоска таймера (x 8, y 34).

**HP-бар босса:** 120×4 px, центр x=240, y=24. Фаза 1 — жёлтый (Y), фаза 2 — красный (R).

## 2. Корабль игрока

| Параметр | Значение |
|---|---|
| Размер спрайта | 16×16 |
| Хитбокс | 10×10, по центру спрайта |
| Скорость | 140 px/s (диагональ нормализуется) |
| Ограничение | x ∈ [8, 472], y ∈ [184, 262] (центр спрайта) |
| Спавн | (240, 240) |
| Жизни | 3 |
| Респаун | через 1.5 s после смерти, в точке спавна |
| Неуязвимость | 2.0 s после респауна, мерцание 8 Гц |
| Замедление (вантуз) | скорость ×0.5 на 3.0 s |

## 3. Огонь и снаряды

| Параметр | Игрок | Враги |
|---|---|---|
| Скорость снаряда | 300 px/s (вверх) | по типу, см. §4 |
| Кулдаун | 250 ms | — |
| Макс. снарядов на поле | 4 (8 с двойным выстрелом) | 12 суммарно |
| Хитбокс снаряда | 3×6 | 4×4 |
| Урон | 1 | 1 попадание = смерть игрока |

Двойной выстрел: два снаряда параллельно со смещением ±5 px по x от центра,
тот же кулдаун, один расход «заряда» не тратится — бонус по времени.

## 4. Враги: параметры и паттерны

Базовые очки: в формации / при пикировании (×2). Скорость снарядов врагов
дополнительно умножается на `1 + 0.05 × (акт − 1)`.

| Тип | HP | Очки | Скорость пикирования | Паттерн (точный) |
|---|---|---|---|---|
| Таракан | 1 | 50/100 | vy 170 | Зигзаг: `x(t) = x0 + 40·sin(6t)`, спуск до y=270, возврат в слот на 220 px/s |
| Писсуар | 1 | 60/120 | 150 к точке игрока | Диагональ на позицию игрока в момент старта; один выстрел-струя (110 px/s, прицельная) на y≈140; затем возврат |
| Какаха | 1 | 70/140 | vy 130 | Прямое падение до y=250 → взрыв: **лужа** 36×10, y 250–260, живёт 3.0 s (последние 0.5 s мигает), контакт = смерть |
| Туалет | 3 | 150/300 | vy 55 | Медленный спуск по x игрока; каждые 1.2 s — веер из 3 капель (80 px/s, ±25°); на y=200 разворот и возврат |
| Ёршик | 1 | 80/160 | разгон до 230 | Камикадзе: фиксирует позицию игрока на старте, летит по прямой, вращение 360°/s; гибнет о край поля или о игрока |
| Вантуз | 1 | 90/180 | 140 к y=150 | Зависает на y=150, один выстрел-присоска (85 px/s, прицельная) → попадание: замедление игрока 3.0 s; затем возврат |
| Плесень | 1 | 40/80 | vy 120 | В формации: каждые 8.0 s делится в соседний свободный слот (поколение ≤ 2, см. §5); пикирует прямым спуском |
| Сушка для рук | 2 | 100/200 | 130 к y=150 | Якорь на y∈[140,160] на 6.0 s: **зона ветра** 130×70 под ней — снаряды игрока внутри получают vx ±90 (от центра сушки); затем возврат |

**Дайв-дирижёр формации:** каждые `diveInterval` секунд выбирает случайного
врага из строя, если активных пикирующих < `maxDivers`. Пикирующий после
атаки возвращается в свой слот (220 px/s), если не убит.

Возврат в строй: враг летит к текущей позиции своего слота; столкновений
при возврате нет (неуязвим и не дамажит до слота).

## 5. Формация

- Сетка: **10 колонок × 4 ряда**, ячейка 24×18 px, верхний левый угол сетки — (120, 40).
- Покачивание: `x_off(t) = 20·sin(2π·t / swayPeriod)`, единое для всего строя.
- Слоты волн задаются таблицей §6; тип в слоте = тип из строки волны.
- **Плесень:** особь поколения g (старт g=0) каждые 8.0 s, если g < 2 и есть
  свободный соседний слот (4-связность), создаёт там копию поколения g+1.
  Жёсткий предел: 60 плесеней на волну.
- Строй не опускается и не ускоряется от потерь (это Galaxian, не Space Invaders).

## 6. Волны

Формат записи волны (`src/data/waves.js`):

```js
{
  rows: [ { type: 'cockroach', count: 10 }, ... ],  // ≤ 40 слотов суммарно
  swayPeriod: 4.0,      // s, период покачки
  diveInterval: 3.0,    // s между отрывами
  maxDivers: 1,         // одновременно пикирующих
  bulletSpeedMul: 1.0,  // дополнительный множитель снарядов волны
}
// либо босс: { boss: 'superToilet' }
```

Порядок заполнения сетки: строки `rows` идут сверху вниз, враги центрируются
в своём ряду.

| Волна | Состав (тип × кол-во) | sway | dive | divers | bsm |
|---|---|---|---|---|---|
| 1 | Таракан×8, Какаха×8 | 4.0 | 3.0 | 1 | 1.0 |
| 2 | Таракан×10, Писсуар×10 | 3.8 | 2.8 | 1 | 1.0 |
| 3 | Ёршик×8, Таракан×8, Какаха×8 | 3.6 | 2.6 | 2 | 1.0 |
| 4 | Туалет×8, Писсуар×10, Таракан×10 | 3.4 | 2.4 | 2 | 1.0 |
| 5 | **Босс: Супер-Туалет** | — | — | — | — |
| 6 | Вантуз×8, Таракан×8, Писсуар×8 | 3.4 | 2.4 | 2 | 1.05 |
| 7 | Плесень×8, Какаха×10, Ёршик×8 | 3.2 | 2.2 | 2 | 1.05 |
| 8 | Сушка×6, Писсуар×10, Таракан×12 | 3.0 | 2.2 | 3 | 1.05 |
| 9 | Туалет×8, Вантуз×8, Плесень×8, Ёршик×6 | 2.8 | 2.0 | 3 | 1.1 |
| 10 | **Босс: Большая Макака** | — | — | — | — |
| 11 | Сушка×8, Таракан×10, Какаха×12 | 2.8 | 2.0 | 3 | 1.1 |
| 12 | Плесень×10, Вантуз×10, Писсуар×12 | 2.6 | 1.9 | 3 | 1.15 |
| 13 | Туалет×10, Ёршик×10, Таракан×12 | 2.4 | 1.8 | 3 | 1.15 |
| 14 | Сушка×8, Туалет×10, Плесень×8, Вантуз×8 | 2.2 | 1.7 | 4 | 1.2 |
| 15 | **Босс: Супер-Какаха** | — | — | — | — |
| 16 | Таракан×12, Ёршик×10, Писсуар×12 | 2.2 | 1.6 | 4 | 1.2 |
| 17 | Плесень×10, Какаха×10, Сушка×8, Вантуз×8 | 2.0 | 1.5 | 4 | 1.25 |
| 18 | Туалет×12, Таракан×12, Ёршик×12 | 2.0 | 1.5 | 4 | 1.25 |
| 19 | Сушка×10, Туалет×10, Плесень×10, Вантуз×8 | 1.8 | 1.4 | 4 | 1.3 |
| 20 | **Босс: Королева Тараканов** | — | — | — | — |
| 21 | Ёршик×12, Таракан×12, Какаха×14 | 1.8 | 1.3 | 4 | 1.3 |
| 22 | Сушка×10, Вантуз×10, Плесень×10, Писсуар×10 | 1.6 | 1.2 | 4 | 1.35 |
| 23 | Туалет×12, Писсуар×14, Таракан×14 | 1.6 | 1.2 | 4 | 1.35 |
| 24 | Сушка×10, Туалет×10, Ёршик×10, Плесень×10 | 1.4 | 1.1 | 5 | 1.4 |
| 25 | **Босс: Злой Сантехник Пессимарио** | — | — | — | — |

**Бесконечный цикл** (после победы): цикл c = 1, 2, … — волны 21–24, затем
**Золотой Трон**. Модификаторы цикла: `swayPeriod × 0.9^c` (мин 1.4),
`diveInterval × 0.88^c` (мин 0.7), `bulletSpeed × 1.1^c`, очки × c.
HP врагов не растёт.

## 7. Боссы

Общее: контакт с боссом = смерть игрока; снаряды босса = 1 попадание = смерть;
переход во фазу 2 при HP ≤ 50%; при смене фазы — вспышка и 1.0 s пауза атак.
Очки за босса акта n: `1000 × n`. Золотой Трон: 10000.

### 7.1 Супер-Туалет (волна 5) — 100 HP

- Позиция: y=60, sway ±60 px по x, период 3.0 s.
- **Фаза 1:** веер из 5 капель (90 px/s, разброс ±30°) каждые 2.0 s;
  **смыв** каждые 8.0 s: воронка 3.0 s, тянет корабль к центру поля (30 px/s).
- **Фаза 2:** веер из 7 капель каждые 1.5 s; смыв каждые 6.0 s, 4.0 s;
  период sway 2.0 s.

### 7.2 Большая Макака (волна 10) — 160 HP

- Точки прыжка: x ∈ {60, 180, 240, 300, 420}, y=70. Зависание 2.5 s,
  прыжок 0.6 s (парабола).
- Приземление: телеграф-круг r=40 (контур, 0.5 s заранее), урон в круге 0.25 s.
- **Фаза 1:** во время зависания бросает 3 снаряда по дуге (гравитация 400 px/s²,
  начальная скорость к позиции игрока) каждые 3.0 s.
- **Фаза 2:** зависание 1.5 s, двойной прыжок, 5 снарядов каждые 2.5 s.

### 7.3 Супер-Какаха (волна 15) — 220 HP

- Нависает y=50, sway ±40, период 3.5 s.
- **Плюх** каждые 6.0 s: телеграф 1.0 s (дрожание), падение до y=200,
  при ударе — **волна-лужа** в обе стороны по зоне игрока (скорость 100 px/s,
  высота 12 px), в волне разрыв шириной 70 px, центр разрыва — случайный
  x ∈ [60, 420]. Возврат наверх 2.0 s.
- **Фаза 2:** плюх каждые 4.0 s, разрыв 50 px, при ударе — радиальный
  разбрызг из 6 капель (90 px/s).

### 7.4 Королева Тараканов (волна 20) — 260 HP

- Ползёт по y=45, x ±80, скорость 40 px/s.
- **Фаза 1:** каждые 5.0 s рождает 2 тараканов (1 HP, 50 очков), они сразу
  пикируют зигзагом; потолок живых отродий — 6.
- **Фаза 2:** каждые 4.0 s рождает 3, потолок 8; 30% отродий бронированные
  (2 HP, тинт 0x999999).

### 7.5 Злой Сантехник Пессимарио (волна 25) — 320 HP

- Единственный босс, заходящий в зону игрока: ходит/прыгает по всему полю,
  y ∈ [60, 230], скорость ходьбы 70 px/s.
- **Гаечный ключ** каждые 4.0 s: бумеранг к позиции игрока в момент броска
  (130 px/s), 0.9 s туда, возврат к боссу; хитбокс активен весь полёт.
- **Топот:** телеграф-круг r=30 на позиции игрока, 0.7 s → прыжок туда,
  урон при приземлении.
- **Фаза 2:** ключ каждые 3.0 s; **вантуз-бур** каждые 10.0 s на 3.5 s:
  конус 110 px перед боссом засасывает снаряды игрока и отражает их
  назад (становятся враждебными, скорость ×1.3).

### 7.6 Золотой Трон (бесконечный цикл) — 500 HP

- Парит y=55, sway ±50, период 2.5 s. Золотой, свечение (тинт-анимация).
- Ротация фирменных атак всех боссов: веер капель → дуговые снаряды →
  плюх с волной → призыв 2 тараканов → ключ-бумеранг. Каждая атака активна
  10.0 s, смена без паузы.
- **Фаза 2:** смена атаки каждые 6.0 s, все скорости ×1.3.

## 8. Пауэр-апы

| Бонус | Эффект | Индикация |
|---|---|---|
| Двойной выстрел | 2 снаряда за выстрел, 10.0 s | иконка + таймер-полоска в HUD |
| Щит | поглощает 1 попадание | кольцо вокруг корабля; не стакается, обновляется до 1 |

Выпадение: 8% шанс из убитого **пикирующего** врага (60% выстрел / 40% щит).
Падает со скоростью 60 px/s, подбирается касанием; за краем поля — пропадает.

## 9. Скоринг и рекорды

- Очки по таблице §4; пикирующий ×2; боссы — §7.
- **Бонус чистой волны:** волна без потери жизни: `+250 × акт`.
- Всплывающий текст `+N` у места убийства, 0.6 s, подъём на 12 px.
- Топ-10: `localStorage["pissuarius_hiscores"]` = JSON `[{name, score, wave}]`,
  сортировка по убыванию; ввод 3 букв (A–Z) при попадании в топ: ↑/↓ выбор,
  пробел — подтвердить символ.
- Язык: `localStorage["pissuarius_lang"]` = `"ru" | "en"`.
- Мьют: `localStorage["pissuarius_mute"]` = `"0" | "1"`.

## 10. Эффекты

- Взрыв врага: 8–12 частиц (квадраты 2×2 цвета спрайта), разлёт 40–90 px/s,
  жизнь 0.4 s, гашение скорости ×0.9.
- Смерть корабля: 20 частиц + тряска экрана 6 px / 0.5 s.
- Попадание по боссу: белая вспышка спрайта 0.08 s; тряска 2 px / 0.15 s
  при смене фазы.
- Неуязвимость: мерцание видимости 8 Гц.
- Звёздный фон: 3 слоя (30/20/12 звёзд), скорости 10/25/45 px/s вниз,
  яркость 0.4/0.7/1.0.

## 11. Спрайты

Все спрайты строятся кодом из пиксельных схем ниже (`src/data/sprites.js`).
Символ → цвет палитры. Схемы даны без прозрачных полей: текстура обрезается
по содержимому, якорь — центр. Кадры анимации перечислены подряд (A, B).

### Палитра

| Символ | Цвет | Роль |
|---|---|---|
| `.` | transparent | фон |
| `K` | #1a1c2c | контур |
| `W` | #f4f4f4 | фарфор/белый |
| `S` | #8a94a6 | серый металл |
| `G` | #5a6572 | тёмный металл |
| `B` | #3fa7f5 | вода/синий |
| `D` | #27406b | тёмно-синий |
| `P` | #59d6e6 | циан |
| `Y` | #ffd94d | жёлтый |
| `O` | #f5893d | оранжевый |
| `R` | #c23b4e | красный |
| `N` | #7a4a2b | коричневый |
| `n` | #a9703f | светло-коричневый |
| `E` | #6fdc63 | зелёный |
| `F` | #b45fd9 | пурпур |

### Корабль (16×16, 2 кадра — мерцание пламени)

Кадр A:
```
.......KK.......
......KWWK......
......KPPK......
.....KWWWWK.....
....KWWBWWK.....
....KWWBWWK.....
...KWWWBBWWWK...
..KWWKWWWWKWWK..
..KWKKWWWWKKWK..
.KWKSSSSSSSSKWK.
.KWKSSSSSSSSKWK.
.KKSSSKSSSKSSKK.
....KSSSSSSK....
.....KYYYYK.....
......YOOY......
.......OO.......
```
Кадр B: строки 14–16 заменить на:
```
......YYYY......
......YOOY......
................
```

### Таракан (16×16, 2 кадра — перебор ног)

Кадр A:
```
...K........K...
....K......K....
.....KNNNNK.....
...KKNNNNNNKK...
..KNNNNNNNNNNK..
.KNNNnnnnNNNNNK.
K.NNNNNNNNNNNN.K
K.KNNNNNNNNNNK.K
.K.KNNNNNNNNK.K.
.K..KNNNNNNK..K.
K....KNNNNK....K
......KNNNNK....
......KNNNNK....
.......KNNK.....
```
Кадр B: ноги сдвинуты на ряд вверх — строки 5–9 заменить на:
```
K.NNNnnnnNNNNN.K
.KNNNNNNNNNNNNK.
K.KNNNNNNNNNNK.K
.K.KNNNNNNNNK.K.
K..KNNNNNNK...K.
```

### Писсуар (16×16, 2 кадра — блик воды)

Кадр A:
```
..KKKKKKKKKK..
.KWWWWWWWWWWK.
.KWWWKKKKWWWK.
.KWWWKSSKWWWK.
.KWWWKKKKWWWK.
.KWWWWWWWWWWK.
.KWWWKWWKWWWK.
..KWWKWWKWWK..
..KWWKBBKWWK..
..KWWKBBKWWK..
...KWKBBBKWK..
....KWKBBKWK..
.....KKKKKK...
```
Кадр B: в строках 9–11 символы `B` заменить на `P`.

### Какаха (16×16, 2 кадра — покачивание)

Кадр A:
```
......KK........
.....KNNK.......
....KNNNNK......
...KNWWNNWWNK...
..KNNNNNNNNNNK..
.KNnNNNNNNnNK...
.KNNNNNNNNNNNNK.
KNNNNNNNNNNNNNNK
.KKKKKKKKKKKKKK.
```
Кадр B: строки 1–3 сдвинуть на 1 px вправо (кончик качается):
```
.......KK.......
......KNNK......
.....KNNNNK.....
....KNWWNNWWNK..
```

### Туалет (16×16, 2 кадра — вода в чаше)

Кадр A:
```
.KKKKKKKKKK.....
.KWWWWWWWWK.....
.KWKWWWWKWK.....
.KWWWWWWWWK.....
.KKKKKKKKKK.....
...KWWWWK.......
..KKWWWWKK......
.KWWKWWKWWK.....
.KWKBBBBKWK.....
.KWKBBBBWKK.....
.KKWBBBBWK......
.KKKWWWWKKK.....
..KWWWWWWK......
..KKKKKKKK......
```
Кадр B: в строках 9–11 `B` → `P`.

### Ёршик (16×16, 1 кадр; вращение 360°/s кодом)

```
......KK........
......KRK.......
......KRK.......
......KRK.......
......KRK.......
......KRK.......
.....KSSK.......
....KSSSSK......
....KSSSSSSK....
....KSKSSKSK....
....KSSSSSSK....
....KKKKKKKK....
```

### Вантуз (16×16, 2 кадра — присоска дышит)

Кадр A:
```
......KK........
......KNK.......
......KNK.......
......KNK.......
......KNK.......
.....KNNK.......
....KKRRKK......
...KRRRRRRK.....
..KRRRRRRRRK....
.KRRRRRRRRRRK...
.KKRRRRRRRRKK...
..KKKKKKKKKK....
```
Кадр B: строки 8–10 заменить (чаша чуть сплющена):
```
..KRRRRRRRRRRK..
.KKRRRRRRRRRRK..
.KKKKKKKKKKKK...
```

### Плесень (16×16, 2 кадра — пульс)

Кадр A:
```
....KK...KK.....
...KEEK.KEEK....
..KEEEKEEEEK....
..KEKEEEEEEKEK..
..KEEEEKEEEEEK..
..KEKEEEEEEEKEK.
...KKEEEEEEKK...
....KKKKKKKK....
```
Кадр B (шире на 1 px):
```
...KKK...KKK....
..KEEEK.KEEEK...
.KEEEEKEEEEEK...
.KEKKEEEEEEKKEK.
.KEEEEEKEEEEEEK.
.KEKKEEEEEEKKEK.
..KKEEEEEEEKK...
...KKKKKKKKK....
```

### Сушка для рук (16×16, 2 кадра — поток воздуха)

Кадр A:
```
.KKKKKKKKKKKK...
.KSSSSSSSSSSK...
.KSKKKKKKKKSK...
.KSSSSSSSSSSK...
.KSSGGGGGGSSK...
..KKKGGGGKKK....
....KGGGGK......
....KGGGGK......
...P..PP..P.....
..P..PP..P......
```
Кадр B: строки 9–10 заменить на:
```
....P..PP..P....
...P..PP..P.....
```

### Боссы (32×32, по 1 кадру + дельта второго)

**Супер-Туалет:**
```
........KKKKKKKKKKKKKKKK........
......KKWWWWWWWWWWWWWWWWKK......
.....KWWWWWWWWWWWWWWWWWWWWK.....
.....KWWKKKKWWWWWWWWKKKKWWK.....
.....KWKRRKWWWWWWWWWWKRRKWK.....
.....KWKKKKWWWWWWWWWWKKKKWK.....
.....KWWWWWWWKKKKKKWWWWWWWK.....
.....KWWWWWWWWWWWWWWWWWWWWK.....
...KKWWWWWWWWWWWWWWWWWWWWWWKK...
...KWWWWWWWWWWWWWWWWWWWWWWWWK...
...KKKKKKKKKKKKKKKKKKKKKKKKKK...
......KKWWWWWWWWWWWWWWWWKK......
....KKWWWWWWWWWWWWWWWWWWWWKK....
.....KWWWKWWWWWWWWWWWWKWWWK.....
.....KWWWKWBBBBBBBBBBWKWWWK.....
....KWWKKWBBBBBBBBBBBBWKKWWK....
......KWKKWBBBBBBBBBBWKKWK......
......KWKKWBBBBBBBBBBWKKWK......
.......KWKKWWBBBBBBWWKKWK.......
.......KWWKKWWWWWWWWKKWWK.......
.......KWWWKWWWWWWWWKWWWK.......
........KWWWWWWWWWWWWWWK........
.........KWWWWWWWWWWWWK.........
.........KKKKKKKKKKKKKK.........
```
Кадр B: строка 17 → `......KWKKWPBBBBBBBBPWKKWK......` (блик воды).

**Большая Макака:**
```
........KKKK........KKKK........
......KNNNNK........KNNNNK......
.....KNnnNK..KKKKKK..KNnnNK.....
.....KNNNNK.KNNNNNNK.KNNNNK.....
......KKKK.KNNNNNNNNK.KKKK......
..........KNNnnnnnnNNK..........
........KNNnnWWnnWWnnNNK........
........KNNnnWKnnWKnnNNK........
.........KNNnnnnnnnnNNK.........
.........KNnnnKKKKnnnNK.........
..........KNnKRRRRKnNK..........
..........KNNnKKKKnnNK..........
.....KK....KNNNNNNNNK....KK.....
....KNNK..KNNNNNNNNNNK..KNNK....
....KNnNK.KNNNnnnnNNNK.KNnNK....
....KNnNKKNNNnnnnnnNNNKKNnNK....
...KNNNNNNNNNNnnnnnnNNNNNNNNK...
...KNNNNNNNNnnnnnnNNNNNNNNNNK...
....KNNNNNnnnnnnnnNNNNNNNNNK....
.......KNNNNNnnnnnnNNNNNK.......
........KKNNNNNNNNNNNNKK........
.......KNNNKKKKKKKKKKNNNK.......
.......KNNNK........KNNNK.......
.......KKKKK........KKKKK.......
```
Кадр B: строка 10 → `.........KNnnKKKKKKnnNK.........` (рот открыт при броске).

**Супер-Какаха:**
```
...............YY...............
..............Y..Y..............
........KKKKKYYYYYKKKKK.........
.......KNNNNNNNNNNNNNNNNK.......
......KNNNNNNNNNNNNNNNNNNK......
.....KNNNNNNNNNNNNNNNNNNNNK.....
.....KNNNWWNNNNNNNNNNWWNNNK.....
.....KNNNWKNNNNNNNNNNKWNNNK.....
.....KNNNNNNNNNNNNNNNNNNNNK.....
....KNnNNNNNNNKKKKNNNNNNNnNK....
....KNNNNNNNNKRRRRKNNNNNNNNK....
....KNNNNNNNNNKKKKNNNNNNNNNK....
....KNNnNNNNNNNNNNNNNNNNnNNK....
.KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.
.KNnNNNNNNNNNNNNNNNNNNNNNNNnNNK.
..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..
```
Кадр B: строки 7–8 (глаза) сдвинуть на 1 px вправо.

**Королева Тараканов:**
```
K..............YY..............K
.K.............YY..........K....
..KK........KYYYYK........K..K..
...K......KYYYYYYK......KNNNK...
...K.....KKKKKKKK......KNnnnNK..
.....KKKNnNKNnNKKKKNnnnnnNK.....
....KNNNNNNNNNNKNNNnnnnnnnNK....
...KNnNNNNNNNNNNNNNNnnnnnNNNK...
..KNNnNNnNNnNNnNNnNNnNNnNNnNNK..
..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..
..K.K.K.K.K.K.K.K.K.K.K.K.K.K...
...K.K.K.K.K.K.K.K.K.K.K.K.K....
```
Кадр B: строки 11–12 (ноги) сдвинуть на 1 px влево.

**Злой Сантехник Пессимарио:**
```
............KKKKKKKK............
..........KKRRRRRRRRKK..........
.........KRRRRRRRRRRRRK.........
.........KKKKKKKKKKKKKK...KSSK..
.........KnnnnnnnnnnnnK.KSSSK...
.........KnWKnnnnnKKnK..KSSK....
.........KnnnnnnnnnnnnK.KSSK....
.........KnnnNNNNNNnnK.KSSK.....
.........KnnnnnnnnnK.KSSK.......
.......KKRRRRRRRRRRRKK.KSSK.....
......KRWKRRRRRRRRRRWKKSSK......
......KRRKBBBBBBBBKRRKSSK.......
......KRRKBBYBBYBBKRRKSSK.......
......KRRKBBBBBBBBKRRK..SSK.....
......KKBBBBBBBBBBKK..SSK.......
..........KBBBBBBBBBBK..........
..........KBBBBKKBBBBK..........
.........KBBBKK..KKBBBK.........
.........KNNNK....KNNNK.........
........KNNNNK....KNNNNK........
........KKKKK......KKKKK........
```
Кадр B: строки 4–8 (рука с ключом) опущены: ключ в строках 8–12.

**Золотой Трон:**
```
........KKKKKKKKKKKKKKKK........
......KKYYYYYYYYYYYYYYYYKK......
.....KYYYYYYYYYYYYYYYYYYYYK.....
.....KYYKKKKYYYYYYYYKKKKYYK.....
.....KYKFFKYYYYYYYYYYKFFKYK.....
.....KYKKKKYYYYYYYYYYKKKKYK.....
.....KYYYYYYYKKKKKKYYYYYYYK.....
.....KYYYYYYYYYYYYYYYYYYYYK.....
...KKYYYYYYYYYYYYYYYYYYYYYYKK...
...KYYYYYYYYYYYYYYYYYYYYYYYYK...
...KKKKKKKKKKKKKKKKKKKKKKKKKK...
......KKYYYYYYYYYYYYYYYYKK......
....KKYYYYYYYYYYYYYYYYYYYYKK....
.....KYYYKYYYYYYYYYYYYKYYYK.....
.....KYYKYKFFFFFFFFFFYKYYYK.....
....KYYKKYFFFFFFFFFFFFYKKYYK....
......KYKKYFFFFFFFFFFYKKYK......
......KYKKYFFFFFFFFFFYKKYK......
.......KYKKYYFFFFFFYYKKYK.......
.......KYYKKYYYYYYYYKKYYK.......
.......KYYYKYYYYYYYYKYYYK.......
........KYYYYYYYYYYYYYYK........
.........KYYYYYYYYYYYYK.........
.........KKKKKKKKKKKKKK.........
```
Кадр B: строка 17 → `......KYKKYFFPFFFFFPFYKKYK......` (сияние самоцвета).

### Снаряды и бонусы

Снаряд игрока (4×6):
```
.KK.
KPPK
KWWK
KWWK
KPPK
.KK.
```
Капля врага (4×4): `.KK.` / `KBBK` / `KBBK` / `.KK.`
Струя писсуара (4×6): `.KK.` / `KBBK` / `KBBK` / `KBBK` / `KBBK` / `.KK.`
Присоска вантуза (6×6):
```
..KK..
.KRRK.
KRRRRK
KRRRRK
.KKKK.
```
Ключ Пессимарио (8×8):
```
.KK...KK
KSSKKSSK
KSSSSSSK
.KSSSSK.
..KSSK..
..KSSK..
..KSSK..
..KSSK..
```
Снаряд-какаха макаки (6×6):
```
..KK..
.KNNK.
KNNNNK
KNnNNK
KNNNNK
.KKKK.
```
Пауэр-ап «Двойной выстрел» (12×12):
```
...KK..KK...
..KYYKKYYK..
..KYYKKYYK..
..KYYKKYYK..
..KYYKKYYK..
..KYYKKYYK..
...KK..KK...
```
Пауэр-ап «Щит» (12×12):
```
....KKKK....
..KKPPPPKK..
.KPPKKKKPPK.
.KPK....KPK.
.KPK....KPK.
.KPPK..KPPK.
..KPPKKPPK..
...KKKKKK...
```
Лужа и зона ветра — не спрайты: рисуются `Phaser.Graphics`
(лужа — скруглённый прямоугольник N с обводкой K; ветер — полупрозрачный
белый прямоугольник + движущиеся штрихи).

## 12. Аудио

**Всё аудио генерируется офлайн через ElevenLabs** и коммитится в
`assets/audio/` как mp3 (44.1 kHz). Стиль всех промптов: качественно,
но в 8-битном ретро-формате. Ключ — только через env `ELEVENLABS_API_KEY`.
Скрипт генерации — `scripts/generate_audio.mjs` (node 18+, запуск:
`ELEVENLABS_API_KEY=... node scripts/generate_audio.mjs`).
Эндпоинты: SFX — `POST /v1/sound-generation` (поля `text`,
`duration_seconds`); музыка — `POST /v1/music` (поля `prompt`,
`music_length_ms`). Если в актуальной версии API поля отличаются —
использовать ближайший эквивалент из официальной документации.

### SFX (16 файлов)

| Файл | Длит. (s) | Промпт |
|---|---|---|
| sfx_shoot.mp3 | 0.3 | 8-bit chiptune laser zap, punchy retro arcade blaster shot, high quality |
| sfx_hit.mp3 | 0.2 | short 8-bit impact blip, retro arcade hit confirm, high quality |
| sfx_enemy_explode.mp3 | 0.5 | 8-bit crunchy noise explosion, retro arcade enemy pop, high quality |
| sfx_player_death.mp3 | 1.2 | 8-bit descending explosion with falling pitch whine, dramatic retro arcade death |
| sfx_flush.mp3 | 1.0 | comical toilet flush whoosh rendered in 8-bit chiptune style, swirling water |
| sfx_stream.mp3 | 0.4 | short cartoon water squirt, 8-bit retro game style |
| sfx_splat.mp3 | 0.4 | wet squishy splat, 8-bit retro game style |
| sfx_dryer.mp3 | 0.8 | air blower whoosh, 8-bit retro game style, hand dryer |
| sfx_plunger.mp3 | 0.5 | rubber plunger pop and squelch, 8-bit cartoon game style |
| sfx_wrench.mp3 | 0.7 | spinning metallic whoosh with soft clang, 8-bit retro game style |
| sfx_powerup.mp3 | 0.8 | cheerful 8-bit power-up jingle, rising arpeggio, high quality |
| sfx_shield.mp3 | 0.5 | 8-bit energy shield bubble pop, retro arcade |
| sfx_wave_clear.mp3 | 1.0 | cheerful 8-bit level clear ding arpeggio, retro arcade |
| sfx_roach_spawn.mp3 | 0.4 | chittering insect skitter, 8-bit retro game style |
| sfx_boss_hit.mp3 | 0.3 | 8-bit heavy impact thud, boss damage, retro arcade |
| sfx_phase.mp3 | 0.8 | 8-bit alarm riser, boss enrage sting, retro arcade |

### Музыка (6 файлов, ElevenLabs Music)

| Файл | Длит. | Промпт |
|---|---|---|
| music_title.mp3 | 30 s, loop | Heroic 8-bit chiptune title theme, catchy square-wave melody over driving bass, retro arcade, seamless loop, instrumental |
| music_battle.mp3 | 45 s, loop | Energetic 8-bit chiptune battle loop, driving eighth-note bassline, punchy drums, retro arcade shooter, seamless loop, instrumental |
| music_boss.mp3 | 40 s, loop | Intense 8-bit chiptune boss battle loop, minor key, fast arpeggios, urgent drums, seamless loop, instrumental |
| music_crawl.mp3 | 60 s | Epic space-opera opening overture in 8-bit chiptune style, triumphant brass-like fanfare, soaring heroic melody, galactic adventure, instrumental |
| music_victory.mp3 | 8 s | Short triumphant 8-bit fanfare, rising major arpeggio finale, retro arcade |
| music_gameover.mp3 | 6 s | Sad descending 8-bit jingle, retro game over |

Громкости (WebAudio gain): музыка 0.5, SFX 0.8; мьют по `M` — общий gain 0,
флаг в `localStorage["pissuarius_mute"]`.

## 13. Интро-заставка (crawl)

После нажатия «Играть» на титульнике — **заставка в духе Звёздных Войн**:
жёлтый текст (#ffd94d) на звёздном фоне медленно уходит вверх с перспективой
(масштаб строки: 1.0 внизу → 0.45 наверху, интерлиньяж 26 px, моноширинный
полужирный шрифт, по центру). Полная прокрутка — 55 s. Пропуск: Пробел, Esc
или клик → сразу к баннеру волны 1 (музыка гаснет за 0.3 s).
Играет `music_crawl.mp3` один раз. Читается меньше минуты.

Текст (RU):

> Давным-давно, в соседнем туалете…
>
> Галактика ПИССУАРИУС в опасности. Из Канализационного рукава выползла
> армада живой сантехники: туалеты, писсуары, тараканы и ходячие какахи.
>
> Их ведут ПЯТЬ ВЛАДЫК СМЫВА — от грозного СУПЕР-ТУАЛЕТА до загадочного
> Злого Сантехника ПЕССИМАРИО.
>
> Галактический флот сдался без боя: у солдат были носы. Единственный,
> кто не чувствует запаха, — пилот истребителя «ПИССУАР-1». Он уже летит.

Текст (EN):

> Long ago, in the bathroom next door…
>
> The galaxy PISSUARIUS is in danger. From the Sewer Arm crawls an armada
> of living plumbing: toilets, urinals, roaches and walking poops.
>
> They are led by the FIVE LORDS OF THE FLUSH — from the dreaded SUPER
> TOILET to the mysterious Evil Plumber PESSIMARIO.
>
> The galactic fleet surrendered without a fight: the soldiers had noses.
> The only one who cannot smell a thing is the pilot of the starfighter
> PISSUAR-1. He is already on his way.

## 14. Состояния и переходы

```
Boot → Title → Crawl → Game ⇄ Pause → (GameOver → Initials → Title)
                 ↑                    └→ Victory → Endless …
```

| Переход | Длительность | Что на экране |
|---|---|---|
| Boot → Title | после загрузки | титульник: название, «INSERT COIN», топ-10, выбор языка |
| Title → Crawl | 0.5 s fade | заставка §13 |
| Crawl → волна 1 | мгновенно (skip) или после 55 s | баннер «ВОЛНА 1» 2.0 s |
| Каждая волна | баннер 2.0 s | «ВОЛНА n» по центру |
| Босс-волна | баннер 3.0 s | «ВНИМАНИЕ!» + имя босса, музыка boss |
| Смена акта | баннер 2.5 s | «АКТ n» |
| Смерть игрока | 1.5 s пауза | взрыв, затем респаун |
| GameOver | до ввода инициалов | «ИГРА ОКОНЧЕНА», ввод 3 букв |
| Victory | баннер 3.0 s | «ПОБЕДА!», затем «БЕСКОНЕЧНЫЙ ЦИКЛ 1» |
| Пауза | Esc | оверлей «ПАУЗА», игровой мир заморожен |

## 15. Интернационализация

Все строки — из `src/data/i18n.js` ({ ru: {...}, en: {...} }), ключ → текст.
Язык переключается в меню титульника, сохраняется в
`localStorage["pissuarius_lang"]`, дефолт `ru`.

| Ключ | RU | EN |
|---|---|---|
| title | PISSUARIUS | PISSUARIUS |
| subtitle | Галактическая зачистка | Galactic cleanup |
| insert_coin | ВСТАВЬ МОНЕТУ | INSERT COIN |
| press_start | НАЖМИ ПРОБЕЛ | PRESS SPACE |
| play | ИГРАТЬ | PLAY |
| wave | ВОЛНА {n} | WAVE {n} |
| act | АКТ {n} | ACT {n} |
| boss_warning | ВНИМАНИЕ! | WARNING! |
| game_over | ИГРА ОКОНЧЕНА | GAME OVER |
| victory | ПОБЕДА! | VICTORY! |
| endless | БЕСКОНЕЧНЫЙ ЦИКЛ {n} | ENDLESS CYCLE {n} |
| score | СЧЁТ | SCORE |
| hiscore | РЕКОРД | HI-SCORE |
| wave_clear | ЧИСТАЯ ВОЛНА +{bonus} | PERFECT WAVE +{bonus} |
| double_shot | ДВОЙНОЙ ВЫСТРЕЛ | DOUBLE SHOT |
| shield | ЩИТ | SHIELD |
| enter_initials | ВВЕДИ ИНИЦИАЛЫ | ENTER INITIALS |
| top10 | ТОП-10 | TOP 10 |
| new_record | НОВЫЙ РЕКОРД! | NEW RECORD! |
| language | ЯЗЫК | LANGUAGE |
| pause | ПАУЗА | PAUSE |
| resume | ПРОДОЛЖИТЬ | RESUME |
| quit_to_title | В МЕНЮ | QUIT TO TITLE |
| sound_on | ЗВУК: ВКЛ | SOUND: ON |
| sound_off | ЗВУК: ВЫКЛ | SOUND: OFF |
| boss_super_toilet | СУПЕР-ТУАЛЕТ | SUPER TOILET |
| boss_big_macaque | БОЛЬШАЯ МАКАКА | BIG MACAQUE |
| boss_super_poop | СУПЕР-КАКАХА | SUPER POOP |
| boss_roach_queen | КОРОЛЕВА ТАРАКАНОВ | ROACH QUEEN |
| boss_plumber | ЗЛОЙ САНТЕХНИК ПЕССИМАРИО | EVIL PLUMBER PESSIMARIO |
| boss_golden_throne | ЗОЛОТОЙ ТРОН | GOLDEN THRONE |
| crawl_pre | Давным-давно, в соседнем туалете… | Long ago, in the bathroom next door… |
| crawl_1 | Галактика ПИССУАРИУС в опасности… (полный текст §13) | The galaxy PISSUARIUS is in danger… (full text §13) |
| crawl_2 | Их ведут ПЯТЬ ВЛАДЫК СМЫВА… (§13) | They are led by the FIVE LORDS OF THE FLUSH… (§13) |
| crawl_3 | Галактический флот сдался без боя… (§13) | The galactic fleet surrendered without a fight… (§13) |
| skip_hint | ПРОБЕЛ — ПРОПУСТИТЬ | SPACE — SKIP |

## 16. Критерии приёмки

Исполнитель считает работу готовой, когда в браузере (Chrome, без консольных
ошибок) выполнено всё:

1. `game.html` открывается с GitHub Pages; Boot генерирует все текстуры из схем §11.
2. Титульник показывает топ-10 (пустой при первом запуске) и переключатель RU/EN.
3. Старт → заставка §13 со скроллом и музыкой; Пробел пропускает её.
4. Корабль летает в зоне игрока (WASD), не выходит за её пределы; Пробел — огонь с кулдауном.
5. Волны идут по таблице §6; состав формации на волне n совпадает с таблицей.
6. Каждый тип врага пикирует по своему паттерну §4; Плесень делится; Сушка сдувает снаряды.
7. Пикирующий враг даёт ×2 очка; бонус чистой волны начисляется.
8. Попадание = потеря жизни + респаун с неуязвимостью; 3 смерти → GameOver → инициалы → топ-10.
9. Пауэр-апы падают из пикирующих, подбираются, действуют по §8.
10. Каждый босс имеет 2 фазы со сменой поведения при HP ≤ 50% (§7).
11. После волны 25 — экран победы, затем бесконечный цикл с Золотым Троном.
12. Звуки соответствуют событиям §12; M мьютит всё; музыка волн/боссов зациклена без щелчков.
13. Все надписи берутся из i18n; переключение языка меняет их без перезагрузки.
14. Частицы, тряска экрана, мерцание неуязвимости работают по §10.
15. localStorage содержит hiscores/lang/mute после соответствующих действий.
