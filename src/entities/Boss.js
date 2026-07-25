import { BossBase } from './BossBase.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §7.1: Супер-Туалет (волна 5) — 100 HP, две фазы атак.
const PHASE_PARAMS = {
  1: { fanCount: 5, fanInterval: 2.0, flushInterval: 8.0, funnelDuration: 3.0, swayPeriod: 3.0 },
  2: { fanCount: 7, fanInterval: 1.5, flushInterval: 6.0, funnelDuration: 4.0, swayPeriod: 2.0 },
};

export class Boss extends BossBase {
  constructor(scene, id = 'superToilet') {
    // SPEC §7.1: y=60; SPEC §7: очки акта 1 = 1000×1.
    super(scene, { id, texture: 'bossSuperToilet-0', x: 240, y: 60, maxHp: 100, points: 1000 });

    // Фаза sway копится инкрементно, чтобы смена периода (3.0→2.0 s при фазе 2)
    // не давала скачка позиции.
    this.swayPhase = 0;
    this.fanTimer = 0;
    this.flushTimer = 0;
    this.funnelRemaining = 0;
    this.funnel = null;
    this.funnelTween = null;

    this.applyPhaseParams();
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.fanCount = params.fanCount;
    this.fanInterval = params.fanInterval;
    this.flushInterval = params.flushInterval;
    this.funnelDuration = params.funnelDuration;
    this.swayPeriod = params.swayPeriod;
  }

  onUpdate(time, delta) {
    // SPEC §7.1: sway ±60 px по x, y=60.
    this.swayPhase += (2 * Math.PI * (delta / 1000)) / this.swayPeriod;
    const nx = 240 + 60 * Math.sin(this.swayPhase);
    this.setPosition(nx, 60);
    this.body.reset(nx, 60);

    // SPEC §7: пауза смены фазы замораживает и активный смыв (воронка не тянет
    // игрока и не расходует время, возобновляясь после).
    if (this.attacksPaused) {
      return;
    }

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
    getAudio()?.sfx('flush'); // SPEC §12: смыв (воронка Супер-Туалета)

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

  onEnterPhase2() {
    this.applyPhaseParams();
    this.fanTimer = 0;
    this.flushTimer = 0;
  }

  onCleanup() {
    this.removeFunnel();
  }
}
