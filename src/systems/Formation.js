export class Formation {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.originX = opts.originX ?? 120;
    this.originY = opts.originY ?? 40;
    this.cols = opts.cols ?? 10;
    this.rows = opts.rows ?? 4;
    this.cellW = opts.cellW ?? 24;
    this.cellH = opts.cellH ?? 18;
    this.swayPeriod = opts.swayPeriod ?? 4.0;
    this.members = [];
  }

  addMember(sprite, col, row) {
    const member = { sprite, col, row };
    const { x, y } = this.slotCenter(col, row);

    sprite.x = x;
    sprite.y = y;
    this.members.push(member);
  }

  removeMember(member) {
    const index = this.members.findIndex(
      (candidate) => candidate === member || candidate.sprite === member,
    );

    if (index === -1) {
      return false;
    }

    this.members.splice(index, 1);
    return true;
  }

  slotCenter(col, row) {
    return {
      x: this.originX + (col * this.cellW) + (this.cellW / 2),
      y: this.originY + (row * this.cellH) + (this.cellH / 2),
    };
  }

  swayOffset(tMs) {
    return 20 * Math.sin((2 * Math.PI * (tMs / 1000)) / this.swayPeriod);
  }

  currentSlotPos(member, tMs) {
    const { x, y } = this.slotCenter(member.col, member.row);
    return { x: x + this.swayOffset(tMs), y };
  }

  update(tMs) {
    for (const member of this.members) {
      // Пикирующих/возвращающихся позиционирует дайв-дирижёр, не строй.
      if (member.sprite.diveState && member.sprite.diveState !== 'idle') {
        continue;
      }

      const { x, y } = this.currentSlotPos(member, tMs);
      member.sprite.x = x;
      member.sprite.y = y;
      member.sprite.body?.reset(x, y);
    }
  }

  freeAdjacentSlot(member) {
    const neighbors = [
      { col: member.col - 1, row: member.row },
      { col: member.col + 1, row: member.row },
      { col: member.col, row: member.row - 1 },
      { col: member.col, row: member.row + 1 },
    ];
    for (const n of neighbors) {
      if (n.col < 0 || n.col >= this.cols || n.row < 0 || n.row >= this.rows) continue;
      const taken = this.members.some((m) => m.col === n.col && m.row === n.row);
      if (!taken) return n;
    }
    return null;
  }
}
