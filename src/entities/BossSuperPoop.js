import { BossBase } from './BossBase.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §7: игровое поле 480×270 (main.js config) — используется для расчёта
// границ роста волны-лужи (outer edge движется к 0/480).
const FIELD_WIDTH = 480;

// SPEC §7.3: Супер-Какаха (волна 15) — 220 HP, две фазы плюха.
const PHASE_PARAMS = {
  1: { plopInterval: 6.0, gapWidth: 70, radialSplash: false },
  2: { plopInterval: 4.0, gapWidth: 50, radialSplash: true },
};

export class BossSuperPoop extends BossBase {
  constructor(scene, id = 'superPoop') {
    // SPEC §7.3: y=50; очки акта 3 = 1000×3.
    super(scene, { id, texture: 'bossSuperPoop-0', x: 240, y: 50, maxHp: 220, points: 3000 });

    // SPEC §7.3: период sway фиксирован (не меняется по фазе, в отличие от
    // Супер-Туалета). Фаза копится инкрементно, чтобы пауза во время
    // последовательности плюха не давала скачка позиции при возврате к sway.
    this.swayPeriod = 3.5;
    this.swayPhase = 0;

    this.plopTimer = 0;

    // Последовательность «плюха»: idle → telegraph → falling → returning → idle.
    // Движение шагов последовательности НЕ гейтится attacksPaused (см. onUpdate) —
    // гейтится только СТАРТ новой последовательности.
    this.sequenceState = 'idle';
    this.seqTimer = 0;
    this.sequenceX = this.x; // x, зафиксированный на момент старта плюха

    // Активные волны-лужи (SPEC §7.3): { rect, innerX, dir, width, maxWidth,
    // lingering, lingerTimer }. dir=-1 — растёт влево к 0, dir=+1 — вправо к 480.
    this.waves = [];

    this.applyPhaseParams(this.phase);
  }

  applyPhaseParams(phase) {
    const params = PHASE_PARAMS[phase];
    this.plopInterval = params.plopInterval;
    this.gapWidth = params.gapWidth;
    this.radialSplash = params.radialSplash;
  }

  onUpdate(time, delta) {
    // Движение: sway в простое, либо шаг активной последовательности плюха.
    // Оба варианта выполняются независимо от attacksPaused — это движение, не атака.
    if (this.sequenceState === 'idle') {
      // SPEC §7.3: sway ±40 px по x, период 3.5 s.
      this.swayPhase += (2 * Math.PI * (delta / 1000)) / this.swayPeriod;
      const nx = 240 + 40 * Math.sin(this.swayPhase);
      this.sequenceX = nx;
      this.setPosition(nx, 50);
      this.body.reset(nx, 50);
    } else {
      this.stepSequence(delta);
    }

    // Уже запущенные волны-лужи растут каждый кадр независимо от паузы атак.
    this.updateWaves(delta);

    // Гейт атак (SPEC §7): во время паузы смены фазы не начинаем новый плюх.
    if (this.attacksPaused) {
      return;
    }

    // SPEC §7.3: «каждые 6.0 s» — период старт-к-старту, поэтому таймер копится
    // и во время самой последовательности (issue #1, решение владельца
    // 2026-07-26: вариант A). Раньше он тикал только в простое, и период
    // разъезжался на длину последовательности — 9.3 s вместо 6.0 s в фазе 1 и
    // 7.3 s вместо 4.0 s в фазе 2.
    //
    // Запуск при этом всё равно возможен только из простоя: плюх поверх
    // активного плюха оборвал бы шаг на полпути. Тот же шаблон у Макаки (§7.2) —
    // таймер копится и в прыжке, а выстрел уходит по возврату в hover.
    // Порог оба интервала (6.0 / 4.0 s) переходят уже после конца
    // последовательности (3.3 s), так что сброс в 0 даёт ровно период SPEC.
    this.plopTimer += delta;
    if (this.plopTimer >= this.plopInterval * 1000 && this.sequenceState === 'idle') {
      this.plopTimer = 0;
      this.startPlop();
    }
  }

  startPlop() {
    this.sequenceState = 'telegraph';
    this.seqTimer = 0;
  }

