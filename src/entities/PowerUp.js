// SPEC §8: пауэр-ап выпадает из убитого пикирующего врага (8% шанс,
// 60% выстрел / 40% щит). Падает 60 px/s, подбирается касанием, за краем
// поля — пропадает. Тип: 'shot' (двойной выстрел) | 'shield'.
export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const texture = type === 'shield' ? 'powerupShield-0' : 'powerupDoubleShot-0';
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type; // 'shot' | 'shield'
    this.body.setSize(this.width, this.height);
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 60);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // За нижним краем поля (270) — пропадает (§8).
    if (this.y > 278) {
      this.destroy();
    }
  }
}
