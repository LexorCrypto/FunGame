// Данные волн (SPEC §6). Дословная транскрипция таблицы §6.
// Индекс массива i = волна (i + 1). Босс-волны — { boss: '<id>' }.
// Типы врагов — внутренние ключи (см. Enemy.js / DIVE_PATTERNS):
//   Таракан→cockroach, Писсуар→urinal, Какаха→poop, Туалет→toilet,
//   Ёршик→brush, Вантуз→plunger, Плесень→mold, Сушка→dryer.
// Сумма count по волне ≤ 40 слотов (сетка 10×4, §5).
export const WAVES = [
  // 1
  { rows: [{ type: 'cockroach', count: 8 }, { type: 'poop', count: 8 }], swayPeriod: 4.0, diveInterval: 3.0, maxDivers: 1, bulletSpeedMul: 1.0 },
  // 2
  { rows: [{ type: 'cockroach', count: 10 }, { type: 'urinal', count: 10 }], swayPeriod: 3.8, diveInterval: 2.8, maxDivers: 1, bulletSpeedMul: 1.0 },
  // 3
  { rows: [{ type: 'brush', count: 8 }, { type: 'cockroach', count: 8 }, { type: 'poop', count: 8 }], swayPeriod: 3.6, diveInterval: 2.6, maxDivers: 2, bulletSpeedMul: 1.0 },
  // 4
  { rows: [{ type: 'toilet', count: 8 }, { type: 'urinal', count: 10 }, { type: 'cockroach', count: 10 }], swayPeriod: 3.4, diveInterval: 2.4, maxDivers: 2, bulletSpeedMul: 1.0 },
  // 5
  { boss: 'superToilet' },
  // 6
  { rows: [{ type: 'plunger', count: 8 }, { type: 'cockroach', count: 8 }, { type: 'urinal', count: 8 }], swayPeriod: 3.4, diveInterval: 2.4, maxDivers: 2, bulletSpeedMul: 1.05 },
  // 7
  { rows: [{ type: 'mold', count: 8 }, { type: 'poop', count: 10 }, { type: 'brush', count: 8 }], swayPeriod: 3.2, diveInterval: 2.2, maxDivers: 2, bulletSpeedMul: 1.05 },
  // 8
  { rows: [{ type: 'dryer', count: 6 }, { type: 'urinal', count: 10 }, { type: 'cockroach', count: 12 }], swayPeriod: 3.0, diveInterval: 2.2, maxDivers: 3, bulletSpeedMul: 1.05 },
  // 9
  { rows: [{ type: 'toilet', count: 8 }, { type: 'plunger', count: 8 }, { type: 'mold', count: 8 }, { type: 'brush', count: 6 }], swayPeriod: 2.8, diveInterval: 2.0, maxDivers: 3, bulletSpeedMul: 1.1 },
  // 10
  { boss: 'bigMacaque' },
  // 11
  { rows: [{ type: 'dryer', count: 8 }, { type: 'cockroach', count: 10 }, { type: 'poop', count: 12 }], swayPeriod: 2.8, diveInterval: 2.0, maxDivers: 3, bulletSpeedMul: 1.1 },
  // 12
  { rows: [{ type: 'mold', count: 10 }, { type: 'plunger', count: 10 }, { type: 'urinal', count: 12 }], swayPeriod: 2.6, diveInterval: 1.9, maxDivers: 3, bulletSpeedMul: 1.15 },
  // 13
  { rows: [{ type: 'toilet', count: 10 }, { type: 'brush', count: 10 }, { type: 'cockroach', count: 12 }], swayPeriod: 2.4, diveInterval: 1.8, maxDivers: 3, bulletSpeedMul: 1.15 },
  // 14
  { rows: [{ type: 'dryer', count: 8 }, { type: 'toilet', count: 10 }, { type: 'mold', count: 8 }, { type: 'plunger', count: 8 }], swayPeriod: 2.2, diveInterval: 1.7, maxDivers: 4, bulletSpeedMul: 1.2 },
  // 15
  { boss: 'superPoop' },
  // 16
  { rows: [{ type: 'cockroach', count: 12 }, { type: 'brush', count: 10 }, { type: 'urinal', count: 12 }], swayPeriod: 2.2, diveInterval: 1.6, maxDivers: 4, bulletSpeedMul: 1.2 },
  // 17
  { rows: [{ type: 'mold', count: 10 }, { type: 'poop', count: 10 }, { type: 'dryer', count: 8 }, { type: 'plunger', count: 8 }], swayPeriod: 2.0, diveInterval: 1.5, maxDivers: 4, bulletSpeedMul: 1.25 },
  // 18
  { rows: [{ type: 'toilet', count: 12 }, { type: 'cockroach', count: 12 }, { type: 'brush', count: 12 }], swayPeriod: 2.0, diveInterval: 1.5, maxDivers: 4, bulletSpeedMul: 1.25 },
  // 19
  { rows: [{ type: 'dryer', count: 10 }, { type: 'toilet', count: 10 }, { type: 'mold', count: 10 }, { type: 'plunger', count: 8 }], swayPeriod: 1.8, diveInterval: 1.4, maxDivers: 4, bulletSpeedMul: 1.3 },
  // 20
  { boss: 'roachQueen' },
  // 21
  { rows: [{ type: 'brush', count: 12 }, { type: 'cockroach', count: 12 }, { type: 'poop', count: 14 }], swayPeriod: 1.8, diveInterval: 1.3, maxDivers: 4, bulletSpeedMul: 1.3 },
  // 22
  { rows: [{ type: 'dryer', count: 10 }, { type: 'plunger', count: 10 }, { type: 'mold', count: 10 }, { type: 'urinal', count: 10 }], swayPeriod: 1.6, diveInterval: 1.2, maxDivers: 4, bulletSpeedMul: 1.35 },
  // 23
  { rows: [{ type: 'toilet', count: 12 }, { type: 'urinal', count: 14 }, { type: 'cockroach', count: 14 }], swayPeriod: 1.6, diveInterval: 1.2, maxDivers: 4, bulletSpeedMul: 1.35 },
  // 24
  { rows: [{ type: 'dryer', count: 10 }, { type: 'toilet', count: 10 }, { type: 'brush', count: 10 }, { type: 'mold', count: 10 }], swayPeriod: 1.4, diveInterval: 1.1, maxDivers: 5, bulletSpeedMul: 1.4 },
  // 25
  { boss: 'plumber' },
];

