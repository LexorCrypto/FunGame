import { Starfield } from './systems/Starfield.js';

class StarfieldScene extends Phaser.Scene {
  constructor() {
    super('starfield');
  }

  create() {
    this.starfield = new Starfield(this);
  }

  update(time, delta) {
    this.starfield.update(delta);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 270,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true,
  },
  scene: StarfieldScene,
};

const game = new Phaser.Game(config);

function applyIntegerCanvasScale() {
  const k = Math.floor(
    Math.min(window.innerWidth / 480, window.innerHeight / 270),
  );

  if (k < 1) {
    return;
  }

  game.canvas.style.width = `${480 * k}px`;
  game.canvas.style.height = `${270 * k}px`;
}

game.scale.on(Phaser.Scale.Events.RESIZE, applyIntegerCanvasScale);
applyIntegerCanvasScale();

// FUN-3 replaces this placeholder scene with BootScene.
