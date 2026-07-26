// SPEC §12, §9: аудиосистема — SFX на игровые события, музыка сцен/волн, мьют.
// Живёт ВЕСЬ срок игры (один экземпляр на Phaser.Game, не на сцену): музыка
// переживает смену сцен, клавиша M слушается одним window-обработчиком.
// Все play() тихо no-op'ятся, если файла нет в аудио-кэше (до FUN-22 файлы
// assets/audio/ могут отсутствовать — игра обязана работать беззвучно).

const MUTE_KEY = 'pissuarius_mute';

// SPEC §12: громкости (WebAudio gain) — музыка 0.5, SFX 0.8.
const MUSIC_VOLUME = 0.5;
const SFX_VOLUME = 0.8;

// SPEC §12, таблица SFX: имя события → ключ аудио-кэша (= имя файла без .mp3).
//
// В списке 16 из 19 записей таблицы: `sfx_shoot_triple`, `sfx_powerup_score` и
// `sfx_shield_double` (§8, уровни пауэр-апов) НЕ подключены — их mp3 ещё нет.
// ElevenLabs 2026-07-26 отдаёт 401 payment_issue (подписка past_due), а ключ в
// этом списке означает предзагрузку в BootScene, то есть 404 в консоли и
// нарушение §16. Промпты и длительности лежат в SPEC §12 и в MANIFEST
// `scripts/generate_audio.mjs`; вызовы `sfx()` для этих трёх событий уже стоят
// в коде и тихо no-op'ятся (решение владельца 2026-07-26). После оплаты:
// сгенерировать три файла, вернуть ключи в список — правок в игре не нужно.
export const SFX_KEYS = [
  'sfx_shoot',
  'sfx_hit',
  'sfx_enemy_explode',
  'sfx_player_death',
  'sfx_flush',
  'sfx_stream',
  'sfx_splat',
  'sfx_dryer',
  'sfx_plunger',
  'sfx_wrench',
  'sfx_powerup',
  'sfx_shield',
  'sfx_wave_clear',
  'sfx_roach_spawn',
  'sfx_boss_hit',
  'sfx_phase',
];

// SPEC §12, таблица музыки: зациклены только title/battle/boss;
// crawl (§13: «играет один раз»), victory и gameover — одноразовые.
export const MUSIC_TRACKS = {
  title: { loop: true },
  battle: { loop: true },
  boss: { loop: true },
  crawl: { loop: false },
  victory: { loop: false },
  gameover: { loop: false },
};

// Список файлов для предзагрузки (BootScene.preload, коммитится вместе с
// файлами FUN-22: до появления mp3 в репо загрузку не включаем, чтобы не
// сыпать 404 в консоль — SPEC §16 требует чистую консоль).
export const AUDIO_FILES = [
  ...SFX_KEYS,
  ...Object.keys(MUSIC_TRACKS).map((t) => `music_${t}`),
].map((key) => ({ key, path: `assets/audio/${key}.mp3` }));

export class AudioSystem {
  constructor(game) {
    this.game = game;
    this.sound = game.sound;

    this.currentTrack = null; // имя трека ('battle'), не ключ кэша
    this.currentSound = null;
    this.pendingMusic = null; // { track, next } — ждёт разблокировки WebAudio

    // SPEC §9: мьют переживает перезагрузку — localStorage["pissuarius_mute"].
    this.muted = false;
    try {
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      // localStorage недоступен (напр. в node-тестах) — мьют только в памяти.
    }
    this.sound.mute = this.muted;

    // Автоплей-политика браузера: WebAudio заперт до первого жеста.
    // Музыку, запрошенную до разблокировки, доигрываем по событию unlocked.
    this.sound.once('unlocked', () => {
      const pending = this.pendingMusic;
      if (pending) {
        this.pendingMusic = null;
        this.currentTrack = null;
        this.music(pending.track, { next: pending.next });
      }
    });

    // SPEC §12: мьют по клавише M — глобально, в любой сцене. Один
    // window-слушатель на игру; EndScene букв не читает (только ↑/↓/Пробел),
    // конфликтов нет. Снимается при уничтожении игры.
    if (typeof window !== 'undefined') {
      this.keyHandler = (event) => {
        if (event.code === 'KeyM' && !event.repeat) {
          this.toggleMute();
        }
      };
      window.addEventListener('keydown', this.keyHandler);
      game.events.once('destroy', () => {
        window.removeEventListener('keydown', this.keyHandler);
      });
    }
  }

