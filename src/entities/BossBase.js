import { explode } from '../systems/Effects.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §7: общая механика всех боссов.
// - HP-бар 120×4 по центру (240,24) (SPEC §1); фаза 1 — жёлтый, фаза 2 — красный.
// - Переход во фазу 2 при HP ≤ 50% (SPEC §7): вспышка + тряска 2 px / 0.15 s +
//   1.0 s пауза атак.
// - Попадание: белая вспышка спрайта 0.08 s (SPEC §10).
// - Смерть: взрыв (SPEC §10) + эмит 'boss-defeated' (владелец жизненного цикла —
//   WaveDirector).
// Конкретный босс наследуется и реализует:
//   onUpdate(time, delta)  — движение (всегда) + атаки (гейт по attacksPaused);
//   onEnterPhase2()        — переключение параметров/поведения фазы 2;
//   onCleanup()            — освобождение своих ресурсов (снаряды, зоны, отродья).
export class BossBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, { id, texture, x = 240, y = 60, maxHp, points }) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = 'boss';
    this.bossId = id;
    this.body.setSize(this.width, this.height);

    this.maxHp = maxHp;
    this.hp = maxHp;
    this.points = points;

    this.phase = 1;
    this.pauseTimer = 0; // ms; >0 — атаки заморожены (смена фазы, §7)

    // Idle-анимация из двух кадров, если второй кадр текстуры существует.
    const base = texture.replace(/-0$/, '');
    const idleKey = `${base}-idle`;
    const frame1 = `${base}-1`;
    if (scene.textures.exists(frame1)) {
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key: texture }, { key: frame1 }],
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

    // Снимается в preDestroy: иначе ранняя гибель босса оставляет слушатель
    // сцены, удерживающий экземпляр (codex-аудит M4, [P3]).
    this.shutdownHandler = () => this.cleanup();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
  }

  // Вызывается WaveDirector каждый кадр. Проверяет переход фазы, делегирует
  // движение/атаки боссу, затем расходует таймер паузы. attacksPaused читается
  // в onUpdate ДО декремента — атаки не идут в кадр входа в паузу и весь её срок.
  update(time, delta) {
    if (!this.active) {
      return;
    }

    // SPEC §7: переход во фазу 2 при HP ≤ 50%.
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.enterPhase2();
    }

    this.onUpdate(time, delta);

    if (this.pauseTimer > 0) {
      this.pauseTimer -= delta;
    }
  }

  // SPEC §7: атаки заморожены во время 1.0 s паузы смены фазы.
  get attacksPaused() {
    return this.pauseTimer > 0;
  }

  flash(ms = 80) {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(ms, () => {
      if (this.active) {
        this.clearTint();
      }
    });
  }

  takeDamage(amount = 1) {
    if (!this.active) {
      return;
    }

    this.hp -= amount;
    this.hpFill.width = Math.max(0, (120 * this.hp) / this.maxHp);

    // SPEC §10: попадание по боссу — белая вспышка спрайта 0.08 s.
    this.flash(80);
    getAudio()?.sfx('boss_hit'); // SPEC §12: хит босса

    if (this.hp <= 0) {
      this.die();
    }
  }

  enterPhase2() {
    this.phase = 2;

    // SPEC §7: при смене фазы — 1.0 s пауза атак.
    this.pauseTimer = 1000;

    getAudio()?.sfx('phase'); // SPEC §12: смена фазы (alarm riser)

    // SPEC §10: вспышка + тряска 2 px / 0.15 s при смене фазы.
    this.flash(120);
    this.scene.cameras.main.shake(150, new Phaser.Math.Vector2(2 / 480, 2 / 270));
    this.hpFill.setFillStyle(0xc23b4e);

    this.onEnterPhase2();
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
    this.onCleanup();
  }

  preDestroy() {
    this.scene?.events?.off(Phaser.Scenes.Events.SHUTDOWN, this.shutdownHandler);
    this.cleanup();
    super.preDestroy();
  }

  // Хуки для подклассов (по умолчанию — пусто).
  onUpdate() {}

  onEnterPhase2() {}

  onCleanup() {}
}
