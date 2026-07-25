import { BossBase } from './BossBase.js';
import { Enemy } from './Enemy.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §7 (боссы): игровое поле 480×270 — используется для расчёта границ
// роста волны-лужи «плюха» (см. BossSuperPoop.js).
const FIELD_WIDTH = 480;

// SPEC §7.6: парит y=55, sway ±50 по x вокруг 240, период 2.5 s.
const BASE_Y = 55;
const SWAY_AMPLITUDE = 50;
const SWAY_PERIOD = 2.5;

// Ровно 5 окон ротации, СТРОГО в порядке SPEC §7.6 / тикет FUN-25: веер
// капель → дуговые снаряды → плюх с волной → призыв тараканов → ключ-бумеранг.
const ATTACK_FAN = 0;
const ATTACK_ARC = 1;
const ATTACK_PLOP = 2;
const ATTACK_BROOD = 3;
const ATTACK_WRENCH = 4;
const ATTACK_COUNT = 5;

// SPEC §7.6: окно атаки 10.0 s в фазе 1, смена каждые 6.0 s в фазе 2, без
// паузы; фаза 2 множит ВСЕ скорости снарядов/волн/падений на 1.3 (тикет
// FUN-25). Состав ротации и кадансы внутри окна не меняются между фазами.
const PHASE_PARAMS = {
  1: { windowDuration: 10.0, speedMul: 1 },
  2: { windowDuration: 6.0, speedMul: 1.3 },
};

// Атака 1 «веер капель» — тот же паттерн, что Boss.fireFan (5 снарядов
// enemyDrop-0 веером вниз ±30° от вертикали). Кадансы «каждые N s окна» в
// тикете FUN-25 НЕ помечены ×speedMul — масштабируется только скорость снаряда.
const FAN_CADENCE = 2.0;
const FAN_COUNT = 5;
const FAN_SPEED = 90;

// Атака 2 «дуговые снаряды» — тот же паттерн, что BossBigMacaque.fireBurst:
// прицельные снаряды с разбросом BURST_SPREAD_DEG, гравитация выставляется
// ПОСЛЕ p.fire(), т.к. Projectile.fire() каждый раз сбрасывает физику пула.
// Отдельной текстуры дуговых снарядов Трона в тикете не задано — переиспользуем
// enemyDrop-0 (4×4), как это делает BossSuperPoop.fireRadialSplash для своей
// фазы-2 атаки.
const ARC_CADENCE = 3.0;
const ARC_COUNT = 3;
const ARC_SPEED = 150;
const ARC_SPREAD_DEG = 8;
const ARC_GRAVITY_Y = 400;

// Атака 3 «плюх с волной» — последовательность как у BossSuperPoop.
// stepSequence/onImpact/spawnWave/updateWaves. Тикет FUN-25 помечает ×speedMul
// только у скорости падения и у роста волны; телеграф и возврат наверх — фиксированные
// длительности, не масштабируются.
const PLOP_TELEGRAPH_MS = 1000;
const PLOP_FALL_MS_BASE = 300; // тикет: «×speedMul быстрее: 300/speedMul ms»
const PLOP_RETURN_MS = 2000;
const PLOP_FLOOR_Y = 200;
const PLOP_GAP_WIDTH = 70;
const PLOP_WAVE_SPEED = 100; // px/s, до speedMul
const PLOP_WAVE_HEIGHT = 12;
const PLOP_WAVE_Y = 250;
const PLOP_LINGER_MS = 300; // BossSuperPoop: волна «висит» на границе поля перед сносом

// Атака 4 «призыв 2 тараканов» — тот же паттерн, что BossRoachQueen.spawnBrood/
// updateBrood. Кадансы (спавн в начале окна + повторно) фиксированы, не
// масштабируются ×speedMul (тикет FUN-25 не помечает эту атаку скоростью).
const BROOD_CADENCE = 5.0;
const BROOD_COUNT = 2;
const BROOD_CAP = 6;

// Атака 5 «ключ-бумеранг» — тот же паттерн, что BossPlumber.throwWrench/
// updateWrench: один ключ одновременно, ручной лерп по фиксированной
// длительности на отрезок (0.9/speedMul s — тикет FUN-25).
const WRENCH_CADENCE = 4.0;
const WRENCH_FLIGHT_MS_BASE = 900;

