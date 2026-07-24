// SPEC §6, §14: волновой дирижёр — скармливает волны из src/data/waves.js
// строю (Formation) и дайв-дирижёру, спавнит боссов через инъецированную
// фабрику, показывает баннеры «ВОЛНА n» / «АКТ n» / «ВНИМАНИЕ! <босс>».
import {
  WAVES,
  CYCLE_WAVES,
  GOLDEN_THRONE_WAVE,
  applyCycleModifiers,
  actForWaveNumber,
} from '../data/waves.js';

// Имена боссов на RU (временно, до тикета i18n — SPEC §15, ключи boss_*).
const BOSS_NAMES = {
  superToilet: 'СУПЕР-ТУАЛЕТ',
  bigMacaque: 'БОЛЬШАЯ МАКАКА',
  superPoop: 'СУПЕР-КАКАХА',
  roachQueen: 'КОРОЛЕВА ТАРАКАНОВ',
  plumber: 'ЗЛОЙ САНТЕХНИК ПЕССИМАРИО',
  goldenThrone: 'ЗОЛОТОЙ ТРОН',
};

export class WaveDirector {
  constructor(scene, { formation, diveDirector, bossFactory }) {
    this.scene = scene;
    this.formation = formation;
    this.diveDirector = diveDirector;
    this.bossFactory = bossFactory;

    this.index = 0;
    this.currentAct = 0;
    this.boss = null;
    this.bossDefeated = false;
    this.awaitingClear = false;

    // Баннер: один переиспользуемый Text, центр (240,135), depth 2000,
    // скрыт до первого показа (создаётся лениво в showNextBanner).
    this.banner = null;
    this.bannerQueue = [];
    this.bannerTimer = 0;

    scene.events.on('boss-defeated', this.onBossDefeated, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  onBossDefeated() {
    this.bossDefeated = true;
  }

  destroy() {
    this.scene.events.off('boss-defeated', this.onBossDefeated, this);
    this.banner?.destroy();
    this.banner = null;
  }

  start(index = 0) {
    this.index = index;
    this.loadWave(index);
  }

  // Разрешает 0-based индекс волны в { wave, waveNumber, act } (SPEC §6).
  // index < 25 — обычные волны из WAVES; далее — бесконечный цикл: 4 базовые
  // волны 21–24 с модификаторами цикла + Золотой Трон, акт зафиксирован на 5.
  resolveWave(index) {
    if (index < 25) {
      const wave = WAVES[index];
      const waveNumber = index + 1;
      const act = actForWaveNumber(waveNumber);
      return { wave, waveNumber, act, cycle: 0, cyclePos: -1 };
    }

    // Бесконечный цикл: 5 слотов на цикл (4 волны 21–24 + Золотой Трон).
    const k = index - 25;
    const cycle = Math.floor(k / 5) + 1;
    const pos = k % 5;
    const wave = pos < 4 ? applyCycleModifiers(CYCLE_WAVES[pos], cycle) : GOLDEN_THRONE_WAVE;
    const waveNumber = index + 1;
    const act = 5;
    return { wave, waveNumber, act, cycle, cyclePos: pos };
  }

  loadWave(index) {
    const { wave, waveNumber, act, cycle, cyclePos } = this.resolveWave(index);

    // Переход в бесконечный цикл (SPEC §14): при входе в цикл — баннер
    // «БЕСКОНЕЧНЫЙ ЦИКЛ c»; самому первому входу предшествует «ПОБЕДА!» 3.0 s.
    if (cycle > 0 && cyclePos === 0) {
      if (index === 25) {
        this.bannerQueue.push({ text: 'ПОБЕДА!', color: '#ffd94d', durationMs: 3000 });
      }
      this.bannerQueue.push({ text: 'БЕСКОНЕЧНЫЙ ЦИКЛ ' + cycle, color: '#ffd94d', durationMs: 3000 });
    }

    // Баннер смены акта (SPEC §14, 2.5 s): не показывается для самой первой
    // волны сессии (currentAct стартует с 0).
    if (act !== this.currentAct && this.currentAct !== 0 && act > this.currentAct) {
      this.bannerQueue.push({ text: 'АКТ ' + act, color: '#f5893d', durationMs: 2500 });
    }
    this.currentAct = act;

    // Множитель скорости снарядов врагов по акту (SPEC §4).
    const actFactor = 1 + 0.05 * (act - 1);

    if (wave.boss) {
      const make = this.bossFactory[wave.boss];
      if (make) {
        // Босс-волна (SPEC §14, баннер «ВНИМАНИЕ!» 3.0 s).
        this.bannerQueue.push({
          text: 'ВНИМАНИЕ!\n' + BOSS_NAMES[wave.boss],
          color: '#c23b4e',
          durationMs: 3000,
        });

        // Дирижёр владеет жизненным циклом босса: включает его в группу
        // коллизий сцены (контракт фабрики — только сконструировать Boss).
        this.boss = make();
        this.scene.bosses.add(this.boss);
        this.bossDefeated = false;
        this.awaitingClear = false;
      } else {
        // Босс ещё не реализован (тикеты FUN-14..19): не бросаем исключение
        // (чистый рантайм) и НЕ считаем волну зачищенной — входим в явное
        // состояние «недоступно»; прогресс стоит до появления фабрики.
        this.boss = null;
        this.awaitingClear = false;
        this.blocked = true;
        this.bannerQueue.push({
          text: BOSS_NAMES[wave.boss] + '\n(СКОРО)',
          color: '#8a94a6',
          durationMs: Infinity,
        });
      }
    } else {
      // Кампания (§14, «ВОЛНА n» 2.0 s). В бесконечном цикле номера волн нет —
      // вход в цикл обозначает баннер выше.
      if (cycle === 0) {
        this.bannerQueue.push({ text: 'ВОЛНА ' + waveNumber, color: '#ffd94d', durationMs: 2000 });
      }

      this.boss = null;
      this.formation.swayPeriod = wave.swayPeriod;
      this.diveDirector.diveInterval = wave.diveInterval;
      this.diveDirector.maxDivers = wave.maxDivers;
      this.diveDirector.bulletSpeedMul = wave.bulletSpeedMul * actFactor;
      this.diveDirector.timer = 0;

      this.spawnFormation(wave);
      this.awaitingClear = true;
    }

    this.showNextBanner();
  }

  // Заполняет сетку: каждый ряд данных rows[i] — свой ряд сетки сверху вниз,
  // враги центрированы в ряду (SPEC §6). Count>cols в таблице §6 — расхождение
  // с сеткой 10×4: ряд расширяется симметрично за пределы 10 колонок (поле шире
  // сетки, враги остаются на экране). Рядов данных в таблице ≤ 4 (= рядов сетки).
  spawnFormation(wave) {
    const cols = this.formation.cols;
    const maxRows = this.formation.rows;

    wave.rows.forEach((group, r) => {
      if (r >= maxRows) {
        return;
      }
      const startCol = Math.floor((cols - group.count) / 2);
      for (let j = 0; j < group.count; j += 1) {
        this.scene.spawnFormationEnemy(group.type, startCol + j, r);
      }
    });
  }

  showNextBanner() {
    if (this.bannerQueue.length === 0) {
      this.banner?.setVisible(false);
      this.bannerTimer = 0;
      return;
    }

    const item = this.bannerQueue.shift();

    if (!this.banner) {
      this.banner = this.scene.add
        .text(240, 135, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(2000);
    }

    this.banner.setText(item.text);
    this.banner.setColor(item.color);
    this.banner.setVisible(true);
    this.bannerTimer = item.durationMs;
  }

  update(time, delta) {
    if (this.bannerTimer > 0) {
      this.bannerTimer -= delta;
      if (this.bannerTimer <= 0) {
        this.showNextBanner();
      }
    }

    if (this.boss && this.boss.active) {
      this.boss.update(time, delta);
    }

    // Детект зачистки волны → переход к следующей.
    if (this.boss && this.bossDefeated) {
      this.advance();
    } else if (this.awaitingClear && this.formation.members.length === 0) {
      this.advance();
    }
  }

  advance() {
    this.awaitingClear = false;
    this.boss = null;
    this.index += 1;
    this.loadWave(this.index);
  }
}
