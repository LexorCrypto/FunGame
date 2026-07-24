// Пикирование врагов (SPEC §4): паттерны спуска по типам + дайв-дирижёр строя.

// Переставить врагу позицию и синхронизировать физическое тело (arcade body).
function place(enemy, x, y) {
  enemy.setPosition(x, y);
  enemy.body.reset(x, y);
}

// Паттерны спуска, ключ = тип врага. Каждый паттерн — { start(diver, ctx),
// step(diver, ctx) }. `diver` = { enemy, member, startTime, ...своё состояние }.
// step() возвращает 'dive' (продолжить спуск), 'return' (вернуться в слот)
// или 'consume' (враг поглощён паттерном, например Какаха после лужи).
export const DIVE_PATTERNS = {
  // Таракан: зигзаг x(t) = x0 + 40·sin(6t), спуск vy 170 до y = 270.
  cockroach: {
    start(diver) {
      diver.x0 = diver.enemy.x;
      diver.y0 = diver.enemy.y;
    },
    step(diver, ctx) {
      const x = diver.x0 + 40 * Math.sin(6 * ctx.tSec);
      const y = diver.y0 + 170 * ctx.tSec;
      place(diver.enemy, x, y);
      return y >= 270 ? 'return' : 'dive';
    },
  },

  // Писсуар: по диагонали к стартовой позиции игрока (150 px/s), один
  // прицельный поток мочи ('urinalStream-0') при y≈140, затем возврат.
  urinal: {
    start(diver, ctx) {
      diver.x0 = diver.enemy.x;
      diver.y0 = diver.enemy.y;
      const dx = ctx.player.x - diver.x0;
      const dy = ctx.player.y - diver.y0;
      const len = Math.hypot(dx, dy) || 1;
      diver.vx = dx / len;
      diver.vy = dy / len;
      diver.fired = false;
    },
    step(diver, ctx) {
      const s = 150 * (ctx.delta / 1000);
      const x = diver.enemy.x + diver.vx * s;
      const y = diver.enemy.y + diver.vy * s;
      place(diver.enemy, x, y);

      if (!diver.fired && y >= 140) {
        diver.fired = true;
        ctx.fireAimed(x, y, 110, 'urinalStream-0');
        return 'return';
      }
      if (y >= 270) {
        if (!diver.fired) {
          diver.fired = true;
          ctx.fireAimed(x, y, 110, 'urinalStream-0');
        }
        return 'return';
      }
      return 'dive';
    },
  },

  // Какаха: прямое падение vy 130; на y=250 роняет лужу и исчезает.
  poop: {
    start(diver) {
      diver.x0 = diver.enemy.x;
    },
    step(diver, ctx) {
      const y = diver.enemy.y + 130 * (ctx.delta / 1000);
      place(diver.enemy, diver.x0, y);

      if (y >= 250) {
        ctx.spawnPuddle(diver.x0, 255);
        return 'consume';
      }
      return 'dive';
    },
  },

  // Туалет: медленный спуск vy 55 с доводкой по x к игроку, веер из 3
  // капель каждые 1.2с; возврат при y=200.
  toilet: {
    start(diver) {
      diver.fireTimer = 0;
    },
    step(diver, ctx) {
      const dt = ctx.delta / 1000;
      const y = diver.enemy.y + 55 * dt;
      const dx = ctx.player.x - diver.enemy.x;
      const xstep = Phaser.Math.Clamp(dx, -55 * dt, 55 * dt);
      const x = diver.enemy.x + xstep;
      place(diver.enemy, x, y);

      diver.fireTimer += ctx.delta;
      if (diver.fireTimer >= 1200) {
        diver.fireTimer -= 1200;
        ctx.fireFan(x, y, 3, 80, 25, 'enemyDrop-0');
      }

      return y >= 200 ? 'return' : 'dive';
    },
  },
};

const RETURN_SPEED = 220; // px/s — возврат в слот

// Дайв-дирижёр: каждые diveInterval сек отрывает случайного врага из строя,
// если активных пикировщиков < maxDivers. После спуска враг возвращается в
// свой слот (RETURN_SPEED); при возврате неуязвим и не дамажит (см. main.js).
export class DiveDirector {
  constructor(scene, formation, { diveInterval = 3.0, maxDivers = 1 } = {}) {
    this.scene = scene;
    this.formation = formation;
    this.diveInterval = diveInterval;
    this.maxDivers = maxDivers;
    this.timer = 0;
    this.divers = []; // [{ enemy, member, startTime, ... }]
  }

