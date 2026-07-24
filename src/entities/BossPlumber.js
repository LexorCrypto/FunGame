import { BossBase } from './BossBase.js';

// SPEC §7.5: Злой Сантехник Пессимарио (волна 25) — 320 HP. Единственный
// босс, заходящий в зону игрока: ходит/прыгает по всему полю (y ∈ [60,230]).
const PHASE_PARAMS = {
  1: { wrenchInterval: 4.0, drillEnabled: false },
  2: { wrenchInterval: 3.0, drillEnabled: true },
};

export class BossPlumber extends BossBase {
  constructor(scene, id = 'plumber') {
    // SPEC §7.5: заходит в игровую зону, поэтому старт ближе к центру поля
    // (y=90, а не типичные y=50..70 у прочих боссов); очки акта 5 = 1000×5.
    super(scene, { id, texture: 'bossPlumber-0', x: 240, y: 90, maxHp: 320, points: 5000 });

    // Гаечный ключ-бумеранг: this.wrench хранит { sprite, phase, elapsed, ... }
    // не более одного одновременно (SPEC §7.5).
    this.wrenchTimer = 0;
    this.wrench = null;

    // Топот: 'idle' — обычное блуждание, 'jumping' — прыжок к точке топота
    // (0.7 s), на это время updateWander() не вызывается.
    this.stompTimer = 0;
    this.stompPhase = 'idle';
    this.stompElapsed = 0;
    this.stompStartX = this.x;
    this.stompStartY = this.y;
    this.stompTargetX = this.x;
    this.stompTargetY = this.y;
    // SPEC §7.5 не указывает интервал топота — выбрано 5.0 s.
    this.stompInterval = 5.0;

    // Вантуз-бур (фаза 2): конус перед боссом засасывает и отражает снаряды
    // игрока. Направление и половинный угол конуса в SPEC не заданы —
    // выбраны «вниз» (к зоне игрока) и 40°; дальность 110 px — из SPEC.
    this.drillTimer = 0;
    this.drillActive = false;
    this.drillRemaining = 0;
    this.drillCone = null;
    this.drillHalfAngle = 40;
    this.drillRange = 110;

    // Блуждание: SPEC §7.5 задаёт только y ∈ [60,230]; границы по x не
    // указаны — выбраны [40,440] (отступ от краёв поля 480×270, аналогично
    // клампу игрока §2).
    this.pickWanderTarget();

    this.applyPhaseParams();
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.wrenchInterval = params.wrenchInterval;
    this.drillEnabled = params.drillEnabled;
  }

  onUpdate(time, delta) {
    // Движение (ходьба по всему полю) идёт каждый кадр. Исключение — во
    // время прыжка-топота, где позицию ведёт updateStomp() ниже (это часть
    // атаки «топот», а не свободное блуждание).
    if (this.stompPhase === 'idle') {
      this.updateWander(delta);
    }

    // SPEC §7: атаки заморожены во время 1.0 s паузы смены фазы — включая
    // уже летящий ключ и прыжок топота (просто не продвигаются этот кадр).
    if (this.attacksPaused) {
      return;
    }

    this.updateWrench(delta);
    this.updateStomp(delta);

    if (this.drillEnabled) {
      this.updateDrill(delta);
    }
  }

  pickWanderTarget() {
    this.wanderTargetX = Phaser.Math.Between(40, 440);
    this.wanderTargetY = Phaser.Math.Between(60, 230);
  }

  updateWander(delta) {
    const dx = this.wanderTargetX - this.x;
    const dy = this.wanderTargetY - this.y;
    const dist = Math.hypot(dx, dy);
    const step = (70 * delta) / 1000;

    if (dist <= step) {
      this.setPosition(this.wanderTargetX, this.wanderTargetY);
      this.body.reset(this.wanderTargetX, this.wanderTargetY);
      this.pickWanderTarget();
      return;
    }

    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.setPosition(nx, ny);
    this.body.reset(nx, ny);
  }

