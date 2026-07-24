export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene) {
    super(scene, 0, 0, 'playerBullet-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(3, 6);
    this.deactivate();
  }

  fire(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocity(0, -300);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.active && this.y < -8) {
      this.deactivate();
    }
  }

  deactivate() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
  }
}
