import { Starfield } from '../systems/Starfield.js';
import { t, getLang, toggleLang } from '../data/i18n.js';
import { loadHiscores } from '../systems/Scoring.js';
import { getAudio } from '../systems/Audio.js';

// SPEC §14: Boot → Title. Титульник: название, промпт старта, топ-10,
// переключатель языка. Title → Crawl — fade 0.5 s (§14, строка «Title → Crawl»).
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    this.starfield = new Starfield(this);
    this.transitioning = false;
    this.hiscoreRows = [];

    const centerX = this.scale.width / 2;

    // Заголовок и подзаголовок (§15: ключи title/subtitle).
    this.titleText = this.add
      .text(centerX, 14, t('title'), {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffd94d',
      })
      .setOrigin(0.5, 0);

    this.subtitleText = this.add
      .text(centerX, 0, t('subtitle'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8a94a6',
      })
      .setOrigin(0.5, 0);

    // Заголовок топ-10 (§15: ключ top10).
    this.top10Header = this.add
      .text(centerX, 0, t('top10'), {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f5893d',
      })
      .setOrigin(0.5, 0);

    this.hiscoreRowHeight = 8;
    this.layoutHeader();
    this.renderHiscores();

    // Мигающий промпт старта (§15: ключ press_start).
    this.promptText = this.add
      .text(centerX, 205, t('press_start'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#f4f4f4',
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: this.promptText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // SPEC §14: титульник показывает «ВСТАВЬ МОНЕТУ» (аркадный промпт).
    this.insertCoinText = this.add
      .text(centerX, 190, t('insert_coin'), {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffd94d',
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: this.insertCoinText,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Строка выбора языка (§14/§15: ключ language, переключение ◄►/L).
    this.languageText = this.add
      .text(centerX, 250, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8a94a6',
      })
      .setOrigin(0.5, 0);
    this.updateLanguageText();

    // SPEC §12: индикатор звука (клавишу M слушает AudioSystem глобально;
    // тут — только отображение sound_on/sound_off из i18n §15).
    this.soundText = this.add
      .text(centerX, 261, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8a94a6',
      })
      .setOrigin(0.5, 0);
    this.updateSoundText();

    this.muteHandler = () => this.updateSoundText();
    this.game.events.on('mute-changed', this.muteHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('mute-changed', this.muteHandler);
    });

    this.input.keyboard.on('keydown-SPACE', this.startGame, this);
    this.input.keyboard.on('keydown-L', this.handleToggleLang, this);
    this.input.keyboard.on('keydown-LEFT', this.handleToggleLang, this);
    this.input.keyboard.on('keydown-RIGHT', this.handleToggleLang, this);

    // SPEC §12: музыка титульника (зациклена). До первого жеста WebAudio
    // заперт — AudioSystem доиграет трек по событию unlocked.
    getAudio()?.music('title');
  }

  update(time, delta) {
    this.starfield.update(delta);
  }

  // Шапка укладывается от фактической высоты глифов, а не по фиксированным y:
  // у заголовка кегль 24 px, и его нижние выносные элементы заходили на
  // подзаголовок, прибитый к y=34 (скриншот владельца 2026-07-26). Кегли RU и EN
  // одинаковы, но метрики моноширинного шрифта зависят от браузера — считаем по
  // факту и пересчитываем после смены языка.
  layoutHeader() {
    this.subtitleText.y = Math.round(this.titleText.y + this.titleText.height + 2);
    this.top10Header.y = Math.round(this.subtitleText.y + this.subtitleText.height + 4);
    this.hiscoresTop = Math.round(this.top10Header.y + this.top10Header.height + 2);
  }

  // Перерисовывает топ-10 (§9: [{name, score, wave}], сортировка по убыванию,
  // не более 10 записей). Пустой список — просто заголовок без строк.
  renderHiscores() {
    for (const row of this.hiscoreRows) {
      row.destroy();
    }
    this.hiscoreRows = [];

    const list = loadHiscores().slice(0, 10);
    const centerX = this.scale.width / 2;

    list.forEach((entry, index) => {
      const row = this.add
        .text(
          centerX,
          this.hiscoresTop + index * this.hiscoreRowHeight,
          this.formatHiscoreRow(entry, index + 1),
          {
            fontFamily: 'monospace',
            fontSize: '8px',
            color: '#f4f4f4',
          },
        )
        .setOrigin(0.5, 0);

      this.hiscoreRows.push(row);
    });
  }

  formatHiscoreRow(entry, rank) {
    const name = String(entry.name ?? '---')
      .toUpperCase()
      .padEnd(3, ' ')
      .slice(0, 3);
    const score = String(Math.max(0, Math.floor(entry.score ?? 0))).padStart(6, '0');
    const wave = Math.max(0, Math.floor(entry.wave ?? 0));

    return `${String(rank).padStart(2, ' ')}. ${name}  ${score}  ${t('hiscore_wave', { n: wave })}`;
  }

  updateLanguageText() {
    const label = getLang() === 'ru' ? t('lang_ru') : t('lang_en');
    this.languageText.setText(`\u25c4 ${t('language')}: ${label} \u25ba`);
  }

  // SPEC §12/§15: строка «ЗВУК: ВКЛ/ВЫКЛ» + подсказка клавиши M.
  updateSoundText() {
    const muted = getAudio()?.muted ?? false;
    this.soundText.setText(`M — ${t(muted ? 'sound_off' : 'sound_on')}`);
  }

  // SPEC §16 п.13: переключение языка меняет надписи без перезагрузки.
  handleToggleLang() {
    if (this.transitioning) {
      return;
    }

    toggleLang();

    this.titleText.setText(t('title'));
    this.subtitleText.setText(t('subtitle'));
    this.top10Header.setText(t('top10'));
    this.promptText.setText(t('press_start'));
    this.insertCoinText.setText(t('insert_coin'));
    this.updateLanguageText();
    this.updateSoundText();
    this.layoutHeader();
    this.renderHiscores();
  }

  // SPEC §14: Title → Crawl, fade 0.5 s.
  startGame() {
    if (this.transitioning) {
      return;
    }

    this.transitioning = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('crawl');
    });
  }
}
