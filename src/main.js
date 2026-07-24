import { BootScene } from './scenes/BootScene.js';
import { Player } from './entities/Player.js';
import { Projectile } from './entities/Projectile.js';
import { Starfield } from './systems/Starfield.js';

class PlaygroundScene extends Phaser.Scene {
  constructor() {
    super('playground');
  }

  create() {
    this.starfield = new Starfield(this);
    this.player = new Player(this);
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
      maxSize: 4,
    });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
  }

  update(time, delta) {
    this.starfield.update(delta);
    this.player.update(this.keys, delta);

    if (this.keys.SPACE.isDown) {
      this.player.tryFire(time, this.projectiles);
    }
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
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, PlaygroundScene],
};

const game = new Phaser.Game(config);
window.game = game; // debug/test handle (safe: public game, no secrets)

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

// TitleScene will replace this flow later.