// Свечение (SPEC §7.6: «золотой, свечение (тинт-анимация)») — точный алгоритм
// не задан; выбрана пульсация тинтом между двумя золотыми оттенками каждые
// ~400 ms (пример из тикета FUN-25) через scene.time.addEvent — без аллокаций
// на кадр (событие срабатывает раз в 400 ms, а не каждый tick). Не гейтится
// attacksPaused/окном: это визуальный эффект, не атака.
const GLOW_INTERVAL_MS = 400;
const GLOW_COLOR_BRIGHT = 0xffffff;
const GLOW_COLOR_GOLD = 0xffe08a;

export class BossGoldenThrone extends BossBase {
  constructor(scene, id = 'goldenThrone') {
    // SPEC §7.6: y=55, 500 HP; SPEC §7 / тикет FUN-25: очки бесконечного
    // цикла = 10000.
    super(scene, { id, texture: 'bossGoldenThrone-0', x: 240, y: BASE_Y, maxHp: 500, points: 10000 });

    // Sway копится инкрементно (как BossSuperPoop.swayPhase), чтобы плюх/пауза
    // не давали скачка позиции при возврате к покачиванию.
    this.swayPhase = 0;
    this.sequenceX = this.x; // x, «замороженный» на время плюха

    // Ротация: ровно 5 окон, смена без паузы (см. onUpdate). windowTimer
    // копится всегда; при смене окна кадансы атак сбрасываются (resetCadence).
    this.attackIndex = ATTACK_FAN;
    this.windowTimer = 0;
    this.applyPhaseParams();

    this.fanTimer = 0;
    this.arcTimer = 0;
    this.broodTimer = 0;
    this.wrenchTimer = 0;
    this.plopFiredThisWindow = false;

    // Плюх-последовательность (BossSuperPoop): idle → telegraph → falling →
    // returning → idle. Шаги идут независимо от attacksPaused/окна — это уже
    // начатое движение, не старт атаки (тикет FUN-25).
    this.sequenceState = 'idle';
    this.seqTimer = 0;
    this.seqProgress = 0; // инкрементный прогресс шагов падения/возврата (×speedMul)
    this.waves = []; // { rect, innerX, dir, width, maxWidth, lingering, lingerTimer }

    // Отродья (BossRoachQueen): { enemy, x0, y0, t }. Спуск идёт всегда, даже
    // в чужом окне/во время паузы фазы (тикет FUN-25 — в отличие от
    // BossRoachQueen, где спуск замораживается паузой).
    this.brood = [];

    // Ключ-бумеранг (BossPlumber): не более одного одновременно. Полёт идёт
    // всегда, даже в чужом окне/паузе (тикет FUN-25 — в отличие от
    // BossPlumber, где полёт замораживается паузой).
    this.wrench = null;

    this.resetCadence();

    // Свечение: непрерывная тинт-пульсация до самой смерти босса (см. комментарий
    // у GLOW_* выше); таймер отменяется в onCleanup().
    this.glowOn = false;
    this.setTint(GLOW_COLOR_GOLD);
    this.glowEvent = scene.time.addEvent({
      delay: GLOW_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!this.active) {
          return;
        }
        this.glowOn = !this.glowOn;
        this.setTint(this.glowOn ? GLOW_COLOR_BRIGHT : GLOW_COLOR_GOLD);
      },
    });
  }

  applyPhaseParams() {
    const params = PHASE_PARAMS[this.phase];
    this.windowDuration = params.windowDuration;
    this.speedMul = params.speedMul;
  }

  // BossBase.flash() снимает тинт через clearTint() — под непрерывным огнём
  // это гасило бы золотое свечение до следующего тика глоу (§7.6 требует
  // непрерывную тинт-анимацию). Восстанавливаем текущий оттенок после вспышки.
  flash(ms = 80) {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(ms, () => {
      if (this.active) {
        this.setTint(this.glowOn ? GLOW_COLOR_BRIGHT : GLOW_COLOR_GOLD);
      }
    });
  }

  onUpdate(time, delta) {
    // Движение: sway в простое, либо шаг активной последовательности плюха
    // заменяет его — как у BossSuperPoop. НЕ гейтится attacksPaused (тикет
    // FUN-25: движение, а не атака). Скорость sway ×speedMul (§7.6 фаза 2:
    // «все скорости ×1.3») — фаза копится инкрементно, смена фазы без скачка.
    if (this.sequenceState === 'idle') {
      this.swayPhase += ((2 * Math.PI * (delta / 1000)) / SWAY_PERIOD) * this.speedMul;
      const nx = 240 + SWAY_AMPLITUDE * Math.sin(this.swayPhase);
      this.sequenceX = nx;
      this.setPosition(nx, BASE_Y);
      this.body.reset(nx, BASE_Y);
    } else {
      this.stepPlop(delta);
    }

    // Тикет FUN-25: волны-лужи, спуск отродий и полёт ключа доигрываются
    // ВСЕГДА (даже в чужом окне ротации или во время 1.0 s паузы смены фазы) —
    // это уже начатое движение, не старт новой атаки.
    this.updateWaves(delta);
    this.updateBrood(delta);
    this.updateWrench(delta);

    // Таймер окна копится всегда; при смене окна сбрасываем кадансовые
    // таймеры атак (тикет FUN-25). Смена без паузы — SPEC §7.6.
    this.windowTimer += delta;
    if (this.windowTimer >= this.windowDuration * 1000) {
      this.windowTimer = 0;
      this.attackIndex = (this.attackIndex + 1) % ATTACK_COUNT;
      this.resetCadence();
    }

    // SPEC §7: старт новых атак заморожен во время 1.0 s паузы смены фазы.
    if (this.attacksPaused) {
      return;
    }

    this.driveActiveAttack(delta);
  }

  // Сбрасывает кадансовые таймеры атак при смене окна (тикет FUN-25). Плюх и
  // отродья стартуют СРАЗУ в начале окна: плюх — через флаг
  // plopFiredThisWindow, отродья — заводя broodTimer «уже готовым», чтобы
  // первый призыв случился на следующем кадре, а не через полный BROOD_CADENCE.
  resetCadence() {
    this.fanTimer = 0;
    this.arcTimer = 0;
    this.wrenchTimer = 0;
    this.broodTimer = BROOD_CADENCE * 1000;
    this.plopFiredThisWindow = false;
  }

  // Стартует атаку активного окна по её кадансу. Вызывается только если
  // !attacksPaused (SPEC §7 / тикет FUN-25: старт атаки гейтится паузой).
  driveActiveAttack(delta) {
    switch (this.attackIndex) {
      case ATTACK_FAN:
        this.fanTimer += delta;
        if (this.fanTimer >= FAN_CADENCE * 1000) {
          this.fanTimer = 0;
          this.fireFan();
        }
        break;
      case ATTACK_ARC:
        this.arcTimer += delta;
        if (this.arcTimer >= ARC_CADENCE * 1000) {
          this.arcTimer = 0;
          this.fireArc();
        }
        break;
      case ATTACK_PLOP:
        // Один плюх на окно: старт в начале окна, если предыдущая
        // последовательность уже отыграла до конца.
        if (this.sequenceState === 'idle' && !this.plopFiredThisWindow) {
          this.plopFiredThisWindow = true;
          this.startPlop();
        }
        break;
      case ATTACK_BROOD:
        this.broodTimer += delta;
        if (this.broodTimer >= BROOD_CADENCE * 1000) {
          this.broodTimer = 0;
          this.spawnBrood();
        }
        break;
      case ATTACK_WRENCH:
        this.wrenchTimer += delta;
        if (!this.wrench && this.wrenchTimer >= WRENCH_CADENCE * 1000) {
          this.wrenchTimer = 0;
          this.throwWrench();
        }
        break;
      default:
        break;
    }
  }

  // Атака 1 (SPEC §7.6): веер капель — Boss.fireFan один в один.
  fireFan() {
    const speed = FAN_SPEED * this.speedMul;

    for (let i = 0; i < FAN_COUNT; i += 1) {
      const off = -30 + (60 * i) / (FAN_COUNT - 1);
      const rad = Phaser.Math.DegToRad(90 + off);
      const p = this.scene.enemyProjectiles.get();

      if (!p) {
        continue;
      }

      // Пул enemyProjectiles общий — восстанавливаем каплю (см. Boss.fireFan).
      p.setTexture('enemyDrop-0');
      p.body.setSize(4, 4);
      p.effect = undefined;
      p.fire(this.x, this.y + 14, Math.cos(rad) * speed, Math.sin(rad) * speed);
    }
  }

  // Атака 2 (SPEC §7.6): дуговые снаряды — BossBigMacaque.fireBurst один в один.
  fireArc() {
    const player = this.scene.player;
    if (!player || !player.active) {
      return;
    }

    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const speed = ARC_SPEED * this.speedMul;

    for (let i = 0; i < ARC_COUNT; i += 1) {
      const offsetDeg = -ARC_SPREAD_DEG + (2 * ARC_SPREAD_DEG * i) / (ARC_COUNT - 1);
      const angle = baseAngle + Phaser.Math.DegToRad(offsetDeg);
      const p = this.scene.enemyProjectiles.get();

      if (!p) {
        continue;
      }

      p.setTexture('enemyDrop-0');
      p.body.setSize(4, 4);
      p.effect = undefined;
      p.fire(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed);
      // Гравитация — ПОСЛЕ fire(), т.к. Projectile.fire() каждый раз обнуляет
      // gravity/acceleration общего пула (см. BossBigMacaque.fireBurst).
      p.body.setGravityY(ARC_GRAVITY_Y);
    }
  }

  // Атака 3 (SPEC §7.6) старт: BossSuperPoop.startPlop один в один.
  startPlop() {
    this.sequenceState = 'telegraph';
    this.seqTimer = 0;
  }

  // Продвигает шаг последовательности плюха. Падение и возврат — «скорости»
  // (§7.6 фаза 2: ×1.3): прогресс копится инкрементно delta/длительность, так
  // смена фазы посреди шага не даёт скачка позиции. Телеграф 1.0 s НЕ
  // масштабируется намеренно: это окно честности перед ударом (§7-паттерн
  // телеграфов), а не скорость движения.
  stepPlop(delta) {
    if (this.sequenceState === 'telegraph') {
      this.seqTimer += delta;
      const jx = this.sequenceX + Phaser.Math.Between(-2, 2);
      const jy = BASE_Y + Phaser.Math.Between(-2, 2);
      this.setPosition(jx, jy);
      this.body.reset(jx, jy);

      if (this.seqTimer >= PLOP_TELEGRAPH_MS) {
        this.sequenceState = 'falling';
        this.seqProgress = 0;
      }
      return;
    }

    if (this.sequenceState === 'falling') {
      // Тикет FUN-25: падение до y=200 за 0.3 s, ×speedMul быстрее в фазе 2.
      this.seqProgress += delta / (PLOP_FALL_MS_BASE / this.speedMul);
      const t = Math.min(1, this.seqProgress);
      const ny = Phaser.Math.Linear(BASE_Y, PLOP_FLOOR_Y, t);
      this.setPosition(this.sequenceX, ny);
      this.body.reset(this.sequenceX, ny);

      if (t >= 1) {
        this.onImpact();
        this.sequenceState = 'returning';
        this.seqProgress = 0;
      }
      return;
    }

    // returning — тоже движение босса: 2.0 s / speedMul (§7.6 «все скорости»).
    this.seqProgress += delta / (PLOP_RETURN_MS / this.speedMul);
    const t = Math.min(1, this.seqProgress);
    const ny = Phaser.Math.Linear(PLOP_FLOOR_Y, BASE_Y, t);
    this.setPosition(this.sequenceX, ny);
    this.body.reset(this.sequenceX, ny);

    if (t >= 1) {
      this.sequenceState = 'idle';
      this.seqTimer = 0;
    }
  }

  // Момент удара о дно (тикет FUN-25): sfx('splat') + волна-лужа с разрывом
  // шириной 70 в случайном месте [60,420] — BossSuperPoop.onImpact.
  onImpact() {
    getAudio()?.sfx('splat'); // SPEC §12: плюх — удар о дно
    const gapCenter = Phaser.Math.Between(60, 420);
    const half = PLOP_GAP_WIDTH / 2;

    this.spawnWave(gapCenter - half, -1);
    this.spawnWave(gapCenter + half, 1);
  }

  // Заводит одну сторону волны-лужи (BossSuperPoop.spawnWave): внутренний
  // край innerX зафиксирован у разрыва, внешний растёт к границе поля.
  // Урон игроку при оверлапе — общий обработчик player↔hazards (main.js).
  spawnWave(innerX, dir) {
    const rect = this.scene.add.rectangle(innerX, PLOP_WAVE_Y, 0, PLOP_WAVE_HEIGHT, 0x6b4a2a).setDepth(5);
    this.scene.physics.add.existing(rect);
    rect.body.setAllowGravity(false);
    rect.body.immovable = true;
    this.scene.hazards.add(rect);

    const maxWidth = Math.max(0, dir === -1 ? innerX : FIELD_WIDTH - innerX);

    this.waves.push({ rect, innerX, dir, width: 0, maxWidth, lingering: false, lingerTimer: 0 });
  }

  // Растит активные волны (BossSuperPoop.updateWaves), скорость 100×speedMul
  // px/s (тикет FUN-25); по достижении границы поля волна ещё PLOP_LINGER_MS
  // «висит», затем самоуничтожается. Не гейтится attacksPaused/окном — уже
  // начатое движение (тикет FUN-25).
  updateWaves(delta) {
    const growth = (PLOP_WAVE_SPEED * this.speedMul * delta) / 1000;

    for (let i = this.waves.length - 1; i >= 0; i -= 1) {
      const wave = this.waves[i];

      if (!wave.lingering) {
        wave.width = Math.min(wave.maxWidth, wave.width + growth);
        const centerX = wave.dir === -1 ? wave.innerX - wave.width / 2 : wave.innerX + wave.width / 2;

        wave.rect.setSize(wave.width, PLOP_WAVE_HEIGHT);
        wave.rect.setPosition(centerX, PLOP_WAVE_Y);
        wave.rect.body.setSize(wave.width, PLOP_WAVE_HEIGHT);
        wave.rect.body.reset(centerX, PLOP_WAVE_Y);

        if (wave.width >= wave.maxWidth) {
          wave.lingering = true;
          wave.lingerTimer = 0;
        }
      } else {
        wave.lingerTimer += delta;

        if (wave.lingerTimer >= PLOP_LINGER_MS) {
          wave.rect.destroy();
          this.waves.splice(i, 1);
        }
      }
    }
  }

  // Атака 4 (SPEC §7.6): призыв 2 тараканов — BossRoachQueen.spawnBrood,
  // без брони (тикет FUN-25 задаёт только hp 1, потолок 6 живых отродий).
  spawnBrood() {
    this.brood = this.brood.filter((b) => b.enemy.active);
    const before = this.brood.length;

    for (let i = 0; i < BROOD_COUNT && this.brood.length < BROOD_CAP; i += 1) {
      const e = new Enemy(this.scene, 'cockroach', { hp: 1 });
      e.points = 50; // тикет FUN-25: 50 очков за отродье (см. BossRoachQueen)

      // Разносим отродья одного помёта по x — иначе одинаковый зигзаг держит
      // их стопкой (см. BossRoachQueen.spawnBrood).
      const spawnX = Phaser.Math.Clamp(this.x + (i - (BROOD_COUNT - 1) / 2) * 14, 12, 468);
      const spawnY = this.y + 8;

      this.scene.enemies.add(e);
      e.setPosition(spawnX, spawnY);
      e.body.reset(spawnX, spawnY);
      e.diveState = 'diving';

      this.brood.push({ enemy: e, x0: spawnX, y0: spawnY, t: 0, dist: 0 });
    }

    if (this.brood.length > before) {
      getAudio()?.sfx('roach_spawn'); // SPEC §12: спавн тараканов
    }
  }

  // Зигзаг-пикирование отродий (BossRoachQueen.updateBrood): x(t) = x0 + 40·sin(6t),
  // спуск 170×speedMul px/s до y=270 (§7.6 фаза 2: «все скорости ×1.3»).
  // Дистанция копится инкрементно — смена фазы посреди спуска не даёт скачка y.
  // Спуск идёт ВСЕГДА (тикет FUN-25 — в отличие от BossRoachQueen, где этот
  // шаг замораживается паузой смены фазы).
  updateBrood(delta) {
    for (let i = this.brood.length - 1; i >= 0; i -= 1) {
      const b = this.brood[i];
      const e = b.enemy;

      if (!e.active) {
        // Убит игроком — takeDamage()→die() уже отыграли взрыв и событие.
        this.brood.splice(i, 1);
        continue;
      }

      b.t += (delta / 1000) * this.speedMul; // зигзаг тоже скорость (§7.6 ×1.3)
      b.dist += (170 * this.speedMul * delta) / 1000;
      const x = b.x0 + 40 * Math.sin(6 * b.t);
      const y = b.y0 + b.dist;

      if (y >= 270) {
        // Ушёл за нижнюю границу поля — тихо снять, без взрыва.
        e.setActive(false);
        e.setVisible(false);
        e.body.enable = false;
        this.brood.splice(i, 1);
        continue;
      }

      e.setPosition(x, y);
      e.body.reset(x, y);
    }
  }

  // Атака 5 (SPEC §7.6) старт: BossPlumber.throwWrench один в один.
  throwWrench() {
    const p = this.scene.enemyProjectiles.get();
    if (!p) {
      return;
    }

    // Пул enemyProjectiles общий — восстанавливаем текстуру/тело ключа
    // (SPEC §11: 8×8). Скорость не используется — снаряд ведём вручную.
    p.setTexture('wrench-0');
    p.body.setSize(8, 8);
    p.effect = undefined;
    p.fire(this.x, this.y, 0, 0);
    getAudio()?.sfx('wrench'); // SPEC §12: бросок гаечного ключа

    const player = this.scene.player;
    const targetX = player && player.active ? player.x : this.x;
    const targetY = player && player.active ? player.y : this.y;

    this.wrench = {
      sprite: p,
      phase: 'out',
      progress: 0,
      startX: this.x,
      startY: this.y,
      targetX,
      targetY,
      farX: targetX,
      farY: targetY,
    };
  }

  // Ведёт полёт ключа (BossPlumber.updateWrench): туда — к позиции игрока на
  // момент броска, обратно — к ТЕКУЩЕЙ позиции босса; тикет FUN-25: каждый
  // отрезок 0.9/speedMul s. Полёт продолжается ВСЕГДА, даже в чужом окне или
  // во время паузы смены фазы (тикет FUN-25 — в отличие от BossPlumber, где
  // updateWrench целиком заморожен attacksPaused).
  updateWrench(delta) {
    if (!this.wrench) {
      return;
    }

    // Прогресс копится инкрементно delta/длительность отрезка — смена фазы
    // (legMs 900 → 900/1.3) посреди полёта не даёт скачка позиции ключа.
    const w = this.wrench;
    const legMs = WRENCH_FLIGHT_MS_BASE / this.speedMul;
    w.progress += delta / legMs;
    const t = Math.min(1, w.progress);

    if (w.phase === 'out') {
      const x = Phaser.Math.Linear(w.startX, w.targetX, t);
      const y = Phaser.Math.Linear(w.startY, w.targetY, t);
      w.sprite.setPosition(x, y);
      w.sprite.body.reset(x, y);

      if (t >= 1) {
        w.phase = 'back';
        w.progress = 0;
        w.farX = x;
        w.farY = y;
      }
      return;
    }

    const x = Phaser.Math.Linear(w.farX, this.x, t);
    const y = Phaser.Math.Linear(w.farY, this.y, t);
    w.sprite.setPosition(x, y);
    w.sprite.body.reset(x, y);

    if (t >= 1) {
      w.sprite.deactivate();
      this.wrench = null;
    }
  }

  onEnterPhase2() {
    this.applyPhaseParams();
    // Как и у остальных боссов (Boss/BossBigMacaque/BossRoachQueen/BossPlumber/
    // BossSuperPoop) — кадансы атак сбрасываются при входе во фазу 2; окно
    // ротации и уже начатые последовательности НЕ прерываются.
    this.resetCadence();
  }

  onCleanup() {
    if (this.glowEvent) {
      this.glowEvent.remove();
      this.glowEvent = null;
    }
    if (this.wrench) {
      this.wrench.sprite.deactivate();
      this.wrench = null;
    }
    for (const wave of this.waves) {
      wave.rect.destroy();
    }
    this.waves = [];
    for (const b of this.brood) {
      b.enemy.destroy();
    }
    this.brood = [];
  }
}
