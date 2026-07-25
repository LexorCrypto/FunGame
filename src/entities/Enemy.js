import { explode } from '../systems/Effects.js';
import { getAudio } from '../systems/Audio.js';

const ENEMY_TINTS = {
  urinal: [0xe8f0f4, 0x8fb9c8],
  poop: [0x7a4a2b, 0xa9703f],
  toilet: [0xf4f4f4, 0xbfc9cf],
  cockroach: [0x7a4a2b, 0xa9703f],
  brush: [0xc0392b, 0xe74c3c],
  plunger: [0xc0392b, 0x7a4a2b],
  mold: [0x4a9d3f, 0x7ac070],
  dryer: [0xcfd8dd, 0x4a9d3f],
};

const ENEMY_HP = {
  toilet: 3,
  dryer: 2,
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, type, { hp, generation } = {}) {
    super(scene, 0, 0, `${type}-0`);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.generation = generation ?? 0;
    this.divideTimer = 0;
    this.diveState = 'idle'; // idle (в строю) | diving | returning
    this.hp = hp ?? ENEMY_HP[type] ?? 1;
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

  takeDamage(amount = 1) {
    if (!this.active) {
      return;
    }

    this.hp -= amount;

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (!this.active) {
      return;
    }

    getAudio()?.sfx('enemy_explode'); // SPEC §12: взрыв врага
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
