import { Starfield } from '../systems/Starfield.js';
import { t } from '../data/i18n.js';
import { loadHiscores, isHiscore, addHiscore } from '../systems/Scoring.js';

// SPEC §1: пиксельная палитра (только цвета, нужные этому экрану).
const COLOR = {
  yellow: '#ffd94d',
  red: '#c23b4e',
  white: '#f4f4f4',
  muted: '#8a94a6',
};
const COLOR_HEX = {
  yellow: 0xffd94d,
  muted: 0x8a94a6,
};

const LETTER_A = 'A'.charCodeAt(0);
const BLINK_MS = 400;

// SPEC §9, §14, §16 п.8/п.15: экран «ИГРА ОКОНЧЕНА».
// Показывает финальный счёт/волну; если счёт попадает в топ-10 —
// ввод 3 инициалов (A–Z, ↑/↓ выбор буквы, ПРОБЕЛ подтверждение/переход),
// затем топ-10 с подсветкой новой записи; иначе топ-10 сразу.
// ПРОБЕЛ в состоянии "done" → возврат на титульник.
// Победа (§14 Victory) здесь НЕ обрабатывается — это делает WaveDirector.
export class EndScene extends Phaser.Scene {
  constructor() {
    super('end');
  }

  init(data) {
    this.finalScore = data?.score ?? 0;
    this.finalWave = data?.wave ?? 1;
  }

  create() {
    this.starfield = new Starfield(this);

    this.initials = ['A', 'A', 'A'];
    this.cursor = 0;
    this.newEntryIndex = -1;
    this.state = isHiscore(this.finalScore) ? 'initials' : 'done';

    this.blinkOn = true;
    this.blinkTimer = 0;
    this.texts = [];
    this.activeLetterUnderline = null;

    this.render();

    this.input.keyboard.on('keydown-UP', () => this.onArrow(1));
    this.input.keyboard.on('keydown-DOWN', () => this.onArrow(-1));
    this.input.keyboard.on('keydown-SPACE', () => this.onSpace());
  }

  update(time, delta) {
    this.starfield.update(delta);

    if (this.state !== 'initials') {
      return;
    }

    this.blinkTimer += delta;
    if (this.blinkTimer >= BLINK_MS) {
      this.blinkTimer = 0;
      this.blinkOn = !this.blinkOn;
      if (this.activeLetterUnderline) {
        this.activeLetterUnderline.setVisible(this.blinkOn);
      }
    }
  }

  onArrow(dir) {
    if (this.state !== 'initials') {
      return;
    }
    const code = this.initials[this.cursor].charCodeAt(0) - LETTER_A;
    const next = (code + dir + 26) % 26;
    this.initials[this.cursor] = String.fromCharCode(LETTER_A + next);
    this.render();
  }

  onSpace() {
    if (this.state === 'done') {
      this.scene.start('title');
      return;
    }
    if (this.state !== 'initials') {
      return;
    }

    if (this.cursor < 2) {
      this.cursor += 1;
      this.render();
      return;
    }

    // Третья буква подтверждена: записываем рекорд и показываем топ-10.
    const name = this.initials.join('');
    const top = addHiscore(name, this.finalScore, this.finalWave);
    this.newEntryIndex = top.findIndex(
      (entry) =>
        entry.name === name &&
        entry.score === this.finalScore &&
        entry.wave === this.finalWave,
    );
    this.state = 'done';
    this.render();
  }

  render() {
    for (const obj of this.texts) {
      obj.destroy();
    }
    this.texts = [];
    this.activeLetterUnderline = null;

    this.addText(240, 12, t('game_over'), {
      fontSize: '20px',
      color: COLOR.red,
      fontStyle: 'bold',
    });
    this.addText(240, 40, `${t('score')} ${this.finalScore}`, {
      fontSize: '11px',
      color: COLOR.white,
    });
    this.addText(240, 54, t('wave', { n: this.finalWave }), {
      fontSize: '9px',
      color: COLOR.muted,
    });

    if (this.state === 'initials') {
      this.renderInitialsState();
    } else {
      this.renderDoneState();
    }
  }

  renderInitialsState() {
    this.addText(240, 72, t('new_record'), {
      fontSize: '11px',
      color: COLOR.yellow,
      fontStyle: 'bold',
    });
    this.addText(240, 86, t('enter_initials'), {
      fontSize: '8px',
      color: COLOR.white,
    });

    const spacing = 30;
    const y = 100;
    for (let i = 0; i < 3; i += 1) {
      const active = i === this.cursor;
      const x = 240 + (i - 1) * spacing;

      this.addText(x, y, this.initials[i], {
        fontSize: '18px',
        color: active ? COLOR.yellow : COLOR.white,
        fontStyle: 'bold',
      });

      const underline = this.add.rectangle(
        x,
        y + 22,
        16,
        2,
        active ? COLOR_HEX.yellow : COLOR_HEX.muted,
      );
      this.texts.push(underline);
      if (active) {
        underline.setVisible(this.blinkOn);
        this.activeLetterUnderline = underline;
      }
    }
  }

  renderDoneState() {
    this.addText(240, 70, t('top10'), {
      fontSize: '11px',
      color: COLOR.yellow,
      fontStyle: 'bold',
    });

    const list = loadHiscores();
    list.forEach((entry, index) => {
      const isNew = index === this.newEntryIndex;
      const row = `${index + 1}. ${entry.name} ${entry.score} ${t('hiscore_wave', { n: entry.wave })}`;
      this.addText(240, 86 + index * 12, row, {
        fontSize: '8px',
        color: isNew ? COLOR.yellow : COLOR.white,
      });
    });

    this.addText(240, 86 + list.length * 12 + 10, t('press_start'), {
      fontSize: '8px',
      color: COLOR.muted,
    });
  }

  addText(x, y, str, style) {
    const obj = this.add
      .text(x, y, str, { fontFamily: 'monospace', ...style })
      .setOrigin(0.5, 0);
    this.texts.push(obj);
    return obj;
  }
}