  update(time, delta) {
    // Убитых/деактивированных пикировщиков убрать из учёта.
    this.divers = this.divers.filter((diver) => diver.enemy.active);

    const ctx = this.makeCtx(time, delta);

    // Отрыв: не чаще, чем раз в diveInterval, и только при наличии капасити.
    // Таймер сбрасывается лишь при реальном отрыве — если на тике мест нет,
    // он продолжает копиться и сработает сразу, как место освободится.
    this.timer += delta;
    if (
      this.timer >= this.diveInterval * 1000 &&
      this.divers.length < this.maxDivers
    ) {
      if (this.startDive(time, ctx)) {
        this.timer = 0;
      }
    }

    for (const diver of this.divers) {
      if (diver.enemy.diveState === 'diving') {
        ctx.tSec = (time - diver.startTime) / 1000;
        const next = DIVE_PATTERNS[diver.enemy.type].step(diver, ctx);

        if (next === 'return') {
          diver.enemy.diveState = 'returning';
        } else if (next === 'consume') {
          this.consume(diver);
        }
      } else if (diver.enemy.diveState === 'returning') {
        this.updateReturn(diver, time, delta);
      }
    }

    // Вернувшиеся в слот (или поглощённые) — из списка активных.
    this.divers = this.divers.filter(
      (diver) => diver.enemy.active && diver.enemy.diveState !== 'idle',
    );
  }

  makeCtx(time, delta) {
    return {
      time,
      delta,
      tSec: 0,
      player: this.scene.player,
      fireAimed: (x, y, speed, texture) => this.fireAimed(x, y, speed, texture),
      fireFan: (x, y, count, speed, spreadDeg, texture) =>
        this.fireFan(x, y, count, speed, spreadDeg, texture),
      spawnPuddle: (x, y) => this.scene.spawnPuddle(x, y),
    };
  }

  startDive(time, ctx) {
    const candidates = this.formation.members.filter(
      (member) =>
        member.sprite.active &&
        member.sprite.diveState === 'idle' &&
        DIVE_PATTERNS[member.sprite.type],
    );

    if (candidates.length === 0) {
      return false;
    }

    const member = Phaser.Utils.Array.GetRandom(candidates);
    const enemy = member.sprite;

    enemy.diveState = 'diving';
    const diver = { enemy, member, startTime: time };
    DIVE_PATTERNS[enemy.type].start(diver, ctx);
    this.divers.push(diver);
    return true;
  }

  updateReturn(diver, time, delta) {
    const target = this.formation.currentSlotPos(diver.member, time);
    const dx = target.x - diver.enemy.x;
    const dy = target.y - diver.enemy.y;
    const dist = Math.hypot(dx, dy);
    const step = RETURN_SPEED * (delta / 1000);

    if (dist <= step) {
      place(diver.enemy, target.x, target.y);
      diver.enemy.diveState = 'idle';
      return;
    }

    const nx = diver.enemy.x + (dx / dist) * step;
    const ny = diver.enemy.y + (dy / dist) * step;
    place(diver.enemy, nx, ny);
  }

  consume(diver) {
    const enemy = diver.enemy;
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.body.enable = false;
    this.scene.events.emit('enemy-died', enemy);
  }

  fireProjectile(x, y, vx, vy, texture) {
    const projectile = this.scene.enemyProjectiles.get();
    if (!projectile) return;

    projectile.setTexture(texture);
    projectile.body.setSize(4, 4);
    projectile.fire(x, y, vx, vy);
  }

  fireAimed(x, y, speed, texture) {
    const dx = this.scene.player.x - x;
    const dy = this.scene.player.y - y;
    const len = Math.hypot(dx, dy) || 1;
    this.fireProjectile(x, y, (dx / len) * speed, (dy / len) * speed, texture);
  }

  fireFan(x, y, count, speed, spreadDeg, texture) {
    const base = 90; // прямо вниз
    for (let i = 0; i < count; i += 1) {
      const off = count > 1 ? -spreadDeg + (2 * spreadDeg * i) / (count - 1) : 0;
      const rad = Phaser.Math.DegToRad(base + off);
      this.fireProjectile(
        x,
        y,
        Math.cos(rad) * speed,
        Math.sin(rad) * speed,
        texture,
      );
    }
  }
}