// Порядок босс-волн по актам (для баннеров/справки).
export const BOSS_IDS = ['superToilet', 'bigMacaque', 'superPoop', 'roachQueen', 'plumber'];

// Бесконечный цикл (SPEC §6): после победы цикл c = 1, 2, … прогоняет волны
// 21–24, затем Золотой Трон. Волны берутся из WAVES[20..23] (базовые), к ним
// applyCycleModifiers накладывает модификаторы цикла.
export const CYCLE_WAVE_INDICES = [20, 21, 22, 23]; // 0-based: волны 21–24
export const CYCLE_WAVES = CYCLE_WAVE_INDICES.map((i) => WAVES[i]);
export const GOLDEN_THRONE_WAVE = { boss: 'goldenThrone' };

// Модификаторы цикла (SPEC §6): swayPeriod ×0.9^c (мин 1.4),
// diveInterval ×0.88^c (мин 0.7), bulletSpeedMul ×1.1^c. HP врагов не растёт.
// Возвращает НОВУЮ копию формационной волны; босс-волны возвращает как есть.
export function applyCycleModifiers(wave, cycle) {
  if (wave.boss) {
    return { ...wave };
  }
  return {
    ...wave,
    swayPeriod: Math.max(1.4, wave.swayPeriod * Math.pow(0.9, cycle)),
    diveInterval: Math.max(0.7, wave.diveInterval * Math.pow(0.88, cycle)),
    bulletSpeedMul: wave.bulletSpeedMul * Math.pow(1.1, cycle),
  };
}

// Множитель очков в бесконечном цикле (SPEC §6): очки × c.
export function scoreMultiplier(cycle) {
  return cycle;
}

// Акт волны n (1-based, 1..25): 5 волн на акт, боссы — последняя волна акта
// (5, 10, 15, 20, 25). Скорость снарядов врагов ×(1 + 0.05·(акт − 1)) (SPEC §4).
// За пределами 25 (бесконечный цикл) акт зафиксирован на 5.
export function actForWaveNumber(n) {
  if (n > 25) {
    return 5;
  }
  return Math.floor((n - 1) / 5) + 1;
}