  // Продвигает текущий шаг последовательности плюха на delta мс.
  stepSequence(delta) {
    this.seqTimer += delta;

    if (this.sequenceState === 'telegraph') {
      const TELEGRAPH_MS = 1000; // SPEC §7.3: телеграф 1.0 s (дрожание).
      const jx = this.sequenceX + Phaser.Math.Between(-2, 2);
      const jy = 50 + Phaser.Math.Between(-2, 2);
      this.setPosition(jx, jy);
      this.body.reset(jx, jy);

      if (this.seqTimer >= TELEGRAPH_MS) {
        this.sequenceState = 'falling';
        this.seqTimer = 0;
      }
      return;
    }

    if (this.sequenceState === 'falling') {
      const FALL_MS = 300; // SPEC/задание: падение быстрое, ~0.3 s.
      const t = Math.min(1, this.seqTimer / FALL_MS);
      const ny = Phaser.Math.Linear(50, 200, t);
      this.setPosition(this.sequenceX, ny);
      this.body.reset(this.sequenceX, ny);

      if (this.seqTimer >= FALL_MS) {
        this.setPosition(this.sequenceX, 200);
        this.body.reset(this.sequenceX, 200);
        this.onImpact();
        this.sequenceState = 'returning';
        this.seqTimer = 0;
      }
      return;
    }

    // returning
    const RETURN_MS = 2000; // SPEC §7.3: возврат наверх 2.0 s.
    const t = Math.min(1, this.seqTimer / RETURN_MS);
    const ny = Phaser.Math.Linear(200, 50, t);
    this.setPosition(this.sequenceX, ny);
    this.body.reset(this.sequenceX, ny);

    if (this.seqTimer >= RETURN_MS) {
      this.sequenceState = 'idle';
      this.seqTimer = 0;
    }
  }

  // Момент удара о дно (SPEC §7.3): волна-лужа с разрывом случайной ширины
  // gapWidth в случайном месте [60,420]; в фазе 2 — ещё и радиальный разбрызг.
  onImpact() {
    getAudio()?.sfx('splat'); // SPEC §12: плюх — удар Супер-Какахи о дно
    const gapCenter = Phaser.Math.Between(60, 420);
    const half = this.gapWidth / 2;

    this.spawnWave(gapCenter - half, -1);
    this.spawnWave(gapCenter + half, 1);

    if (this.radialSplash) {
      this.fireRadialSplash(this.x, 200);
    }
  }

  // Заводит одну сторону волны-лужи: внутренний край (innerX) зафиксирован у
  // разрыва, внешний растёт со скоростью 100 px/s к границе поля (dir=-1 → 0,
  // dir=+1 → 480).
  spawnWave(innerX, dir) {
    const rect = this.scene.add.rectangle(innerX, 250, 0, 12, 0x6b4a2a).setDepth(5);
    this.scene.physics.add.existing(rect);
    rect.body.setAllowGravity(false);
    rect.body.immovable = true;
    this.scene.hazards.add(rect);

    const maxWidth = Math.max(0, dir === -1 ? innerX : FIELD_WIDTH - innerX);

    this.waves.push({ rect, innerX, dir, width: 0, maxWidth, lingering: false, lingerTimer: 0 });
  }

  // Растит активные волны на 100 px/s; по достижении границы поля лужа ещё
  // ~0.3 s «висит» на границе, затем самоуничтожается.
  updateWaves(delta) {
    for (let i = this.waves.length - 1; i >= 0; i -= 1) {
      const wave = this.waves[i];

      if (!wave.lingering) {
        wave.width = Math.min(wave.maxWidth, wave.width + (100 * delta) / 1000);
        const centerX = wave.dir === -1 ? wave.innerX - wave.width / 2 : wave.innerX + wave.width / 2;

        wave.rect.setSize(wave.width, 12);
        wave.rect.setPosition(centerX, 250);
        wave.rect.body.setSize(wave.width, 12);
        wave.rect.body.reset(centerX, 250);

        if (wave.width >= wave.maxWidth) {
          wave.lingering = true;
          wave.lingerTimer = 0;
        }
      } else {
        wave.lingerTimer += delta;

        if (wave.lingerTimer >= 300) {
          wave.rect.destroy();
          this.waves.splice(i, 1);
        }
      }
    }
  }

  // SPEC §7.3 фаза 2: при ударе — радиальный разбрызг из 6 капель, 90 px/s,
  // из точки удара (x босса, y=200). Пул enemyProjectiles общий — восстанавливаем
  // текстуру/тело капли перед выстрелом (см. Boss.js fireFan).
  fireRadialSplash(x, y) {
    const COUNT = 6;

    for (let i = 0; i < COUNT; i += 1) {
      const angle = (2 * Math.PI * i) / COUNT;
      const p = this.scene.enemyProjectiles.get();

      if (!p) {
        continue;
      }

      p.setTexture('enemyDrop-0');
      p.body.setSize(4, 4);
      p.effect = undefined;
      p.fire(x, y, Math.cos(angle) * 90, Math.sin(angle) * 90);
    }
  }

  onEnterPhase2() {
    this.applyPhaseParams(this.phase);
    this.plopTimer = 0;
  }

  onCleanup() {
    for (const wave of this.waves) {
      wave.rect.destroy();
    }
    this.waves = [];
  }
}
