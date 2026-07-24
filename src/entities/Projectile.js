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
    } = {},
  ) {
    super(scene, 0, 0, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speedY = speedY;
    this.minY = minY;
    this.maxY = maxY;
    this.body.setSize(bodyWidth, bodyHeight);
    this.deactivate();
  }


  fire(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocity(0, this.speedY);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.active && (this.y < this.minY || this.y > this.maxY)) {
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
