import { BootScene } from './scenes/BootScene.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { EnemyProjectile, Projectile } from './entities/Projectile.js';
import { Starfield } from './systems/Starfield.js';
import { Formation } from './systems/Formation.js';

class PlaygroundScene extends Phaser.Scene {
  constructor() {
    super('playground');
  }

  create() {
    this.starfield = new Starfield(this);
    this.player = new Player(this);
    this.playerProjectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
      maxSize: 4,
    });
    this.enemies = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({
      classType: EnemyProjectile,
      runChildUpdate: true,
      maxSize: 12,
    });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.formation = new Formation(this);

    const cockroach = new Enemy(this, 'cockroach');
    this.enemies.add(cockroach);
    this.formation.addMember(cockroach, 4, 1);

    this.enemyDiedHandler = (enemy) => this.formation.removeMember(enemy);
    this.events.on('enemy-died', this.enemyDiedHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('enemy-died', this.enemyDiedHandler);
    });

    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      (projectile, enemy) => {
        enemy.takeDamage(1);
        projectile.deactivate();
      },
    );
    this.physics.add.overlap(this.player, this.enemies, (player) => {
      player.hit();
    });
    this.physics.add.overlap(
      this.player,
      this.enemyProjectiles,
      (player, projectile) => {
        player.hit();
        projectile.deactivate();
      },
    );
  }

  update(time, delta) {
    this.starfield.update(delta);
    this.player.update(this.keys, delta);
    this.formation.update(time);

    if (this.keys.SPACE.isDown) {
      this.player.tryFire(time, this.playerProjectiles);
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
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

const container = document.getElementById('game-container');

// Integer zoom without touching canvas CSS: constrain the parent to an
// integer multiple of 480×270 and let Scale.FIT compute canvas size,
// centering and pointer scale itself (overriding canvas CSS post-FIT
// breaks centering and pointer calibration on non-multiple viewports).
function applyIntegerZoom() {
  const k = Math.floor(
    Math.min(window.innerWidth / 480, window.innerHeight / 270),
  );

  if (k < 1) {
    // Viewport smaller than the field: give FIT the whole window
    // (fractional shrink), otherwise the stale fixed size would overflow.
    container.style.width = '100vw';
    container.style.height = '100vh';
  } else {
    container.style.width = `${480 * k}px`;
    container.style.height = `${270 * k}px`;
  }

  // Defer to the next frame: called from the window-resize listener, and a
  // synchronous refresh races the ScaleManager's own resize handling — the
  // canvas keeps the old display size. After the frame settles, FIT
  // recomputes size, centering and pointer scale correctly.
  requestAnimationFrame(() => game.scale.refresh());
}

window.addEventListener('resize', applyIntegerZoom);
applyIntegerZoom();

// TitleScene will replace this flow later.