  // SPEC §7.5: ключ летит к позиции игрока на момент броска (130 px/s,
  // 0.9 s), затем возврат к боссу (~0.9 s), хитбокс активен весь полёт.
  // Скорость и длительность в SPEC заданы избыточно (130 px/s × 0.9 s ≈
  // 117 px, что не совпадает с реальной дистанцией до игрока) — снаряд
  // ведём вручную лерпом по фиксированной длительности 0.9 s на каждый
  // отрезок, скорость 130 px/s остаётся ориентиром/комментарием.
  updateWrench(delta) {
    this.wrenchTimer += delta;
    if (!this.wrench && this.wrenchTimer >= this.wrenchInterval * 1000) {
      this.wrenchTimer = 0;
      this.throwWrench();
    }

    if (!this.wrench) {
      return;
    }

    const w = this.wrench;
    w.elapsed += delta;

    if (w.phase === 'out') {
      const t = Math.min(1, w.elapsed / 900);
      const x = Phaser.Math.Linear(w.startX, w.targetX, t);
      const y = Phaser.Math.Linear(w.startY, w.targetY, t);
      w.sprite.setPosition(x, y);
      w.sprite.body.reset(x, y);

      if (t >= 1) {
        w.phase = 'back';
        w.elapsed = 0;
        w.farX = x;
        w.farY = y;
      }
      return;
    }

    // Обратный путь: цель — ТЕКУЩАЯ позиция босса (он продолжает ходить).
    const t = Math.min(1, w.elapsed / 900);
    const x = Phaser.Math.Linear(w.farX, this.x, t);
    const y = Phaser.Math.Linear(w.farY, this.y, t);
    w.sprite.setPosition(x, y);
    w.sprite.body.reset(x, y);

    if (t >= 1) {
      w.sprite.deactivate();
      this.wrench = null;
    }
  }

  throwWrench() {
    const p = this.scene.enemyProjectiles.get();
    if (!p) {
      return;
    }

    // Пул enemyProjectiles общий — восстанавливаем текстуру/тело ключа
    // (SPEC §11: 8×8). Скорость не используется — снаряд ведём вручную.
    p.setTexture('wrench-0');
    p.body.setSize(8, 8);
    p.effect = undefined;
    p.fire(this.x, this.y, 0, 0);

    const player = this.scene.player;
    const targetX = player && player.active ? player.x : this.x;
    const targetY = player && player.active ? player.y : this.y;

    this.wrench = {
      sprite: p,
      phase: 'out',
      elapsed: 0,
      startX: this.x,
      startY: this.y,
      targetX,
      targetY,
      farX: targetX,
      farY: targetY,
    };
  }

  // SPEC §7.5: телеграф-круг r=30 на позиции игрока 0.7 s → прыжок туда,
  // урон при приземлении. Прыжок и телеграф разделяют одно и то же окно
  // 0.7 s: spawnDamageCircle сама показывает контур все telegraphMs и
  // включает урон только когда босс долетает.
  updateStomp(delta) {
    if (this.stompPhase === 'idle') {
      this.stompTimer += delta;
      if (this.stompTimer >= this.stompInterval * 1000) {
        this.stompTimer = 0;
        this.startStomp();
      }
      return;
    }

    this.stompElapsed += delta;
    const t = Math.min(1, this.stompElapsed / 700);
    const nx = Phaser.Math.Linear(this.stompStartX, this.stompTargetX, t);
    const ny = Phaser.Math.Linear(this.stompStartY, this.stompTargetY, t);
    this.setPosition(nx, ny);
    this.body.reset(nx, ny);

    if (t >= 1) {
      this.stompPhase = 'idle';
      this.pickWanderTarget();
    }
  }

