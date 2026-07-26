import { PALETTE, SPRITES, validateSprites } from '../data/sprites.js';
import { AUDIO_FILES } from '../systems/Audio.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  // SPEC §12: 19 SFX + 6 музыкальных треков из assets/audio/ (сгенерированы
  // офлайн ElevenLabs, FUN-22). Загрузка включена атомарно с файлами в репо —
  // раньше её не было намеренно (404 в консоли до генерации нарушали бы §16).
  preload() {
    for (const { key, path } of AUDIO_FILES) {
      this.load.audio(key, path);
    }
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

    this.scene.start('title');
  }
}
