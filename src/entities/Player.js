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


    if (!scene.anims.exists('ship-idle')) {
      scene.anims.create({
        key: 'ship-idle',
        frames: [{ key: 'ship-0' }, { key: 'ship-1' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    this.play('ship-idle');
  }

  update(keys, delta) {
    if (this.dead) {
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

    this.lives -= 1;
    this.dead = true;
    explode(this.scene, this.x, this.y, { count: 20, tint: 0xf4f4f4 });
    shakePlayerDeath(this.scene);
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;

    this.respawnEvent = this.scene.time.delayedCall(1500, () => {
      if (this.lives === 0) {
        // Placeholder until FUN-20's GameOver scene: freeze instead of a
        // silent reset. Fade out and pause the world (no UI strings yet).
        this.scene.cameras.main.fadeOut(500, 0, 0, 0);
        this.scene.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          () => this.scene.scene.pause(),
        );
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
    if (
      time - this.lastFired < 250 ||
      projectilesGroup.countActive(true) >= 4
    ) {
      return false;
    }

    const projectile = projectilesGroup.get();

    if (!projectile) {
      return false;
    }

    projectile.fire(this.x, this.y - 10);
    this.lastFired = time;
    return true;
  }
}
