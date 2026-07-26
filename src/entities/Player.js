import { explode, shakePlayerDeath } from '../systems/Effects.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §8: пауэр-апы уровневые (решение владельца 2026-07-26). Оружие:
// 1 → 2 → 3 снаряда в залпе, щит: 1 → 2 поглощаемых попадания. Выше потолка
// уровень не растёт — лишний бонус сцена конвертирует в очки (§9).
export const MAX_SHOT_LEVEL = 2;
export const MAX_SHIELD_CHARGES = 2;

// SPEC §3: смещения снарядов залпа по x от центра корабля, по уровню оружия.
const SHOT_OFFSETS = [[0], [-5, 5], [-7, 0, 7]];

// Кольца щита (§8): радиус на заряд, второе появляется у двойного щита.
const SHIELD_RING_RADII = [11, 15];

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 240, 240, 'ship-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(10, 10);
    this.lastFired = -250;
    this.lives = 3;
    this.invulnerable = false;
    this.dead = false;
    this.respawnEvent = null;
    this.invulnerabilityEvent = null;
    this.speedMul = 1;
    this.slowEvent = null;

    // Пауэр-апы (§8): оружие — уровень 0..2 (1/2/3 снаряда), бессрочно,
    // снимается только потерей жизни; щит — 0..2 заряда, каждый поглощает
    // одно попадание. На потолке бонус не копится, а идёт в очки (§9).
    this.shotLevel = 0;
    this.shieldCharges = 0;

    if (!scene.anims.exists('ship-idle')) {
      scene.anims.create({
        key: 'ship-idle',
        frames: [{ key: 'ship-0' }, { key: 'ship-1' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    this.play('ship-idle');

    // Кольца щита вокруг корабля (§8): по кольцу на заряд. У двойного щита
    // кольца пульсируют в противофазе (анимация уровня, решение владельца
    // 2026-07-26), у одиночного кольцо остаётся статичным.
    this.shieldRings = SHIELD_RING_RADII.map((radius) =>
      scene.add
        .circle(this.x, this.y, radius)
        .setStrokeStyle(2, 0x59d6e6, 0.9)
        .setDepth(6)
        .setVisible(false),
    );
    this.shieldPulse = null;

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.stopShieldPulse();
      for (const ring of this.shieldRings) {
        ring.destroy();
      }
      this.shieldRings = [];
    });
  }

  update(keys, delta) {
    if (this.dead) {
      this.updateShieldRings();
      return;
    }

    // §2: WASD и стрелки равнозначны — нажатие любой из пары даёт то же направление.
    const directionX = Number(keys.D.isDown || keys.RIGHT.isDown) - Number(keys.A.isDown || keys.LEFT.isDown);
    const directionY = Number(keys.S.isDown || keys.DOWN.isDown) - Number(keys.W.isDown || keys.UP.isDown);
    const magnitude = Math.hypot(directionX, directionY);
    const base = 140 * this.speedMul;
    const speed = magnitude > 1 ? base / Math.SQRT2 : base;
    const step = (speed * delta) / 1000;

    // Position-based: clamp lands in the same frame, so the sprite never
    // pokes past the boundary for one physics step.
    this.x = Phaser.Math.Clamp(this.x + directionX * step, 8, 472);
    this.y = Phaser.Math.Clamp(this.y + directionY * step, 184, 262);
    this.body.reset(this.x, this.y);

    this.updateShieldRings();
  }

  // Подбор пауэр-апа (§8): поднимает уровень оружия или добавляет заряд щита.
  // Возвращает false, если уровень уже на потолке — тогда сцена начисляет
  // очки вместо усиления (§9).
  applyPowerUp(type) {
    if (type === 'shot') {
      if (this.shotLevel >= MAX_SHOT_LEVEL) {
        return false;
      }
      this.shotLevel += 1;
      return true;
    }

    if (type === 'shield') {
      if (this.shieldCharges >= MAX_SHIELD_CHARGES) {
        return false;
      }
      this.shieldCharges += 1;
      this.updateShieldRings();
      return true;
    }

    return false;
  }

  // Кольца щита (§8): видно ровно столько колец, сколько зарядов; мёртвый
  // корабль колец не показывает. Пульсация — только у полного (двойного) щита.
  updateShieldRings() {
    const charges = this.dead ? 0 : this.shieldCharges;

    for (let i = 0; i < this.shieldRings.length; i += 1) {
      this.shieldRings[i].setVisible(i < charges).setPosition(this.x, this.y);
    }

    if (charges >= MAX_SHIELD_CHARGES) {
      this.startShieldPulse();
    } else {
      this.stopShieldPulse();
    }
  }

  // Анимация двойного щита: кольца дышат в противофазе — внешнее расходится,
  // пока внутреннее поджимается. Два твина одной длительности заводятся
  // вместе и потому не расходятся; пауза сцены останавливает оба.
  // Вызывается каждый кадр из updateShieldRings — повторный вход no-op.
  startShieldPulse() {
    if (this.shieldPulse || this.shieldRings.length < SHIELD_RING_RADII.length) {
      return;
    }

    const pulse = (target, from, to) =>
      this.scene.tweens.add({
        targets: target,
        scale: { from, to },
        duration: 450,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

    const [inner, outer] = this.shieldRings;
    this.shieldPulse = [pulse(outer, 1, 1.15), pulse(inner, 1.08, 1)];
  }

  // Снимает пульсацию и возвращает кольца к базовому масштабу: без этого
  // потраченный второй заряд оставил бы раздутое одиночное кольцо.
  stopShieldPulse() {
    if (!this.shieldPulse) {
      return;
    }

    for (const tween of this.shieldPulse) {
      tween.stop();
    }
    this.shieldPulse = null;

    for (const ring of this.shieldRings) {
      ring.setScale(1);
    }
  }

  // Внешняя тяга (воронка босса, §7): шаг к (tx,ty) на speed px/s с клампом
  // в зону игрока (§2). На мёртвого игрока не действует.
  pullToward(tx, ty, speed, delta) {
    if (this.dead) {
      return;
    }

    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) {
      return;
    }

    const move = Math.min((speed * delta) / 1000, dist);
    this.x = Phaser.Math.Clamp(this.x + (dx / dist) * move, 8, 472);
    this.y = Phaser.Math.Clamp(this.y + (dy / dist) * move, 184, 262);
    this.body.reset(this.x, this.y);
  }

  slow(factor, durationMs) {
    this.speedMul = factor;
    if (this.slowEvent) this.slowEvent.remove();
    this.slowEvent = this.scene.time.delayedCall(durationMs, () => {
      this.speedMul = 1;
      this.slowEvent = null;
    });
  }

  hit() {
    if (this.invulnerable || this.dead) {
      return;
    }

    // SPEC §8: щит поглощает попадание — по заряду за раз, без потери жизни.
    // Даём короткую неуязвимость (1.0 s, §8 не задаёт), иначе тот же
    // непрерывный оверлап (пикировщик/лужа/босс) съел бы и второй заряд, и
    // жизнь уже на следующем кадре.
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1;
      this.updateShieldRings();
      this.grantInvulnerability(1000);
      getAudio()?.sfx('shield'); // SPEC §12: лопнувший пузырь щита
      return;
    }

    // §8: усиление оружия бессрочно, но смерть его снимает. Ветка щита выше
    // жизнь не тратит и сюда не доходит — там бонус сохраняется.
    this.shotLevel = 0;

    this.lives -= 1;
    this.dead = true;
    // Чистая волна (§9) сбрасывается при потере жизни — слушает сцена.
    this.scene.events.emit('player-hit');
    getAudio()?.sfx('player_death'); // SPEC §12: смерть корабля
    explode(this.scene, this.x, this.y, { count: 20, tint: 0xf4f4f4 });
    shakePlayerDeath(this.scene);
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.updateShieldRings();

    this.respawnEvent = this.scene.time.delayedCall(1500, () => {
      if (this.lives === 0) {
        // SPEC §14: 3 смерти → GameOver. Переход выполняет сцена.
        this.scene.events.emit('game-over');
        return;
      }

      this.respawn();
    });
  }

  respawn() {
    this.setPosition(240, 240);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.reset(this.x, this.y);
    this.dead = false;
    this.grantInvulnerability(2000);
  }

  // Неуязвимость на durationMs с мерцанием 8 Гц (SPEC §2/§10). Общая для
  // респауна (2.0 s) и поглощения щитом (1.0 s).
  grantInvulnerability(durationMs) {
    this.invulnerable = true;
    if (this.invulnerabilityEvent) {
      this.invulnerabilityEvent.remove(false);
    }
    this.invulnerabilityEvent = this.scene.time.addEvent({
      delay: 125,
      loop: true,
      callback: () => this.setVisible(!this.visible),
    });
    this.scene.time.delayedCall(durationMs, () => {
      this.invulnerabilityEvent?.remove(false);
      this.invulnerabilityEvent = null;
      this.invulnerable = false;
      this.setVisible(true);
    });
  }

  tryFire(time, projectilesGroup) {
    if (this.dead) {
      return false;
    }
    if (time - this.lastFired < 250) {
      return false;
    }

    // SPEC §3: макс 4 снаряда на ствол (4 / 8 / 12 по уровню оружия); залп
    // атомарен — не стреляем, если свободно меньше снарядов, чем в залпе
    // (иначе усиление выродилось бы в неполный залп).
    const offsets = SHOT_OFFSETS[this.shotLevel];
    const shots = offsets.length;
    const cap = 4 * shots;
    if (projectilesGroup.countActive(true) > cap - shots) {
      return false;
    }

    // get() возвращает первый НЕактивный объект, не активируя его: без
    // резерва следующий get() вернул бы ТОТ ЖЕ объект и залп выродился бы в
    // один снаряд. Резервируем весь залп, при нехватке — откатываем.
    const salvo = [];
    for (let i = 0; i < shots; i += 1) {
      const projectile = projectilesGroup.get();
      if (!projectile) {
        for (const reserved of salvo) {
          reserved.deactivate();
        }
        return false;
      }
      projectile.setActive(true).setVisible(true);
      salvo.push(projectile);
    }

    for (let i = 0; i < shots; i += 1) {
      salvo[i].fire(this.x + offsets[i], this.y - 10);
    }

    // SPEC §12: один звук на залп; у трёх стволов он свой, более плотный.
    getAudio()?.sfx(shots === 3 ? 'shoot_triple' : 'shoot');
    this.lastFired = time;
    return true;
  }
}
