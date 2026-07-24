export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 240, 240, 'ship-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(10, 10);
    this.lastFired = -250;

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
    const directionX = Number(keys.D.isDown) - Number(keys.A.isDown);
    const directionY = Number(keys.S.isDown) - Number(keys.W.isDown);
    const magnitude = Math.hypot(directionX, directionY);
    const speed = magnitude > 1 ? 140 / Math.SQRT2 : 140;
    const step = (speed * delta) / 1000;

    // Position-based: clamp lands in the same frame, so the sprite never
    // pokes past the boundary for one physics step.
    this.x = Phaser.Math.Clamp(this.x + directionX * step, 8, 472);
    this.y = Phaser.Math.Clamp(this.y + directionY * step, 184, 262);
    this.body.reset(this.x, this.y);
  }

  tryFire(time, projectilesGroup) {
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