  // SFX по короткому имени события ('shoot' → 'sfx_shoot'). Нет файла — тишина.
  // Громкость — через add-config (как у музыки). Примечание для верификации:
  // геттер volume/gain у WebAudioSound читает AudioParam, который применяет
  // setValueAtTime только на границе тика аудио-потока — синхронное чтение
  // сразу после play() показывает старое значение (реальный gain корректен).
  sfx(name) {
    const key = `sfx_${name}`;
    if (!this.game.cache.audio.exists(key)) {
      return;
    }
    const soundObj = this.sound.add(key, { volume: SFX_VOLUME });
    soundObj.once('complete', () => soundObj.destroy());
    soundObj.play();
  }

  // Переключает музыку на трек §12. Повторный вызов с текущим треком — no-op
  // (battle не рестартует между волнами). Для одноразовых треков opts.next
  // задаёт трек-продолжение (victory → battle). Если файла трека нет —
  // сразу переходим к next (или тишина).
  music(track, { next } = {}) {
    if (!(track in MUSIC_TRACKS)) {
      return;
    }
    if (this.currentTrack === track && (this.currentSound || this.pendingMusic)) {
      return;
    }

    this.stopMusic();
    this.currentTrack = track;

    if (this.sound.locked) {
      this.pendingMusic = { track, next };
      return;
    }

    const key = `music_${track}`;
    if (!this.game.cache.audio.exists(key)) {
      if (next) {
        this.currentTrack = null;
        this.music(next);
      }
      return;
    }

    const { loop } = MUSIC_TRACKS[track];
    const soundObj = this.sound.add(key, { loop, volume: MUSIC_VOLUME });
    this.currentSound = soundObj;
    if (!loop) {
      soundObj.once('complete', () => {
        if (this.currentSound !== soundObj) {
          return; // трек уже сменили — цепочку не продолжаем
        }
        this.currentSound = null;
        this.currentTrack = null;
        soundObj.destroy();
        if (next) {
          this.music(next);
        }
      });
    }
    soundObj.play();
  }

  // Останавливает музыку; fadeMs > 0 — линейное затухание (§13: скип
  // заставки гасит музыку за 0.3 s, а волна 1 стартует СРАЗУ — т.е. новый
  // трек начинается поверх затухающего: кроссфейд). Поэтому фейд
  // самодостаточен: интервал сам владеет звуком, доводит затухание до конца
  // и уничтожает звук; последующие music()/stopMusic() его не трогают.
  // Без Phaser-твинов: у AudioSystem нет сцены, поэтому шаги — setInterval.
  stopMusic(fadeMs = 0) {
    this.pendingMusic = null;
    this.currentTrack = null;

    const soundObj = this.currentSound;
    this.currentSound = null;
    if (!soundObj) {
      return;
    }

    if (fadeMs <= 0 || !soundObj.isPlaying) {
      soundObj.stop();
      soundObj.destroy();
      return;
    }

    const stepMs = 30;
    const steps = Math.max(1, Math.round(fadeMs / stepMs));
    const stepDown = soundObj.volume / steps;
    const timer = setInterval(() => {
      try {
        const nextVolume = soundObj.volume - stepDown;
        if (nextVolume <= 0) {
          clearInterval(timer);
          soundObj.stop();
          soundObj.destroy();
          return;
        }
        soundObj.setVolume(nextVolume);
      } catch {
        // Звук уничтожен извне (напр. destroy игры) — фейд завершён.
        clearInterval(timer);
      }
    }, stepMs);
  }

  // SPEC §12/§9: мьют — общий gain 0 + флаг в localStorage. Событие
  // 'mute-changed' на game.events — для индикатора «ЗВУК: ВКЛ/ВЫКЛ» (i18n).
  toggleMute() {
    this.muted = !this.muted;
    this.sound.mute = this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      // localStorage недоступен — мьют живёт только в текущей сессии.
    }
    this.game.events.emit('mute-changed', this.muted);
  }
}

// Единственный экземпляр на игру: initAudio(game) — в main.js после
// new Phaser.Game; getAudio() — из любого места (null до инициализации,
// вызывающие используют getAudio()?.sfx(...) — безопасно в node-тестах).
let audioSystem = null;

export function initAudio(game) {
  if (!audioSystem) {
    audioSystem = new AudioSystem(game);
    // Синглтон привязан к КОНКРЕТНОЙ игре: без сброса повторный initAudio()
    // после game.destroy() вернул бы систему уничтоженной игры (и удерживал бы
    // её граф объектов) — codex-аудиты 0037612/74cbd67, [P3].
    game.events.once('destroy', () => {
      audioSystem = null;
    });
  }
  return audioSystem;
}

export function getAudio() {
  return audioSystem;
}
