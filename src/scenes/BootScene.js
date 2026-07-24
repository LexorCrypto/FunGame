import { PALETTE, SPRITES, validateSprites } from '../data/sprites.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    validateSprites();

    for (const [spriteKey, frames] of Object.entries(SPRITES)) {
      frames.forEach((frame, frameIndex) => {
        const textureKey = `${spriteKey}-${frameIndex}`;
        const canvas = this.textures.createCanvas(
          textureKey,
          frame[0].length,
          frame.length,
        );
        const ctx = canvas.context;

        frame.forEach((row, y) => {
          for (let x = 0; x < row.length; x += 1) {
            const color = PALETTE[row[x]];

            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        });

        canvas.refresh();
      });
    }

    this.scene.start('playground');
  }
}
