import { BootScene } from './scenes/BootScene.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { EnemyProjectile, Projectile } from './entities/Projectile.js';
import { Starfield } from './systems/Starfield.js';
import { Formation } from './systems/Formation.js';
import { DiveDirector } from './systems/DivePatterns.js';
import { Puddle } from './entities/Puddle.js';

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

    const roster = [
      ['dryer', 4, 0], ['toilet', 5, 0],
      ['brush', 0, 1], ['plunger', 2, 1], ['cockroach', 5, 1], ['plunger', 7, 1], ['brush', 9, 1],
      ['mold', 1, 2], ['urinal', 3, 2], ['poop', 5, 2], ['mold', 7, 2],
    ];
    for (const [type, col, row] of roster) {
      const enemy = new Enemy(this, type);
      this.enemies.add(enemy);
      this.formation.addMember(enemy, col, row);
    }
    this.diveDirector = new DiveDirector(this, this.formation, {
      // Формация волны 1 (§6): отрыв каждые 3.0 с, 1 одновременный пикировщик.
      diveInterval: 3.0,
      maxDivers: 1,
    });

    this.enemyDiedHandler = (enemy) => this.formation.removeMember(enemy);
    this.events.on('enemy-died', this.enemyDiedHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('enemy-died', this.enemyDiedHandler);
    });

    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      (projectile, enemy) => {
        if (enemy.diveState === 'returning') {
          return; // неуязвим при возврате в слот (§4)
        }
        enemy.takeDamage(1);
        projectile.deactivate();
      },
    );
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (enemy.diveState === 'returning') {
        return; // не дамажит при возврате в слот (§4)
      }
      player.hit();
      if (enemy.type === 'brush') {
        enemy.die(); // Ёршик — камикадзе: гибнет о игрока (§4)
      }
    });
    this.physics.add.overlap(
      this.player,
      this.enemyProjectiles,
      (player, projectile) => {
        if (projectile.effect === 'slow') {
          player.slow(0.5, 3000);
        } else {
          player.hit();
        }
        projectile.deactivate();
      },
    );
    this.hazards = this.add.group();
    this.physics.add.overlap(this.player, this.hazards, (player) => player.hit());
  }

  spawnPuddle(x, y) {
    const puddle = new Puddle(this, x, y);
    this.hazards.add(puddle);
    return puddle;
  }

  spawnFormationEnemy(type, col, row, opts) {
    const enemy = new Enemy(this, type, opts);
    this.enemies.add(enemy);
    this.formation.addMember(enemy, col, row);
    return enemy;
  }

  update(time, delta) {
    this.starfield.update(delta);
    this.player.update(this.keys, delta);
    this.formation.update(time);
    this.diveDirector.update(time, delta);

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
function viewportSize() {
  const vv = window.visualViewport;

  return vv
    ? [vv.width, vv.height]
    : [window.innerWidth, window.innerHeight];
}

function applyIntegerZoom() {
  // Pinch gesture in progress: visualViewport shrinks without a layout
  // change — do not chase it with a new integer multiplier.
  if (window.visualViewport && window.visualViewport.scale !== 1) {
    return;
  }

  const [vw, vh] = viewportSize();
  // Center against the measured viewport, not the large-viewport vh unit.
  document.body.style.height = `${vh}px`;
  const k = Math.floor(Math.min(vw / 480, vh / 270));

  if (k < 1) {
    // Viewport smaller than the field: give FIT the whole measured window
    // (fractional shrink). Measured px, not 100vw/vh: vh is the *large*
    // viewport on mobile and browser chrome would obscure the field.
    container.style.width = `${vw}px`;
    container.style.height = `${vh}px`;
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
window.visualViewport?.addEventListener('resize', applyIntegerZoom);
applyIntegerZoom();

// TitleScene will replace this flow later.
