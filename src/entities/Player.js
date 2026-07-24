import { explode, shakePlayerDeath } from '../systems/Effects.js';

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

    // Пауэр-апы (§8): двойной выстрел — таймер в мс; щит — булев, поглощает
    // 1 попадание, не стакается.
    this.doubleShotMs = 0;
    this.shielded = false;

    if (!scene.anims.exists('ship-idle')) {
      scene.anims.create({
        key: 'ship-idle',
        frames: [{ key: 'ship-0' }, { key: 'ship-1' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    this.play('ship-idle');

    // Кольцо щита вокруг корабля (§8): видно, пока щит активен.
    this.shieldRing = scene.add
      .circle(this.x, this.y, 11)
      .setStrokeStyle(2, 0x59d6e6, 0.9)
      .setDepth(6)
      .setVisible(false);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.shieldRing?.destroy();
      this.shieldRing = null;
    });
  }

  update(keys, delta) {
    // Таймер двойного выстрела идёт всегда (§8: бонус по времени, 10 s).
    if (this.doubleShotMs > 0) {
      this.doubleShotMs = Math.max(0, this.doubleShotMs - delta);
    }

    if (this.dead) {
      this.shieldRing?.setVisible(false);
      return;
    }

    const directionX = Number(keys.D.isDown) - Number(keys.A.isDown);
    const directionY = Number(keys.S.isDown) - Number(keys.W.isDown);
    const magnitude = Math.hypot(directionX, directionY);
    const base = 140 * this.speedMul;
    const speed = magnitude > 1 ? base / Math.SQRT2 : base;
    const step = (speed * delta) / 1000;

    // Position-based: clamp lands in the same frame, so the sprite never
    // pokes past the boundary for one physics step.
    this.x = Phaser.Math.Clamp(this.x + directionX * step, 8, 472);
    this.y = Phaser.Math.Clamp(this.y + directionY * step, 184, 262);
    this.body.reset(this.x, this.y);

    if (this.shieldRing) {
      this.shieldRing.setVisible(this.shielded);
      this.shieldRing.setPosition(this.x, this.y);
    }
  }

  // Подбор пауэр-апа (§8). 'shot' — двойной выстрел на 10 s; 'shield' — щит
  // (обновляется до 1, не стакается).
  applyPowerUp(type) {
    if (type === 'shot') {
      this.doubleShotMs = 10000;
    } else if (type === 'shield') {
      this.shielded = true;
      this.shieldRing?.setVisible(true);
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

    // SPEC §8: щит поглощает 1 попадание — без потери жизни.
    if (this.shielded) {
      this.shielded = false;
      this.shieldRing?.setVisible(false);
      return;
    }

    this.lives -= 1;
    this.dead = true;
    // Чистая волна (§9) сбрасывается при потере жизни — слушает сцена.
    this.scene.events.emit('player-hit');
    explode(this.scene, this.x, this.y, { count: 20, tint: 0xf4f4f4 });
    shakePlayerDeath(this.scene);
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.shieldRing?.setVisible(false);

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
    this.invulnerable = true;

    this.invulnerabilityEvent = this.scene.time.addEvent({
      delay: 125,
      loop: true,
      callback: () => this.setVisible(!this.visible),
    });

    this.scene.time.delayedCall(2000, () => {
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

    // SPEC §3: макс 4 снаряда (8 с двойным выстрелом); двойной — атомарно,
    // не стреляем, если нет двух свободных слотов (иначе усиление даст одиночный).
    const doubleShot = this.doubleShotMs > 0;
    const cap = doubleShot ? 8 : 4;
    const need = doubleShot ? 2 : 1;
    if (projectilesGroup.countActive(true) > cap - need) {
      return false;
    }

    if (doubleShot) {
      const p1 = projectilesGroup.get();
      if (!p1) {
        return false;
      }
      // get() возвращает первый НЕактивный объект, не активируя его: без резерва
      // второй get() вернул бы ТОТ ЖЕ объект и залп выродился бы в один снаряд.
      // Резервируем p1, затем берём p2; если p2 нет — откатываем p1 (не стреляем).
      p1.setActive(true).setVisible(true);
      const p2 = projectilesGroup.get();
      if (!p2) {
        p1.deactivate();
        return false;
      }
      // SPEC §3: два снаряда со смещением ±5 px по x.
      p1.fire(this.x - 5, this.y - 10);
      p2.fire(this.x + 5, this.y - 10);
    } else {
      const projectile = projectilesGroup.get();
      if (!projectile) {
        return false;
      }
      projectile.fire(this.x, this.y - 10);
    }

    this.lastFired = time;
    return true;
  }
}
