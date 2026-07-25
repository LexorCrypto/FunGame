// SPEC §13: интро-заставка в духе «Звёздных войн» — жёлтый моноширинный текст
// на звёздном фоне, уходит вверх с перспективой (масштаб строки 1.0 → 0.45).
// SPEC §14: Title → Crawl → волна 1 (баннер), пропуск по SPACE/ESC/клику.
import { Starfield } from '../systems/Starfield.js';
import { t, toggleLang } from '../data/i18n.js';
import { getAudio } from '../systems/Audio.js';

const LINE_HEIGHT = 26; // SPEC §13: интерлиньяж 26 px
const WRAP_WIDTH = 360; // ширина переноса абзацев (поле 480, отступы по бокам)
const SCROLL_DURATION = 55; // SPEC §13: полная прокрутка 55 s
const START_Y = 300; // старт стопки строк ниже нижнего края поля (270)
const CRAWL_FONT = { fontFamily: 'monospace', fontSize: '14px', fontStyle: 'bold' };

export class CrawlScene extends Phaser.Scene {
  constructor() {
    super('crawl');
  }

  create() {
    this.starfield = new Starfield(this);

    this.elapsed = 0;
    this.finished = false;

    // Контейнер строк: его y двигается вверх каждый кадр — это и есть прокрутка,
    // дочерние Text расставлены внутри с шагом LINE_HEIGHT.
    this.crawlContainer = this.add.container(240, START_Y);
    this.lineTexts = [];
    this.lines = [];

    this.buildLines();
    this.renderLines();
    this.updateScrollSpeed();

    // SPEC §13: подсказка пропуска, приглушённая, мелкая, поверх строк заставки.
    this.skipHint = this.add
      .text(240, 258, t('skip_hint'), {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8a94a6',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-SPACE', () => this.finish());
    this.input.keyboard.on('keydown-ESC', () => this.finish());
    this.input.on('pointerdown', () => this.finish());
    // Переключатель языка — отдельная клавиша, не пересекается со скипом.
    this.input.keyboard.on('keydown-L', () => this.onLanguageToggle());

    // SPEC §13: music_crawl играет один раз (не зациклен, §12).
    getAudio()?.music('crawl');
  }

  // Собирает абзацы crawl_pre/1/2/3 из i18n (SPEC §15) в порядке, с пустой
  // строкой-разделителем между абзацами, перенося длинные строки по WRAP_WIDTH.
  buildLines() {
    const paragraphs = [t('crawl_pre'), t('crawl_1'), t('crawl_2'), t('crawl_3')];
    const measurer = this.add.text(0, 0, '', CRAWL_FONT).setVisible(false);

    const lines = [];
    paragraphs.forEach((paragraph, index) => {
      if (index > 0) lines.push('');
      lines.push(...this.wrapParagraph(paragraph, measurer));
    });

    measurer.destroy();
    this.lines = lines;
  }

  // Постепенно набирает слова в строку, пока ширина (по факту рендера) не
  // превысит WRAP_WIDTH — тогда переносит остаток на новую строку.
  wrapParagraph(text, measurer) {
    const words = text.split(' ');
    const wrapped = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      measurer.setText(candidate);

      if (measurer.width > WRAP_WIDTH && current) {
        wrapped.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) wrapped.push(current);
    return wrapped;
  }

  // (Пере)создаёт Text-объекты строк внутри контейнера прокрутки.
  renderLines() {
    this.crawlContainer.removeAll(true);

    this.lineTexts = this.lines.map((line, index) =>
      this.add
        .text(0, index * LINE_HEIGHT, line, { ...CRAWL_FONT, color: '#ffd94d' })
        .setOrigin(0.5, 0.5),
    );

    this.crawlContainer.add(this.lineTexts);
  }

  // Скорость подобрана так, чтобы за SCROLL_DURATION секунд стопка прошла путь
  // от START_Y (ниже экрана) до полного ухода последней строки выше y=0.
  updateScrollSpeed() {
    const totalDistance = START_Y + (this.lines.length - 1) * LINE_HEIGHT;
    this.scrollSpeed = totalDistance / SCROLL_DURATION;
  }

  // SPEC §16 п.13: смена языка перерисовывает видимые строки без перезагрузки,
  // прямо в текущей сцене, не сбрасывая прогресс прокрутки.
  onLanguageToggle() {
    toggleLang();
    this.buildLines();
    this.renderLines();
    // Число строк меняется между языками — пересчитываем скорость, иначе
    // прокрутка не пройдёт полный путь ровно за 55 s (§13).
    this.updateScrollSpeed();
    this.skipHint.setText(t('skip_hint'));
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    // SPEC §13: музыка гаснет за 0.3 s, волна 1 — сразу (кроссфейд:
    // battle стартует поверх затухающего crawl).
    getAudio()?.stopMusic(300);
    this.scene.start('playground');
  }

  update(time, delta) {
    if (this.finished) return;

    this.starfield.update(delta);

    this.elapsed += delta / 1000;
    this.crawlContainer.y = START_Y - this.scrollSpeed * this.elapsed;

    // SPEC §13: масштаб строки по её текущей мировой y — 1.0 у низа поля (270),
    // 0.45 у верха (0), линейная интерполяция, зажатая за пределами поля.
    for (const lineText of this.lineTexts) {
      const worldY = this.crawlContainer.y + lineText.y;
      const scaleFactor = Phaser.Math.Clamp(worldY / 270, 0, 1);
      lineText.setScale(0.45 + scaleFactor * 0.55);
    }

    const lastLine = this.lineTexts[this.lineTexts.length - 1];
    const lastLineWorldY = this.crawlContainer.y + lastLine.y;

    // Конец: последняя строка ушла выше поля, или истекли 55 s (что раньше).
    if (lastLineWorldY <= 0 || this.elapsed >= SCROLL_DURATION) {
      this.finish();
    }
  }
}
