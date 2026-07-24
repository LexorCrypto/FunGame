import { explode } from '../systems/Effects.js';

// SPEC §7.1: Супер-Туалет (волна 5) — 100 HP, две фазы атак.
const PHASE_PARAMS = {
  1: { fanCount: 5, fanInterval: 2.0, flushInterval: 8.0, funnelDuration: 3.0, swayPeriod: 3.0 },
  2: { fanCount: 7, fanInterval: 1.5, flushInterval: 6.0, funnelDuration: 4.0, swayPeriod: 2.0 },
};

export class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, id = 'superToilet') {
    super(scene, 240, 60, 'bossSuperToilet-0');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = 'boss';
    this.bossId = id;
    this.body.setSize(this.width, this.height);

    // SPEC §7.1: 100 HP; SPEC §7: очки акта 1 = 1000×n.
    this.maxHp = 100;
    this.hp = 100;
    this.points = 1000;

    this.phase = 1;
    this.applyPhaseParams();

    // Таймеры/аккумуляторы в ms.
    this.swayPhase = 0; // радианы фазы sway (инкрементно, см. update)
    this.fanTimer = 0;
    this.flushTimer = 0;
    this.pauseTimer = 0;
    this.funnelRemaining = 0;
    this.funnel = null;
    this.funnelTween = null;

    const idleKey = 'bossSuperToilet-idle';

    if (scene.textures.exists('bossSuperToilet-1')) {
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key: 'bossSuperToilet-0' }, { key: 'bossSuperToilet-1' }],
          frameRate: 4,
          repeat: -1,
        });
      }

      this.play(idleKey);
    }

    // SPEC §1: HP-бар босса 120×4, центр x=240, y=24. Фаза 1 — жёлтый.
    this.hpBg = scene.add.rectangle(240, 24, 120, 4, 0x1a1c2c).setDepth(1000);
    this.hpFill = scene.add
      .rectangle(180, 24, 120, 4, 0xffd94d)
      .setOrigin(0, 0.5)
      .setDepth(1001);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.fanCount = params.fanCount;
    this.fanInterval = params.fanInterval;
    this.flushInterval = params.flushInterval;
    this.funnelDuration = params.funnelDuration;
    this.swayPeriod = params.swayPeriod;
  }

  update(time, delta) {
    if (!this.active) {
      return;
    }

    // SPEC §7.1: sway ±60 px по x. Фаза копится инкрементно, чтобы смена
    // периода (3.0→2.0 s при фазе 2) не давала скачка позиции.
    this.swayPhase += (2 * Math.PI * (delta / 1000)) / this.swayPeriod;
    const nx = 240 + 60 * Math.sin(this.swayPhase);
    this.setPosition(nx, 60);
    this.body.reset(nx, 60);

    // SPEC §7: переход во фазу 2 при HP ≤ 50%.
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }

    // SPEC §7: при смене фазы — пауза атак 1.0 s. Пауза замораживает и активный
    // смыв: воронка не тянет игрока и не расходует время, возобновляясь после.
    if (this.pauseTimer > 0) {
      this.pauseTimer -= delta;
    } else {
      this.fanTimer += delta;
      if (this.fanTimer >= this.fanInterval * 1000) {
        this.fanTimer = 0;
        this.fireFan();
      }

      this.flushTimer += delta;
      if (this.flushTimer >= this.flushInterval * 1000) {
        this.flushTimer = 0;
        this.startFlush();
      }

      if (this.funnelRemaining > 0) {
        this.funnelRemaining -= delta;

        if (this.scene.player && this.scene.player.active) {
          this.scene.player.pullToward(240, 135, 30, delta);
        }

        if (this.funnelRemaining <= 0) {
          this.removeFunnel();
        }
      }
    }
  }

  fireFan() {
    const count = this.fanCount;

    for (let i = 0; i < count; i += 1) {
      const off = count > 1 ? -30 + (60 * i) / (count - 1) : 0;
      const rad = Phaser.Math.DegToRad(90 + off);
      const p = this.scene.enemyProjectiles.get();

      if (!p) {
        continue;
      }

      // Пул enemyProjectiles общий: DiveDirector меняет текстуру/тело снарядов,
      // поэтому перед выстрелом восстанавливаем каплю (enemyDrop, тело 4×4).
      p.setTexture('enemyDrop-0');
      p.body.setSize(4, 4);
      p.effect = undefined;
      p.fire(this.x, this.y + 14, Math.cos(rad) * 90, Math.sin(rad) * 90);
    }
  }

  startFlush() {
    this.funnelRemaining = this.funnelDuration * 1000;

    if (this.funnel) {
      this.funnel.setPosition(240, 135);
      this.funnel.setAngle(0);
    } else {
      this.funnel = this.scene.add
        .circle(240, 135, 40, 0x3fa7f5, 0.25)
        .setStrokeStyle(2, 0x59d6e6, 0.8)
        .setDepth(5);
    }

    if (this.funnelTween) {
      this.funnelTween.stop();
    }

    this.funnelTween = this.scene.tweens.add({
      targets: this.funnel,
      angle: 360,
      duration: 1000,
      repeat: -1,
    });
  }

  removeFunnel() {
    if (this.funnelTween) {
      this.funnelTween.stop();
      this.funnelTween = null;
    }

    if (this.funnel) {
      this.funnel.destroy();
      this.funnel = null;
    }
  }

  takeDamage(amount = 1) {
    if (!this.active) {
      return;
    }

    this.hp -= amount;
    this.hpFill.width = Math.max(0, (120 * this.hp) / this.maxHp);

    // SPEC §10: попадание по боссу — белая вспышка спрайта 0.08 s.
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  enterPhase2() {
    this.phase = 2;
    this.applyPhaseParams();

    // SPEC §7: при смене фазы — 1.0 s пауза атак.
    this.pauseTimer = 1000;
    this.fanTimer = 0;
    this.flushTimer = 0;

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(120, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    // SPEC §10: тряска 2 px / 0.15 s при смене фазы.
    this.scene.cameras.main.shake(150, new Phaser.Math.Vector2(2 / 480, 2 / 270));

    this.hpFill.setFillStyle(0xc23b4e);
  }

  die() {
    if (!this.active) {
      return;
    }

    explode(this.scene, this.x, this.y, { count: 12, tint: 0xf4f4f4 });

    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;

    this.cleanup();

    this.scene.events.emit('boss-defeated', this);
  }

  cleanup() {
    if (this.hpBg) {
      this.hpBg.destroy();
      this.hpBg = null;
    }

    if (this.hpFill) {
      this.hpFill.destroy();
      this.hpFill = null;
    }

    this.removeFunnel();
  }

  preDestroy() {
    this.cleanup();
    super.preDestroy();
  }
}
