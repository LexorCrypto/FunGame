// Пикирование врагов (SPEC §4): паттерны спуска по типам + дайв-дирижёр строя.

// Паттерны спуска, ключ = тип врага. Функция по прошедшему времени пике tSec
// (сек) возвращает абсолютную позицию и признак завершения спуска (→ возврат).
export const DIVE_PATTERNS = {
  // Таракан: зигзаг x(t) = x0 + 40·sin(6t), спуск vy 170 до y = 270.
  cockroach(diver, tSec) {
    const y = diver.y0 + 170 * tSec;
    return {
      x: diver.x0 + 40 * Math.sin(6 * tSec),
      y,
      done: y >= 270,
    };
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
    this.divers = []; // [{ enemy, member, x0, y0, startTime }]
  }

  update(time, delta) {
    // Убитых/деактивированных пикировщиков убрать из учёта.
    this.divers = this.divers.filter((diver) => diver.enemy.active);

    // Отрыв: не чаще, чем раз в diveInterval, и только при наличии капасити.
    // Таймер сбрасывается лишь при реальном отрыве — если на тике мест нет,
    // он продолжает копиться и сработает сразу, как место освободится.
    this.timer += delta;
    if (
      this.timer >= this.diveInterval * 1000 &&
      this.divers.length < this.maxDivers
    ) {
      if (this.startDive(time)) {
        this.timer = 0;
      }
    }

    for (const diver of this.divers) {
      if (diver.enemy.diveState === 'diving') {
        this.updateDescent(diver, time);
      } else if (diver.enemy.diveState === 'returning') {
        this.updateReturn(diver, time, delta);
      }
    }

    // Вернувшиеся в слот — из списка активных.
    this.divers = this.divers.filter((diver) => diver.enemy.diveState !== 'idle');
  }

  startDive(time) {
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
    this.divers.push({
      enemy,
      member,
      x0: enemy.x,
      y0: enemy.y,
      startTime: time,
    });
    return true;
  }

  updateDescent(diver, time) {
    const tSec = (time - diver.startTime) / 1000;
    const { x, y, done } = DIVE_PATTERNS[diver.enemy.type](diver, tSec);

    diver.enemy.setPosition(x, y);
    diver.enemy.body.reset(x, y);

    if (done) {
      diver.enemy.diveState = 'returning';
    }
  }

  updateReturn(diver, time, delta) {
    const target = this.formation.currentSlotPos(diver.member, time);
    const dx = target.x - diver.enemy.x;
    const dy = target.y - diver.enemy.y;
    const dist = Math.hypot(dx, dy);
    const step = RETURN_SPEED * (delta / 1000);

    if (dist <= step) {
      diver.enemy.setPosition(target.x, target.y);
      diver.enemy.body.reset(target.x, target.y);
      diver.enemy.diveState = 'idle';
      return;
    }

    const nx = diver.enemy.x + (dx / dist) * step;
    const ny = diver.enemy.y + (dy / dist) * step;

    diver.enemy.setPosition(nx, ny);
    diver.enemy.body.reset(nx, ny);
  }
}
