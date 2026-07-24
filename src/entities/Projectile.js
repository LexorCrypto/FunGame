export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene,
    {
      texture = 'playerBullet-0',
      speedY = -300,
      bodyWidth = 3,
      bodyHeight = 6,
      minY = -8,
      maxY = 278,
      minX = -8,
      maxX = 488,
    } = {},
  ) {
    super(scene, 0, 0, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speedY = speedY;
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    this.body.setSize(bodyWidth, bodyHeight);
    this.deactivate();
  }


  fire(x, y, vx = 0, vy = this.speedY) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocity(vx, vy);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (
      this.active &&
      (this.y < this.minY ||
        this.y > this.maxY ||
        this.x < this.minX ||
        this.x > this.maxX)
    ) {
      this.deactivate();
    }
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}

export class EnemyProjectile extends Projectile {
  constructor(scene) {
    super(scene, {
      texture: 'enemyDrop-0',
      speedY: 120,
      bodyWidth: 4,
      bodyHeight: 4,
    });
  }
}
