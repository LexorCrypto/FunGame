import { BossBase } from './BossBase.js';
import { Enemy } from './Enemy.js';

// SPEC §7.4: Королева Тараканов (волна 20) — 260 HP, очки акта 4 = 1000×4.
const PHASE_PARAMS = {
  1: { spawnInterval: 5.0, spawnCount: 2, spawnCap: 6, armored: false },
  2: { spawnInterval: 4.0, spawnCount: 3, spawnCap: 8, armored: true },
};

export class BossRoachQueen extends BossBase {
  constructor(scene, id = 'roachQueen') {
    // SPEC §7.4: ползёт по фиксированному y=45; SPEC §7: очки акта 4 = 1000×4.
    super(scene, { id, texture: 'bossRoachQueen-0', x: 240, y: 45, maxHp: 260, points: 4000 });

    this.spawnTimer = 0;
    this.moveDir = 1; // направление ползания по x, ±1 (старт вправо — произвольно)
    this.brood = []; // живые пикирующие отродья: { enemy, x0, y0, t }

    this.applyPhaseParams();
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.spawnInterval = params.spawnInterval;
    this.spawnCount = params.spawnCount;
    this.spawnCap = params.spawnCap;
    this.armored = params.armored;
  }

  onUpdate(time, delta) {
    // SPEC §7.4: ползёт по y=45, x ∈ [160,320] (±80 от центра 240), 40 px/s,
    // разворот направления на границах.
    const dt = delta / 1000;
    let nx = this.x + this.moveDir * 40 * dt;
    if (nx <= 160) {
      nx = 160;
      this.moveDir = 1;
    } else if (nx >= 320) {
      nx = 320;
      this.moveDir = -1;
    }
    this.setPosition(nx, 45);
    this.body.reset(nx, 45);

    // SPEC §7: пауза смены фазы замораживает спуск отродий и новый спавн
    // (аналогично воронке Супер-Туалета в Boss.js).
    if (this.attacksPaused) {
      return;
    }

    this.updateBrood(delta);

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval * 1000) {
      this.spawnTimer = 0;
      this.spawnBrood();
    }
  }

  // SPEC §4 (паттерн 'cockroach'): зигзаг x(t) = x0 + 40·sin(6t), спуск vy 170
  // до y = 270 — отродья Королевы пикируют тем же паттерном сразу после спавна.
  updateBrood(delta) {
    for (let i = this.brood.length - 1; i >= 0; i--) {
      const b = this.brood[i];
      const e = b.enemy;

      if (!e.active) {
        // Убит игроком — takeDamage()→die() уже отыграли взрыв и событие.
        this.brood.splice(i, 1);
        continue;
      }

      b.t += delta / 1000;
      const x = b.x0 + 40 * Math.sin(6 * b.t);
      const y = b.y0 + 170 * b.t;

      if (y >= 270) {
        // Ушёл за нижнюю границу поля — тихо снять, без взрыва.
        e.setActive(false);
        e.setVisible(false);
        e.body.enable = false;
        this.brood.splice(i, 1);
        continue;
      }

      e.setPosition(x, y);
      e.body.reset(x, y);
    }
  }

  // SPEC §7.4: каждые spawnInterval рождает spawnCount тараканов, не превышая
  // потолок живых отродий spawnCap. Фаза 2: 30% рождённых — бронированные
  // (2 HP, тинт 0x999999).
  spawnBrood() {
    // Потолок считаем только по живым записям — сначала чистим мёртвые.
    this.brood = this.brood.filter((b) => b.enemy.active);

    for (let i = 0; i < this.spawnCount && this.brood.length < this.spawnCap; i++) {
      const armored = this.armored && Math.random() < 0.3;
      const hp = armored ? 2 : 1;

      const e = new Enemy(this.scene, 'cockroach', { hp });
      if (armored) {
        e.setTint(0x999999);
      }
      e.points = 50; // SPEC §7.4: 50 очков за отродье (задел на будущий скоринг)

      // Разносим отродья одного помёта по x, иначе одинаковый зигзаг держит их
      // стопкой (визуально один таракан). Смещение ±, центр — позиция Королевы.
      const spawnX = Phaser.Math.Clamp(this.x + (i - (this.spawnCount - 1) / 2) * 14, 12, 468);
      const spawnY = this.y + 8;

      this.scene.enemies.add(e);
      e.setPosition(spawnX, spawnY);
      e.body.reset(spawnX, spawnY);
      e.diveState = 'diving';

      this.brood.push({ enemy: e, x0: spawnX, y0: spawnY, t: 0 });
    }
  }

  onEnterPhase2() {
    this.applyPhaseParams();
    this.spawnTimer = 0;
  }

  onCleanup() {
    // Не оставлять живых отродий висеть в следующей волне.
    for (const b of this.brood) {
      b.enemy.destroy();
    }
    this.brood = [];
  }
}