  startStomp() {
    const player = this.scene.player;
    const px = player && player.active ? player.x : this.x;
    const py = Phaser.Math.Clamp(player && player.active ? player.y : this.y, 60, 230);

    this.scene.spawnDamageCircle(px, py, 30, { telegraphMs: 700, activeMs: 200 });

    this.stompPhase = 'jumping';
    this.stompElapsed = 0;
    this.stompStartX = this.x;
    this.stompStartY = this.y;
    this.stompTargetX = px;
    this.stompTargetY = py;
  }

  // SPEC §7.5 (фаза 2): вантуз-бур каждые 10.0 s на 3.5 s — конус 110 px
  // перед боссом засасывает снаряды игрока и отражает их (враждебные, ×1.3).
  updateDrill(delta) {
    this.drillTimer += delta;
    if (this.drillTimer >= 10000) {
      this.drillTimer = 0;
      this.startDrill();
    }

    if (!this.drillActive) {
      return;
    }

    this.drillRemaining -= delta;
    this.drawDrillCone();
    this.reflectProjectiles();

    if (this.drillRemaining <= 0) {
      this.endDrill();
    }
  }

  startDrill() {
    this.drillActive = true;
    this.drillRemaining = 3500;
    if (!this.drillCone) {
      this.drillCone = this.scene.add.graphics().setDepth(5);
    }
  }

  endDrill() {
    this.drillActive = false;
    if (this.drillCone) {
      this.drillCone.destroy();
      this.drillCone = null;
    }
  }

  drawDrillCone() {
    // Конус направлен вниз (угол 90° в экранных координатах, где y растёт
    // вниз) — к зоне игрока, как и требует SPEC §7.5 («перед боссом»).
    const leftRad = Phaser.Math.DegToRad(90 - this.drillHalfAngle);
    const rightRad = Phaser.Math.DegToRad(90 + this.drillHalfAngle);
    const leftX = this.x + this.drillRange * Math.cos(leftRad);
    const leftY = this.y + this.drillRange * Math.sin(leftRad);
    const rightX = this.x + this.drillRange * Math.cos(rightRad);
    const rightY = this.y + this.drillRange * Math.sin(rightRad);

    this.drillCone.clear();
    this.drillCone.fillStyle(0x59d6e6, 0.25);
    this.drillCone.fillTriangle(this.x, this.y, leftX, leftY, rightX, rightY);
    this.drillCone.lineStyle(2, 0x59d6e6, 0.8);
    this.drillCone.strokeTriangle(this.x, this.y, leftX, leftY, rightX, rightY);
  }

  reflectProjectiles() {
    const halfAngleRad = Phaser.Math.DegToRad(this.drillHalfAngle);

    for (const p of this.scene.playerProjectiles.getChildren()) {
      if (!p.active) {
        continue;
      }

      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0 || dist > this.drillRange) {
        continue;
      }

      // Угол между вектором «босс → снаряд» и направлением конуса (вниз).
      const angleFromDown = Math.acos(Phaser.Math.Clamp(dy / dist, -1, 1));
      if (angleFromDown > halfAngleRad) {
        continue;
      }

      const speed = Math.hypot(p.body.velocity.x, p.body.velocity.y) * 1.3;
      const px = p.x;
      const py = p.y;
      p.deactivate();

      const reflected = this.scene.enemyProjectiles.get();
      if (!reflected) {
        continue;
      }

      // Отражённый снаряд остаётся визуально снарядом игрока (SPEC §11:
      // 4×6), но теперь враждебен и летит от босса прочь.
      reflected.setTexture('playerBullet-0');
      reflected.body.setSize(3, 6);
      reflected.effect = undefined;
      reflected.fire(px, py, (dx / dist) * speed, (dy / dist) * speed);
    }
  }

  onEnterPhase2() {
    this.applyPhaseParams();
    this.wrenchTimer = 0;
    this.stompTimer = 0;
    this.drillTimer = 0;
  }

  onCleanup() {
    if (this.wrench) {
      this.wrench.sprite.deactivate();
      this.wrench = null;
    }
    if (this.drillCone) {
      this.drillCone.destroy();
      this.drillCone = null;
    }
  }
}
