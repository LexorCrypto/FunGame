import { t } from '../data/i18n.js';

// SPEC §4: базовые очки за врага (в формации). Пикирующий — ×2 (§9).
const ENEMY_POINTS = {
  cockroach: 50,
  urinal: 60,
  poop: 70,
  toilet: 150,
  brush: 80,
  plunger: 90,
  mold: 40,
  dryer: 100,
};

// SPEC §9: очки за одно попадание по боссу. 5 держит вклад попаданий в
// 25–50% от бонуса за убийство (Супер-Туалет 100 HP → 500 против 1000,
// Золотой Трон 500 HP → 2500 против 10000) — заметно, но добивание всё
// равно решает.
const BOSS_HIT_POINTS = 5;

const HISCORES_KEY = 'pissuarius_hiscores';

// SPEC §9: топ-10 рекордов в localStorage["pissuarius_hiscores"] = JSON
// [{name, score, wave}], сортировка по убыванию. Хелперы — модульные (без
// экземпляра Scoring), т.к. их читают TitleScene и EndScene.
export function loadHiscores() {
  try {
    const raw = localStorage.getItem(HISCORES_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .filter((e) => e && typeof e.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export function isHiscore(score) {
  if (!(score > 0)) {
    return false;
  }
  const list = loadHiscores();
  return list.length < 10 || score > list[list.length - 1].score;
}

export function addHiscore(name, score, wave) {
  const list = loadHiscores();
  list.push({ name: String(name).slice(0, 3).toUpperCase(), score, wave });
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  try {
    localStorage.setItem(HISCORES_KEY, JSON.stringify(top));
  } catch {
    // localStorage недоступен — рекорд живёт только в текущей сессии.
  }
  return top;
}

function pad6(n) {
  return String(Math.max(0, Math.floor(n))).padStart(6, '0');
}

// Очки за одну убитую особь врага (§9): базовые ×2 при пикировании.
export function enemyKillPoints(type, diving) {
  return (ENEMY_POINTS[type] ?? 0) * (diving ? 2 : 1);
}

// Скоринг + HUD (§1, §9). Экземпляр живёт в PlaygroundScene: держит текущий
// счёт, рисует HUD (СЧЁТ/РЕКОРД/жизни/ВОЛНА/индикатор пауэр-апа) и всплывающие
// «+N». Рекорд HUD = max(лучший сохранённый, текущий счёт).
export class Scoring {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;
    this.bestStored = loadHiscores()[0]?.score ?? 0;

    // SPEC §6: бесконечный цикл — очки ×c. 0 = кампания (множитель 1);
    // выставляет WaveDirector.loadWave при входе в цикл.
    this.cycle = 0;

    const font = { fontFamily: 'monospace', fontSize: '8px', color: '#f4f4f4' };

    // HUD (SPEC §1, y 0–20).
    this.scoreText = scene.add.text(8, 6, '', font).setOrigin(0, 0).setDepth(1500);
    this.hiscoreText = scene.add
      .text(240, 6, '', { ...font, color: '#ffd94d' })
      .setOrigin(0.5, 0)
      .setDepth(1500);
    // ВОЛНА n — под HUD слева (§1, x8 y24).
    this.waveText = scene.add.text(8, 24, '', font).setOrigin(0, 0).setDepth(1500);

    // Иконки жизней (§1, x 440..472, шаг 16).
    this.lifeIcons = [0, 1, 2].map((i) =>
      scene.add.image(440 + i * 16, 10, 'ship-0').setOrigin(0.5).setDepth(1500),
    );

    // Индикатор двойного выстрела (§1, x8 y34): бонус бессрочен (§8), поэтому
    // только иконка — таймер-полоски больше нет.
    this.dsIcon = scene.add
      .image(12, 38, 'powerupDoubleShot-0')
      .setOrigin(0.5)
      .setDepth(1500)
      .setVisible(false);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  // Начислить очки и показать всплывающий «+N» у (x,y) (§9).
  addPoints(points, x, y) {
    if (points <= 0) {
      return;
    }
    this.score += points;
    this.popup(`+${points}`, x, y, '#f4f4f4');
  }

  // SPEC §6: множитель очков бесконечного цикла (кампания — ×1).
  get cycleMultiplier() {
    return this.cycle > 0 ? this.cycle : 1;
  }

  addEnemyKill(enemy, diving) {
    // SPEC §7.4: у отродий Королевы задано фиксированное число очков
    // (enemy.points = 50), иначе — по таблице §4 с ×2 за пикирование (§9).
    const points = enemy.points != null ? enemy.points : enemyKillPoints(enemy.type, diving);
    this.addPoints(points * this.cycleMultiplier, enemy.x, enemy.y);
  }

  addBoss(boss) {
    this.addPoints((boss.points ?? 0) * this.cycleMultiplier, boss.x, boss.y);
  }

  // SPEC §9: попадание по боссу. Без popup — при кулдауне 250 ms и двойном
  // выстреле «+5» всплывал бы до восьми раз в секунду; обратная связь идёт
  // счётчиком HUD, вспышкой босса и звуком boss_hit.
  addBossHit() {
    this.score += BOSS_HIT_POINTS * this.cycleMultiplier;
  }

  // SPEC §9: бонус чистой волны +250×акт (в цикле — ещё ×c, §6), всплывает по центру.
  addCleanWave(act) {
    const bonus = 250 * act * this.cycleMultiplier;
    this.score += bonus;
    this.popup(t('wave_clear', { bonus }), 240, 150, '#ffd94d');
  }

  popup(text, x, y, color) {
    const label = this.scene.add
      .text(x, y, text, { fontFamily: 'monospace', fontSize: '8px', color })
      .setOrigin(0.5)
      .setDepth(1600);

    // §9: держится 0.6 s, поднимается на 12 px.
    this.scene.tweens.add({
      targets: label,
      y: y - 12,
      alpha: 0,
      duration: 600,
      onComplete: () => label.destroy(),
    });
  }

  update() {
    const scene = this.scene;
    this.scoreText.setText(`${t('score')} ${pad6(this.score)}`);
    this.hiscoreText.setText(`${t('hiscore')} ${pad6(Math.max(this.bestStored, this.score))}`);

    const waveNumber = scene.waveDirector ? scene.waveDirector.index + 1 : 1;
    this.waveText.setText(t('wave', { n: waveNumber }));

    const lives = scene.player ? scene.player.lives : 0;
    this.lifeIcons.forEach((icon, i) => icon.setVisible(i < lives));

    // Индикатор двойного выстрела (§8): держится до смерти, таймера нет.
    this.dsIcon.setVisible(scene.player ? scene.player.doubleShot === true : false);
  }

  destroy() {
    for (const obj of [
      this.scoreText,
      this.hiscoreText,
      this.waveText,
      this.dsIcon,
      ...this.lifeIcons,
    ]) {
      obj?.destroy();
    }
  }
}
