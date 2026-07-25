import { BootScene } from './scenes/BootScene.js';
import { Player } from './entities/Player.js';
import { Enemy } from './entities/Enemy.js';
import { EnemyProjectile, Projectile } from './entities/Projectile.js';
import { Starfield } from './systems/Starfield.js';
import { Formation } from './systems/Formation.js';
import { DiveDirector } from './systems/DivePatterns.js';
import { Puddle } from './entities/Puddle.js';
import { Boss } from './entities/Boss.js';
import { BossBigMacaque } from './entities/BossBigMacaque.js';
import { BossSuperPoop } from './entities/BossSuperPoop.js';
import { BossRoachQueen } from './entities/BossRoachQueen.js';
import { BossPlumber } from './entities/BossPlumber.js';
import { BossGoldenThrone } from './entities/BossGoldenThrone.js';
import { WaveDirector } from './systems/WaveDirector.js';
import { Scoring } from './systems/Scoring.js';
import { initAudio, getAudio } from './systems/Audio.js';
import { PowerUp } from './entities/PowerUp.js';
import { TitleScene } from './scenes/TitleScene.js';
import { CrawlScene } from './scenes/CrawlScene.js';
import { EndScene } from './scenes/EndScene.js';

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
      maxSize: 8,
    });
    this.enemies = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group({
      classType: EnemyProjectile,
      runChildUpdate: true,
      maxSize: 12,
    });
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.formation = new Formation(this);

    this.diveDirector = new DiveDirector(this, this.formation);
    this.bosses = this.physics.add.group();

    this.scoring = new Scoring(this);
    this.powerups = this.physics.add.group();
    this.lifeLostThisWave = false;

    this.enemyDiedHandler = (enemy) => this.formation.removeMember(enemy);
    // При смерти босса гасим его телеграф-зоны и начисляем очки (SPEC §7/§9).
    this.clearZonesHandler = () => this.clearDamageZones();
    this.bossScoreHandler = (boss) => this.scoring.addBoss(boss);
    // Потеря жизни отменяет бонус чистой волны текущей волны (SPEC §9).
    this.playerHitHandler = () => {
      this.lifeLostThisWave = true;
    };
    // SPEC §9: зачистка волны без потери жизни — бонус +250×акт.
    this.waveClearedHandler = (info) => {
      getAudio()?.sfx('wave_clear'); // SPEC §12: чистая волна (level clear)
      if (!this.lifeLostThisWave) {
        this.scoring.addCleanWave(info.act);
      }
      this.lifeLostThisWave = false;
    };
    // SPEC §14: 3 смерти → GameOver-сцена с итоговым счётом и волной.
    this.gameOverHandler = () => {
      this.scene.start('end', {
        score: this.scoring.score,
        wave: this.waveDirector.index + 1,
      });
    };

    this.events.on('enemy-died', this.enemyDiedHandler);
    this.events.on('boss-defeated', this.clearZonesHandler);
    this.events.on('boss-defeated', this.bossScoreHandler);
    this.events.on('player-hit', this.playerHitHandler);
    this.events.on('wave-cleared', this.waveClearedHandler);
    this.events.on('game-over', this.gameOverHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('enemy-died', this.enemyDiedHandler);
      this.events.off('boss-defeated', this.clearZonesHandler);
      this.events.off('boss-defeated', this.bossScoreHandler);
      this.events.off('player-hit', this.playerHitHandler);
      this.events.off('wave-cleared', this.waveClearedHandler);
      this.events.off('game-over', this.gameOverHandler);
      this.clearDamageZones();
    });

    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      (projectile, enemy) => {
        if (enemy.diveState === 'returning') {
          return; // неуязвим при возврате в слот (§4)
        }
        const diving = enemy.diveState === 'diving';
        enemy.takeDamage(1);
        projectile.deactivate();
        if (!enemy.active) {
          // Убит этим попаданием (§9): очки (×2 при пикировании) + шанс дропа
          // пауэр-апа только из пикирующего врага (§8).
          this.scoring.addEnemyKill(enemy, diving);
          if (diving) {
            this.maybeDropPowerUp(enemy.x, enemy.y);
          }
        } else {
          // Выжил (туалет 3 HP, сушка 2 HP, бронированное отродье): хит-конфирм.
          getAudio()?.sfx('hit'); // SPEC §12: попадание
        }
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

    // Пауэр-апы (§8): подбор касанием применяет эффект к кораблю.
    this.physics.add.overlap(this.player, this.powerups, (player, pu) => {
      player.applyPowerUp(pu.type);
      getAudio()?.sfx('powerup'); // SPEC §12: подбор пауэр-апа
      pu.destroy();
    });

    // Босс-волны (§7): контакт = смерть игрока; снаряд игрока = урон боссу.
    this.physics.add.overlap(this.player, this.bosses, (player) => player.hit());
    this.physics.add.overlap(
      this.playerProjectiles,
      this.bosses,
      (projectile, boss) => {
        boss.takeDamage(1);
        projectile.deactivate();
      },
    );

    // Волновой дирижёр (§6/§14): подаёт волны в строй, спавнит боссов, баннеры.
    this.waveDirector = new WaveDirector(this, {
      formation: this.formation,
      diveDirector: this.diveDirector,
      bossFactory: {
        superToilet: () => new Boss(this, 'superToilet'),
        bigMacaque: () => new BossBigMacaque(this, 'bigMacaque'),
        superPoop: () => new BossSuperPoop(this, 'superPoop'),
        roachQueen: () => new BossRoachQueen(this, 'roachQueen'),
        plumber: () => new BossPlumber(this, 'plumber'),
        // SPEC §7.6: босс бесконечного цикла (FUN-25).
        goldenThrone: () => new BossGoldenThrone(this, 'goldenThrone'),
      },
    });
    this.waveDirector.start();
  }

  spawnPuddle(x, y) {
    const puddle = new Puddle(this, x, y);
    this.hazards.add(puddle);
    getAudio()?.sfx('splat'); // SPEC §12: плюх — лужа туалета
    return puddle;
  }

  spawnFormationEnemy(type, col, row, opts) {
    const enemy = new Enemy(this, type, opts);
    this.enemies.add(enemy);
    this.formation.addMember(enemy, col, row);
    return enemy;
  }

  // SPEC §8: 20% шанс дропа из убитого пикирующего врага (70% выстрел / 30% щит).
  // Ставка поднята с 8%/60% по просьбе владельца 2026-07-25 — бонусы на оружие
  // должны выпадать заметно чаще.
  maybeDropPowerUp(x, y) {
    if (Math.random() >= 0.2) {
      return;
    }
    const type = Math.random() < 0.7 ? 'shot' : 'shield';
    this.powerups.add(new PowerUp(this, x, y, type));
  }

  // Телеграф-зона урона боссов (SPEC §7.2/§7.5): контур в течение telegraphMs
  // (без урона), затем заливка + круговое тело на activeMs (оверлап с игроком
  // = смерть, через группу hazards). Круг сам уничтожается по истечении.
  spawnDamageCircle(x, y, radius, { telegraphMs = 0, activeMs = 200, contourColor = 0xffffff, fillColor = 0xc23b4e } = {}) {
    this.damageZones ??= [];
    const zone = this.add.circle(x, y, radius, 0xffffff, 0).setStrokeStyle(2, contourColor, 0.9).setDepth(50);
    const entry = { zone, telegraphTimer: null, activeTimer: null };
    this.damageZones.push(entry);

    const remove = () => {
      zone.destroy();
      const i = this.damageZones.indexOf(entry);
      if (i >= 0) {
        this.damageZones.splice(i, 1);
      }
    };

    const activate = () => {
      if (!zone.active) {
        return;
      }
      zone.setFillStyle(fillColor, 0.35);
      this.physics.add.existing(zone);
      zone.body.setCircle(radius);
      zone.body.setAllowGravity(false);
      zone.body.immovable = true;
      this.hazards.add(zone);
      entry.activeTimer = this.time.delayedCall(activeMs, remove);
    };

    if (telegraphMs > 0) {
      entry.telegraphTimer = this.time.delayedCall(telegraphMs, activate);
    } else {
      activate();
    }

    return zone;
  }

  // Гасит все телеграф-зоны боссов: отменяет отложенные таймеры и уничтожает
  // круги. Вызывается при смерти босса и на SHUTDOWN (SPEC §7).
  clearDamageZones() {
    if (!this.damageZones) {
      return;
    }
    for (const entry of this.damageZones) {
      entry.telegraphTimer?.remove(false);
      entry.activeTimer?.remove(false);
      entry.zone?.destroy();
    }
    this.damageZones.length = 0;
  }

  update(time, delta) {
    this.starfield.update(delta);
    this.player.update(this.keys, delta);
    this.scoring.update();

    // SPEC §14: смерть игрока — 1.5 s пауза: строй/дайв/волны заморожены, пока
    // корабль мёртв (respawn и game-over ведёт таймер сцены, не этот цикл).
    if (!this.player.dead) {
      this.formation.update(time);
      this.diveDirector.update(time, delta);
      this.waveDirector.update(time, delta);

      if (this.keys.SPACE.isDown) {
        this.player.tryFire(time, this.playerProjectiles);
      }
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
  scene: [BootScene, TitleScene, CrawlScene, PlaygroundScene, EndScene],
};

const game = new Phaser.Game(config);
window.game = game; // debug/test handle (safe: public game, no secrets)

// SPEC §12/§9: аудиосистема живёт весь срок игры (музыка переживает смену
// сцен, клавиша M глобальна). Инициализация — после READY, когда у игры
// уже создан SoundManager.
game.events.once('ready', () => initAudio(game));

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
