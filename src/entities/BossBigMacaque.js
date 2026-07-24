import { BossBase } from './BossBase.js';

// SPEC §7.2: Большая Макака (волна 10) — 160 HP.
// Точки прыжка на y=70; зависание → прыжок-парабола (0.6 s) в другую точку.
const JUMP_POINTS = [60, 180, 240, 300, 420];

// Длительность прыжка не меняется по фазам (SPEC §7.2).
const JUMP_DURATION = 0.6;

// Высота дуги прыжка. SPEC не задаёт число — берём разумную величину.
const JUMP_APEX = 40;

// Начальная скорость дуговых снарядов. SPEC не задаёт число — берём Boss.js-
// совместимую величину (снаряды Супер-Туалета летят на 90 px/s по прямой).
const PROJECTILE_SPEED = 150;

// Приземление (SPEC §7.2): телеграф-круг r=40, контур виден 0.5 s до посадки,
// урон в круге — 0.25 s. Прыжок длится 600 ms, поэтому spawnDamageCircle
// запускаем через 100 ms после старта прыжка: 100 + 500 = 600 ms — ровно
// момент приземления, дальше 250 ms круг смертоносен.
const LANDING_RADIUS = 40;
const LANDING_TELEGRAPH_MS = 500;
const LANDING_ACTIVE_MS = 250;
const LANDING_DELAY_MS = 100;
// Y центра зоны приземления. SPEC §7.2 задаёт y=70 только точкам ПРЫЖКА;
// у круга приземления координата не указана. Ставим удар в зону игрока
// (y 184–262, §2), иначе «урон в круге» физически недостижим для игрока —
// удар-столб под точкой приземления по x. Интерпретация до решения владельца.
const LANDING_Y = 230;

// Разброс капель внутри одного бёрста, чтобы не летели друг в друга слоем.
// Точный угол в SPEC не задан.
const BURST_SPREAD_DEG = 8;

const PHASE_PARAMS = {
  1: { hoverDuration: 2.5, fireInterval: 3.0, fireCount: 3, doubleJump: false },
  2: { hoverDuration: 1.5, fireInterval: 2.5, fireCount: 5, doubleJump: true },
};

export class BossBigMacaque extends BossBase {
  constructor(scene, id = 'bigMacaque') {
    // SPEC §7.2: y=70; SPEC §7: очки акта 2 = 1000×2.
    super(scene, { id, texture: 'bossBigMacaque-0', x: 240, y: 70, maxHp: 160, points: 2000 });

    this.state = 'hover'; // 'hover' | 'jump'
    this.hoverTimer = 0;
    this.jumpTimer = 0;
    this.jumpStartX = this.x;
    this.jumpTargetX = this.x;
    this.jumpsLeft = 0;
    this.fireTimer = 0;

    this.applyPhaseParams();
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.hoverDuration = params.hoverDuration;
    this.fireInterval = params.fireInterval;
    this.fireCount = params.fireCount;
    this.doubleJump = params.doubleJump;
  }

  onUpdate(time, delta) {
    // Шаг состояния (зависание/прыжок) идёт каждый кадр безусловно — паузой
    // смены фазы гейтится только бросок снарядов ниже.
    if (this.state === 'hover') {
      this.hoverTimer += delta;

      if (this.hoverTimer >= this.hoverDuration * 1000) {
        this.hoverTimer = 0;
        // SPEC §7.2: фаза 2 — двойной прыжок (две парабулы подряд без
        // зависания между ними).
        this.jumpsLeft = this.doubleJump ? 2 : 1;
        this.startJump();
      }
    } else {
      this.jumpTimer += delta;
      const t = Phaser.Math.Clamp(this.jumpTimer / (JUMP_DURATION * 1000), 0, 1);
      const nx = Phaser.Math.Linear(this.jumpStartX, this.jumpTargetX, t);
      // SPEC §7.2: парабола прыжка; JUMP_APEX — высота дуги (не задана числом).
      const ny = 70 - JUMP_APEX * 4 * t * (1 - t);
      this.setPosition(nx, ny);
      this.body.reset(nx, ny);

      if (t >= 1) {
        this.setPosition(this.jumpTargetX, 70);
        this.body.reset(this.jumpTargetX, 70);

        this.jumpsLeft -= 1;
        if (this.jumpsLeft > 0) {
          this.startJump();
        } else {
          this.state = 'hover';
          this.hoverTimer = 0;
        }
      }
    }

    if (this.attacksPaused) {
      return;
    }

    // SPEC §7.2: бросок снарядов происходит только во время зависания —
    // таймер копится и в прыжке, но выстрел случится лишь по возврату в hover.
    this.fireTimer += delta;
    if (this.state === 'hover' && this.fireTimer >= this.fireInterval * 1000) {
      this.fireTimer = 0;
      this.fireBurst();
    }
  }

  // Выбирает точку прыжка, отличную от текущей позиции (актуально только
  // во время hover, когда this.x точно совпадает с одной из JUMP_POINTS).
  pickJumpTarget() {
    const options = JUMP_POINTS.filter((px) => px !== this.x);
    return options[Phaser.Math.Between(0, options.length - 1)];
  }

  startJump() {
    this.state = 'jump';
    this.jumpTimer = 0;
    this.jumpStartX = this.x;
    this.jumpTargetX = this.pickJumpTarget();

    const landX = this.jumpTargetX;
    this.scene.time.delayedCall(LANDING_DELAY_MS, () => {
      if (!this.active) {
        return;
      }
      this.scene.spawnDamageCircle(landX, LANDING_Y, LANDING_RADIUS, {
        telegraphMs: LANDING_TELEGRAPH_MS,
        activeMs: LANDING_ACTIVE_MS,
      });
    });
  }

  fireBurst() {
    const player = this.scene.player;
    if (!player || !player.active) {
      return;
    }

    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const count = this.fireCount;

    for (let i = 0; i < count; i += 1) {
      const offsetDeg = count > 1 ? -BURST_SPREAD_DEG + (2 * BURST_SPREAD_DEG * i) / (count - 1) : 0;
      const angle = baseAngle + Phaser.Math.DegToRad(offsetDeg);
      const p = this.scene.enemyProjectiles.get();

      if (!p) {
        continue;
      }

      // Пул enemyProjectiles общий: восстанавливаем каплю-макаку (6×6) перед броском.
      p.setTexture('macaquePoop-0');
      p.body.setSize(6, 6);
      p.effect = undefined;
      p.fire(this.x, this.y, Math.cos(angle) * PROJECTILE_SPEED, Math.sin(angle) * PROJECTILE_SPEED);
      // SPEC §7.2: гравитация — ПОСЛЕ fire(), т.к. Projectile.fire() каждый
      // раз обнуляет gravity/acceleration общего пула.
      p.body.setGravityY(400);
    }
  }

  onEnterPhase2() {
    this.applyPhaseParams();
    this.fireTimer = 0;
  }
}
