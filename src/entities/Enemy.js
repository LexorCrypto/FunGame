import { explode } from '../systems/Effects.js';

const ENEMY_TINTS = {
  cockroach: 0x7a4a2b,
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type, { hp = 1 } = {}) {
    super(scene, 0, 0, `${type}-0`);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.hp = hp;
    this.body.setSize(this.width, this.height);

    const idleKey = `${type}-idle`;

    if (scene.textures.exists(`${type}-1`)) {
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key: `${type}-0` }, { key: `${type}-1` }],
          frameRate: 6,
          repeat: -1,
        });
      }

      this.play(idleKey);
    }
  }

  die() {
    if (!this.active) {
      return;
    }

    explode(this.scene, this.x, this.y, {
      count: Phaser.Math.Between(8, 12),
      tint: ENEMY_TINTS[this.type] ?? 0xffffff,
    });
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.scene.events.emit('enemy-died', this);
  }
}
