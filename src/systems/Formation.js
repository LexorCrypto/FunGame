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

  slotCenter(col, row) {
    return {
      x: this.originX + (col * this.cellW) + (this.cellW / 2),
      y: this.originY + (row * this.cellH) + (this.cellH / 2),
    };
  }

  update(tMs) {
    const swayOffset = 20 * Math.sin((2 * Math.PI * (tMs / 1000)) / this.swayPeriod);

    for (const member of this.members) {
      const { x, y } = this.slotCenter(member.col, member.row);

      member.sprite.x = x + swayOffset;
      member.sprite.y = y;
    }
  }
}
