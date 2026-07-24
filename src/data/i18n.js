// SPEC §15: интернационализация. Все строки игры — здесь, ни одной в коде.
// Язык: localStorage["pissuarius_lang"] ∈ {"ru","en"}, дефолт "ru".
// t(key, params) подставляет плейсхолдеры {n}/{bonus} и т.п.

const LANG_KEY = 'pissuarius_lang';

const STRINGS = {
  ru: {
    title: 'PISSUARIUS',
    subtitle: 'Галактическая зачистка',
    insert_coin: 'ВСТАВЬ МОНЕТУ',
    press_start: 'НАЖМИ ПРОБЕЛ',
    play: 'ИГРАТЬ',
    wave: 'ВОЛНА {n}',
    act: 'АКТ {n}',
    boss_warning: 'ВНИМАНИЕ!',
    game_over: 'ИГРА ОКОНЧЕНА',
    victory: 'ПОБЕДА!',
    endless: 'БЕСКОНЕЧНЫЙ ЦИКЛ {n}',
    score: 'СЧЁТ',
    hiscore: 'РЕКОРД',
    wave_clear: 'ЧИСТАЯ ВОЛНА +{bonus}',
    double_shot: 'ДВОЙНОЙ ВЫСТРЕЛ',
    shield: 'ЩИТ',
    enter_initials: 'ВВЕДИ ИНИЦИАЛЫ',
    top10: 'ТОП-10',
    new_record: 'НОВЫЙ РЕКОРД!',
    language: 'ЯЗЫК',
    pause: 'ПАУЗА',
    resume: 'ПРОДОЛЖИТЬ',
    quit_to_title: 'В МЕНЮ',
    sound_on: 'ЗВУК: ВКЛ',
    sound_off: 'ЗВУК: ВЫКЛ',
    boss_super_toilet: 'СУПЕР-ТУАЛЕТ',
    boss_big_macaque: 'БОЛЬШАЯ МАКАКА',
    boss_super_poop: 'СУПЕР-КАКАХА',
    boss_roach_queen: 'КОРОЛЕВА ТАРАКАНОВ',
    boss_plumber: 'ЗЛОЙ САНТЕХНИК ПЕССИМАРИО',
    boss_golden_throne: 'ЗОЛОТОЙ ТРОН',
    crawl_pre: 'Давным-давно, в соседнем туалете…',
    crawl_1: 'Галактика ПИССУАРИУС в опасности. Из Канализационного рукава выползла армада живой сантехники: туалеты, писсуары, тараканы и ходячие какахи.',
    crawl_2: 'Их ведут ПЯТЬ ВЛАДЫК СМЫВА — от грозного СУПЕР-ТУАЛЕТА до загадочного Злого Сантехника ПЕССИМАРИО.',
    crawl_3: 'Галактический флот сдался без боя: у солдат были носы. Единственный, кто не чувствует запаха, — пилот истребителя «ПИССУАР-1». Он уже летит.',
    skip_hint: 'ПРОБЕЛ — ПРОПУСТИТЬ',
    coming_soon: 'СКОРО',
    lang_ru: 'РУССКИЙ',
    lang_en: 'АНГЛИЙСКИЙ',
    hiscore_wave: 'В{n}',
  },
  en: {
    title: 'PISSUARIUS',
    subtitle: 'Galactic cleanup',
    insert_coin: 'INSERT COIN',
    press_start: 'PRESS SPACE',
    play: 'PLAY',
    wave: 'WAVE {n}',
    act: 'ACT {n}',
    boss_warning: 'WARNING!',
    game_over: 'GAME OVER',
    victory: 'VICTORY!',
    endless: 'ENDLESS CYCLE {n}',
    score: 'SCORE',
    hiscore: 'HI-SCORE',
    wave_clear: 'PERFECT WAVE +{bonus}',
    double_shot: 'DOUBLE SHOT',
    shield: 'SHIELD',
    enter_initials: 'ENTER INITIALS',
    top10: 'TOP 10',
    new_record: 'NEW RECORD!',
    language: 'LANGUAGE',
    pause: 'PAUSE',
    resume: 'RESUME',
    quit_to_title: 'QUIT TO TITLE',
    sound_on: 'SOUND: ON',
    sound_off: 'SOUND: OFF',
    boss_super_toilet: 'SUPER TOILET',
    boss_big_macaque: 'BIG MACAQUE',
    boss_super_poop: 'SUPER POOP',
    boss_roach_queen: 'ROACH QUEEN',
    boss_plumber: 'EVIL PLUMBER PESSIMARIO',
    boss_golden_throne: 'GOLDEN THRONE',
    crawl_pre: 'Long ago, in the bathroom next door…',
    crawl_1: 'The galaxy PISSUARIUS is in danger. From the Sewer Arm crawls an armada of living plumbing: toilets, urinals, roaches and walking poops.',
    crawl_2: 'They are led by the FIVE LORDS OF THE FLUSH — from the dreaded SUPER TOILET to the mysterious Evil Plumber PESSIMARIO.',
    crawl_3: 'The galactic fleet surrendered without a fight: the soldiers had noses. The only one who cannot smell a thing is the pilot of the starfighter PISSUAR-1. He is already on his way.',
    skip_hint: 'SPACE — SKIP',
    coming_soon: 'COMING SOON',
    lang_ru: 'RUSSIAN',
    lang_en: 'ENGLISH',
    hiscore_wave: 'W{n}',
  },
};

// boss id (waves.js) → ключ i18n имени босса.
export const BOSS_NAME_KEYS = {
  superToilet: 'boss_super_toilet',
  bigMacaque: 'boss_big_macaque',
  superPoop: 'boss_super_poop',
  roachQueen: 'boss_roach_queen',
  plumber: 'boss_plumber',
  goldenThrone: 'boss_golden_throne',
};

function readStoredLang() {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ru';
  } catch {
    return 'ru';
  }
}

let currentLang = readStoredLang();

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  currentLang = lang === 'en' ? 'en' : 'ru';
  try {
    localStorage.setItem(LANG_KEY, currentLang);
  } catch {
    // localStorage недоступен (напр. в node-тестах) — язык живёт только в памяти.
  }
  return currentLang;
}

export function toggleLang() {
  return setLang(currentLang === 'ru' ? 'en' : 'ru');
}

export function t(key, params) {
  const table = STRINGS[currentLang] || STRINGS.ru;
  let s = table[key];
  if (s === undefined) {
    s = STRINGS.ru[key] ?? key;
  }
  if (params) {
    for (const name of Object.keys(params)) {
      s = s.split(`{${name}}`).join(String(params[name]));
    }
  }
  return s;
}
