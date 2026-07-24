// Pixel schemes from docs/SPEC.md §11: literal schemes verbatim; row-deltas
// applied by the row numbers printed in §11 (1-based).
// NOTE: for the five boss deltas the printed row numbers sit one row above
// the rows their own labels name (eyes/legs/water-glint/gem/mouth). Applied
// literally here; reported to the spec owner as a suspected §11 defect.
// bossPlumber frame B is an interpretation of the prose delta («рука с
// ключом опущена: ключ в строках 8–12») — §11 contains no literal scheme.
export const PALETTE = {
  '.': null,
  K: '#1a1c2c',
  W: '#f4f4f4',
  S: '#8a94a6',
  G: '#5a6572',
  B: '#3fa7f5',
  D: '#27406b',
  P: '#59d6e6',
  Y: '#ffd94d',
  O: '#f5893d',
  R: '#c23b4e',
  N: '#7a4a2b',
  n: '#a9703f',
  E: '#6fdc63',
  F: '#b45fd9',
};

export const SPRITES = {
  ship: [
    [
      '.......KK.......', '......KWWK......', '......KPPK......', '.....KWWWWK.....',
      '....KWWBWWK.....', '....KWWBWWK.....', '...KWWWBBWWWK...', '..KWWKWWWWKWWK..',
      '..KWKKWWWWKKWK..', '.KWKSSSSSSSSKWK.', '.KWKSSSSSSSSKWK.', '.KKSSSKSSSKSSKK.',
      '....KSSSSSSK....', '.....KYYYYK.....', '......YOOY......', '.......OO.......',
    ],
    [
      '.......KK.......', '......KWWK......', '......KPPK......', '.....KWWWWK.....',
      '....KWWBWWK.....', '....KWWBWWK.....', '...KWWWBBWWWK...', '..KWWKWWWWKWWK..',
      '..KWKKWWWWKKWK..', '.KWKSSSSSSSSKWK.', '.KWKSSSSSSSSKWK.', '.KKSSSKSSSKSSKK.',
      '....KSSSSSSK....', '......YYYY......', '......YOOY......', '................',
    ],
  ],
  cockroach: [
    [
      '...K........K...', '....K......K....', '.....KNNNNK.....', '...KKNNNNNNKK...',
      '..KNNNNNNNNNNK..', '.KNNNnnnnNNNNNK.', 'K.NNNNNNNNNNNN.K', 'K.KNNNNNNNNNNK.K',
      '.K.KNNNNNNNNK.K.', '.K..KNNNNNNK..K.', 'K....KNNNNK....K', '......KNNNNK....',
      '......KNNNNK....', '.......KNNK.....',
    ],
    [
      '...K........K...', '....K......K....', '.....KNNNNK.....', '...KKNNNNNNKK...',
      'K.NNNnnnnNNNNN.K', '.KNNNNNNNNNNNNK.', 'K.KNNNNNNNNNNK.K', '.K.KNNNNNNNNK.K.',
      'K..KNNNNNNK...K.', '.K..KNNNNNNK..K.', 'K....KNNNNK....K', '......KNNNNK....',
      '......KNNNNK....', '.......KNNK.....',
    ],
  ],
  urinal: [
    [
      '..KKKKKKKKKK..', '.KWWWWWWWWWWK.', '.KWWWKKKKWWWK.', '.KWWWKSSKWWWK.',
      '.KWWWKKKKWWWK.', '.KWWWWWWWWWWK.', '.KWWWKWWKWWWK.', '..KWWKWWKWWK..',
      '..KWWKBBKWWK..', '..KWWKBBKWWK..', '...KWKBBBKWK..', '....KWKBBKWK..',
      '.....KKKKKK...',
    ],
    [
      '..KKKKKKKKKK..', '.KWWWWWWWWWWK.', '.KWWWKKKKWWWK.', '.KWWWKSSKWWWK.',
      '.KWWWKKKKWWWK.', '.KWWWWWWWWWWK.', '.KWWWKWWKWWWK.', '..KWWKWWKWWK..',
      '..KWWKPPKWWK..', '..KWWKPPKWWK..', '...KWKPPPKWK..', '....KWKBBKWK..',
      '.....KKKKKK...',
    ],
  ],
  poop: [
    [
      '......KK........', '.....KNNK.......', '....KNNNNK......', '...KNWWNNWWNK...',
      '..KNNNNNNNNNNK..', '.KNnNNNNNNnNK...', '.KNNNNNNNNNNNNK.', 'KNNNNNNNNNNNNNNK',
      '.KKKKKKKKKKKKKK.',
    ],
    [
      '.......KK.......', '......KNNK......', '.....KNNNNK.....', '....KNWWNNWWNK..',
      '..KNNNNNNNNNNK..', '.KNnNNNNNNnNK...', '.KNNNNNNNNNNNNK.', 'KNNNNNNNNNNNNNNK',
      '.KKKKKKKKKKKKKK.',
    ],
  ],
  toilet: [
    [
      '.KKKKKKKKKK.....', '.KWWWWWWWWK.....', '.KWKWWWWKWK.....', '.KWWWWWWWWK.....',
      '.KKKKKKKKKK.....', '...KWWWWK.......', '..KKWWWWKK......', '.KWWKWWKWWK.....',
      '.KWKBBBBKWK.....', '.KWKBBBBWKK.....', '.KKWBBBBWK......', '.KKKWWWWKKK.....',
      '..KWWWWWWK......', '..KKKKKKKK......',
    ],
    [
      '.KKKKKKKKKK.....', '.KWWWWWWWWK.....', '.KWKWWWWKWK.....', '.KWWWWWWWWK.....',
      '.KKKKKKKKKK.....', '...KWWWWK.......', '..KKWWWWKK......', '.KWWKWWKWWK.....',
      '.KWKPPPPKWK.....', '.KWKPPPPWKK.....', '.KKWPPPPWK......', '.KKKWWWWKKK.....',
      '..KWWWWWWK......', '..KKKKKKKK......',
    ],
  ],
  brush: [[
    '......KK........', '......KRK.......', '......KRK.......', '......KRK.......',
    '......KRK.......', '......KRK.......', '.....KSSK.......', '....KSSSSK......',
    '....KSSSSSSK....', '....KSKSSKSK....', '....KSSSSSSK....', '....KKKKKKKK....',
  ]],
  plunger: [
    [
      '......KK........', '......KNK.......', '......KNK.......', '......KNK.......',
      '......KNK.......', '.....KNNK.......', '....KKRRKK......', '...KRRRRRRK.....',
      '..KRRRRRRRRK....', '.KRRRRRRRRRRK...', '.KKRRRRRRRRKK...', '..KKKKKKKKKK....',
    ],
    [
      '......KK........', '......KNK.......', '......KNK.......', '......KNK.......',
      '......KNK.......', '.....KNNK.......', '....KKRRKK......', '..KRRRRRRRRRRK..',
      '.KKRRRRRRRRRRK..', '.KKKKKKKKKKKK...', '.KKRRRRRRRRKK...', '..KKKKKKKKKK....',
    ],
  ],
  mold: [
    [
      '....KK...KK.....', '...KEEK.KEEK....', '..KEEEKEEEEK....', '..KEKEEEEEEKEK..',
      '..KEEEEKEEEEEK..', '..KEKEEEEEEEKEK.', '...KKEEEEEEKK...', '....KKKKKKKK....',
    ],
    [
      '...KKK...KKK....', '..KEEEK.KEEEK...', '.KEEEEKEEEEEK...', '.KEKKEEEEEEKKEK.',
      '.KEEEEEKEEEEEEK.', '.KEKKEEEEEEKKEK.', '..KKEEEEEEEKK...', '...KKKKKKKKK....',
    ],
  ],
  dryer: [
    [
      '.KKKKKKKKKKKK...', '.KSSSSSSSSSSK...', '.KSKKKKKKKKSK...', '.KSSSSSSSSSSK...',
      '.KSSGGGGGGSSK...', '..KKKGGGGKKK....', '....KGGGGK......', '....KGGGGK......',
      '...P..PP..P.....', '..P..PP..P......',
    ],
    [
      '.KKKKKKKKKKKK...', '.KSSSSSSSSSSK...', '.KSKKKKKKKKSK...', '.KSSSSSSSSSSK...',
      '.KSSGGGGGGSSK...', '..KKKGGGGKKK....', '....KGGGGK......', '....KGGGGK......',
      '....P..PP..P....', '...P..PP..P.....',
    ],
  ],
  bossSuperToilet: [
    [
      '........KKKKKKKKKKKKKKKK........', '......KKWWWWWWWWWWWWWWWWKK......', '.....KWWWWWWWWWWWWWWWWWWWWK.....', '.....KWWKKKKWWWWWWWWKKKKWWK.....',
      '.....KWKRRKWWWWWWWWWWKRRKWK.....', '.....KWKKKKWWWWWWWWWWKKKKWK.....', '.....KWWWWWWWKKKKKKWWWWWWWK.....', '.....KWWWWWWWWWWWWWWWWWWWWK.....',
      '...KKWWWWWWWWWWWWWWWWWWWWWWKK...', '...KWWWWWWWWWWWWWWWWWWWWWWWWK...', '...KKKKKKKKKKKKKKKKKKKKKKKKKK...', '......KKWWWWWWWWWWWWWWWWKK......',
      '....KKWWWWWWWWWWWWWWWWWWWWKK....', '.....KWWWKWWWWWWWWWWWWKWWWK.....', '.....KWWWKWBBBBBBBBBBWKWWWK.....', '....KWWKKWBBBBBBBBBBBBWKKWWK....',
      '......KWKKWBBBBBBBBBBWKKWK......', '......KWKKWBBBBBBBBBBWKKWK......', '.......KWKKWWBBBBBBWWKKWK.......', '.......KWWKKWWWWWWWWKKWWK.......',
      '.......KWWWKWWWWWWWWKWWWK.......', '........KWWWWWWWWWWWWWWK........', '.........KWWWWWWWWWWWWK.........', '.........KKKKKKKKKKKKKK.........',
    ],
    [
      '........KKKKKKKKKKKKKKKK........', '......KKWWWWWWWWWWWWWWWWKK......', '.....KWWWWWWWWWWWWWWWWWWWWK.....', '.....KWWKKKKWWWWWWWWKKKKWWK.....',
      '.....KWKRRKWWWWWWWWWWKRRKWK.....', '.....KWKKKKWWWWWWWWWWKKKKWK.....', '.....KWWWWWWWKKKKKKWWWWWWWK.....', '.....KWWWWWWWWWWWWWWWWWWWWK.....',
      '...KKWWWWWWWWWWWWWWWWWWWWWWKK...', '...KWWWWWWWWWWWWWWWWWWWWWWWWK...', '...KKKKKKKKKKKKKKKKKKKKKKKKKK...', '......KKWWWWWWWWWWWWWWWWKK......',
      '....KKWWWWWWWWWWWWWWWWWWWWKK....', '.....KWWWKWWWWWWWWWWWWKWWWK.....', '.....KWWWKWBBBBBBBBBBWKWWWK.....', '......KWKKWPBBBBBBBBPWKKWK......',
      '......KWKKWBBBBBBBBBBWKKWK......', '......KWKKWBBBBBBBBBBWKKWK......', '.......KWKKWWBBBBBBWWKKWK.......', '.......KWWKKWWWWWWWWKKWWK.......',
      '.......KWWWKWWWWWWWWKWWWK.......', '........KWWWWWWWWWWWWWWK........', '.........KWWWWWWWWWWWWK.........', '.........KKKKKKKKKKKKKK.........',
    ],
  ],
  bossBigMacaque: [
    [
      '........KKKK........KKKK........', '......KNNNNK........KNNNNK......', '.....KNnnNK..KKKKKK..KNnnNK.....', '.....KNNNNK.KNNNNNNK.KNNNNK.....',
      '......KKKK.KNNNNNNNNK.KKKK......', '..........KNNnnnnnnNNK..........', '........KNNnnWWnnWWnnNNK........', '........KNNnnWKnnWKnnNNK........',
      '.........KNNnnnnnnnnNNK.........', '.........KNnnnKKKKnnnNK.........', '..........KNnKRRRRKnNK..........', '..........KNNnKKKKnnNK..........',
      '.....KK....KNNNNNNNNK....KK.....', '....KNNK..KNNNNNNNNNNK..KNNK....', '....KNnNK.KNNNnnnnNNNK.KNnNK....', '....KNnNKKNNNnnnnnnNNNKKNnNK....',
      '...KNNNNNNNNNNnnnnnnNNNNNNNNK...', '...KNNNNNNNNnnnnnnNNNNNNNNNNK...', '....KNNNNNnnnnnnnnNNNNNNNNNK....', '.......KNNNNNnnnnnnNNNNNK.......',
      '........KKNNNNNNNNNNNNKK........', '.......KNNNKKKKKKKKKKNNNK.......', '.......KNNNK........KNNNK.......', '.......KKKKK........KKKKK.......',
    ],
    [
      '........KKKK........KKKK........', '......KNNNNK........KNNNNK......', '.....KNnnNK..KKKKKK..KNnnNK.....', '.....KNNNNK.KNNNNNNK.KNNNNK.....',
      '......KKKK.KNNNNNNNNK.KKKK......', '..........KNNnnnnnnNNK..........', '........KNNnnWWnnWWnnNNK........', '........KNNnnWKnnWKnnNNK........',
      '.........KNnnKKKKKKnnNK.........', '.........KNnnnKKKKnnnNK.........', '..........KNnKRRRRKnNK..........', '..........KNNnKKKKnnNK..........',
      '.....KK....KNNNNNNNNK....KK.....', '....KNNK..KNNNNNNNNNNK..KNNK....', '....KNnNK.KNNNnnnnNNNK.KNnNK....', '....KNnNKKNNNnnnnnnNNNKKNnNK....',
      '...KNNNNNNNNNNnnnnnnNNNNNNNNK...', '...KNNNNNNNNnnnnnnNNNNNNNNNNK...', '....KNNNNNnnnnnnnnNNNNNNNNNK....', '.......KNNNNNnnnnnnNNNNNK.......',
      '........KKNNNNNNNNNNNNKK........', '.......KNNNKKKKKKKKKKNNNK.......', '.......KNNNK........KNNNK.......', '.......KKKKK........KKKKK.......',
    ],
  ],
  bossSuperPoop: [
    [
      '...............YY...............', '..............Y..Y..............', '........KKKKKYYYYYKKKKK.........', '.......KNNNNNNNNNNNNNNNNK.......',
      '......KNNNNNNNNNNNNNNNNNNK......', '.....KNNNNNNNNNNNNNNNNNNNNK.....', '.....KNNNWWNNNNNNNNNNWWNNNK.....', '.....KNNNWKNNNNNNNNNNKWNNNK.....',
      '.....KNNNNNNNNNNNNNNNNNNNNK.....', '....KNnNNNNNNNKKKKNNNNNNNnNK....', '....KNNNNNNNNKRRRRKNNNNNNNNK....', '....KNNNNNNNNNKKKKNNNNNNNNNK....',
      '....KNNnNNNNNNNNNNNNNNNNnNNK....', '.KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.', '.KNnNNNNNNNNNNNNNNNNNNNNNNNnNNK.', '..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
    ],
    [
      '...............YY...............', '..............Y..Y..............', '........KKKKKYYYYYKKKKK.........', '.......KNNNNNNNNNNNNNNNNK.......',
      '......KNNNNNNNNNNNNNNNNNNK......', '......KNNNNNNNNNNNNNNNNNNNNK....', '......KNNNWWNNNNNNNNNNWWNNNK....', '.....KNNNWKNNNNNNNNNNKWNNNK.....',
      '.....KNNNNNNNNNNNNNNNNNNNNK.....', '....KNnNNNNNNNKKKKNNNNNNNnNK....', '....KNNNNNNNNKRRRRKNNNNNNNNK....', '....KNNNNNNNNNKKKKNNNNNNNNNK....',
      '....KNNnNNNNNNNNNNNNNNNNnNNK....', '.KNNNNNNNNNNNNNNNNNNNNNNNNNNNNK.', '.KNnNNNNNNNNNNNNNNNNNNNNNNNnNNK.', '..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
    ],
  ],
  bossRoachQueen: [
    [
      'K..............YY..............K', '.K.............YY..........K....', '..KK........KYYYYK........K..K..', '...K......KYYYYYYK......KNNNK...',
      '...K.....KKKKKKKK......KNnnnNK..', '.....KKKNnNKNnNKKKKNnnnnnNK.....', '....KNNNNNNNNNNKNNNnnnnnnnNK....', '...KNnNNNNNNNNNNNNNNnnnnnNNNK...',
      '..KNNnNNnNNnNNnNNnNNnNNnNNnNNK..', '..KNNNNNNNNNNNNNNNNNNNNNNNNNNK..', '..K.K.K.K.K.K.K.K.K.K.K.K.K.K...', '...K.K.K.K.K.K.K.K.K.K.K.K.K....',
    ],
    [
      'K..............YY..............K', '.K.............YY..........K....', '..KK........KYYYYK........K..K..', '...K......KYYYYYYK......KNNNK...',
      '...K.....KKKKKKKK......KNnnnNK..', '.....KKKNnNKNnNKKKKNnnnnnNK.....', '....KNNNNNNNNNNKNNNnnnnnnnNK....', '...KNnNNNNNNNNNNNNNNnnnnnNNNK...',
      '..KNNnNNnNNnNNnNNnNNnNNnNNnNNK..', '.KNNNNNNNNNNNNNNNNNNNNNNNNNNK...', '.K.K.K.K.K.K.K.K.K.K.K.K.K.K....', '...K.K.K.K.K.K.K.K.K.K.K.K.K....',
    ],
  ],
  bossPlumber: [
    [
      '............KKKKKKKK............', '..........KKRRRRRRRRKK..........', '.........KRRRRRRRRRRRRK.........', '.........KKKKKKKKKKKKKK...KSSK..',
      '.........KnnnnnnnnnnnnK.KSSSK...', '.........KnWKnnnnnKKnK..KSSK....', '.........KnnnnnnnnnnnnK.KSSK....', '.........KnnnNNNNNNnnK.KSSK.....',
      '.........KnnnnnnnnnK.KSSK.......', '.......KKRRRRRRRRRRRKK.KSSK.....', '......KRWKRRRRRRRRRRWKKSSK......', '......KRRKBBBBBBBBKRRKSSK.......',
      '......KRRKBBYBBYBBKRRKSSK.......', '......KRRKBBBBBBBBKRRK..SSK.....', '......KKBBBBBBBBBBKK..SSK.......', '..........KBBBBBBBBBBK..........',
      '..........KBBBBKKBBBBK..........', '.........KBBBKK..KKBBBK.........', '.........KNNNK....KNNNK.........', '........KNNNNK....KNNNNK........',
      '........KKKKK......KKKKK........',
    ],
    [
      '............KKKKKKKK............', '..........KKRRRRRRRRKK..........', '.........KRRRRRRRRRRRRK.........', '.........KKKKKKKKKKKKKK.........',
      '.........KnnnnnnnnnnnnK.........', '.........KnWKnnnnnKKnK..........', '.........KnnnnnnnnnnnnK.........', '.........KnnnNNNNNNnnK...KSSK...',
      '.........KnnnnnnnnnK...KSSSK....', '.......KKRRRRRRRRRRRKK..KSSK....', '......KRWKRRRRRRRRRRWK.KSSK.....', '......KRRKBBBBBBBBKRRK.KSSK.....',
      '......KRRKBBYBBYBBKRRK..KSSK....', '......KRRKBBBBBBBBKRRK...SSK....', '......KKBBBBBBBBBBKK....SSK.....', '..........KBBBBBBBBBBK..........',
      '..........KBBBBKKBBBBK..........', '.........KBBBKK..KKBBBK.........', '.........KNNNK....KNNNK.........', '........KNNNNK....KNNNNK........',
      '........KKKKK......KKKKK........',
    ],
  ],
  bossGoldenThrone: [
    [
      '........KKKKKKKKKKKKKKKK........', '......KKYYYYYYYYYYYYYYYYKK......', '.....KYYYYYYYYYYYYYYYYYYYYK.....', '.....KYYKKKKYYYYYYYYKKKKYYK.....',
      '.....KYKFFKYYYYYYYYYYKFFKYK.....', '.....KYKKKKYYYYYYYYYYKKKKYK.....', '.....KYYYYYYYKKKKKKYYYYYYYK.....', '.....KYYYYYYYYYYYYYYYYYYYYK.....',
      '...KKYYYYYYYYYYYYYYYYYYYYYYKK...', '...KYYYYYYYYYYYYYYYYYYYYYYYYK...', '...KKKKKKKKKKKKKKKKKKKKKKKKKK...', '......KKYYYYYYYYYYYYYYYYKK......',
      '....KKYYYYYYYYYYYYYYYYYYYYKK....', '.....KYYYKYYYYYYYYYYYYKYYYK.....', '.....KYYKYKFFFFFFFFFFYKYYYK.....', '....KYYKKYFFFFFFFFFFFFYKKYYK....',
      '......KYKKYFFFFFFFFFFYKKYK......', '......KYKKYFFFFFFFFFFYKKYK......', '.......KYKKYYFFFFFFYYKKYK.......', '.......KYYKKYYYYYYYYKKYYK.......',
      '.......KYYYKYYYYYYYYKYYYK.......', '........KYYYYYYYYYYYYYYK........', '.........KYYYYYYYYYYYYK.........', '.........KKKKKKKKKKKKKK.........',
    ],
    [
      '........KKKKKKKKKKKKKKKK........', '......KKYYYYYYYYYYYYYYYYKK......', '.....KYYYYYYYYYYYYYYYYYYYYK.....', '.....KYYKKKKYYYYYYYYKKKKYYK.....',
      '.....KYKFFKYYYYYYYYYYKFFKYK.....', '.....KYKKKKYYYYYYYYYYKKKKYK.....', '.....KYYYYYYYKKKKKKYYYYYYYK.....', '.....KYYYYYYYYYYYYYYYYYYYYK.....',
      '...KKYYYYYYYYYYYYYYYYYYYYYYKK...', '...KYYYYYYYYYYYYYYYYYYYYYYYYK...', '...KKKKKKKKKKKKKKKKKKKKKKKKKK...', '......KKYYYYYYYYYYYYYYYYKK......',
      '....KKYYYYYYYYYYYYYYYYYYYYKK....', '.....KYYYKYYYYYYYYYYYYKYYYK.....', '.....KYYKYKFFFFFFFFFFYKYYYK.....', '......KYKKYFFPFFFFFPFYKKYK......',
      '......KYKKYFFFFFFFFFFYKKYK......', '......KYKKYFFFFFFFFFFYKKYK......', '.......KYKKYYFFFFFFYYKKYK.......', '.......KYYKKYYYYYYYYKKYYK.......',
      '.......KYYYKYYYYYYYYKYYYK.......', '........KYYYYYYYYYYYYYYK........', '.........KYYYYYYYYYYYYK.........', '.........KKKKKKKKKKKKKK.........',
    ],
  ],
  playerBullet: [['.KK.', 'KPPK', 'KWWK', 'KWWK', 'KPPK', '.KK.']],
  enemyDrop: [['.KK.', 'KBBK', 'KBBK', '.KK.']],
  urinalStream: [['.KK.', 'KBBK', 'KBBK', 'KBBK', 'KBBK', '.KK.']],
  plungerSucker: [['..KK..', '.KRRK.', 'KRRRRK', 'KRRRRK', '.KKKK.']],
  wrench: [['.KK...KK', 'KSSKKSSK', 'KSSSSSSK', '.KSSSSK.', '..KSSK..', '..KSSK..', '..KSSK..', '..KSSK..']],
  macaquePoop: [['..KK..', '.KNNK.', 'KNNNNK', 'KNnNNK', 'KNNNNK', '.KKKK.']],
  powerupDoubleShot: [[
    '...KK..KK...', '..KYYKKYYK..', '..KYYKKYYK..', '..KYYKKYYK..',
    '..KYYKKYYK..', '..KYYKKYYK..', '...KK..KK...',
  ]],
  powerupShield: [[
    '....KKKK....', '..KKPPPPKK..', '.KPPKKKKPPK.', '.KPK....KPK.',
    '.KPK....KPK.', '.KPPK..KPPK.', '..KPPKKPPK..', '...KKKKKK...',
  ]],
};

export function validateSprites() {
  let frameCount = 0;

  for (const [spriteName, frames] of Object.entries(SPRITES)) {
    for (let frameIndex = 0; frameIndex < frames.length; frameIndex += 1) {
      const frame = frames[frameIndex];
      if (!Array.isArray(frame) || frame.length === 0) {
        throw new Error(`${spriteName} frame ${frameIndex}: frame must not be empty`);
      }

      const width = frame[0].length;
      for (let rowIndex = 0; rowIndex < frame.length; rowIndex += 1) {
        const row = frame[rowIndex];
        if (row.length !== width) {
          throw new Error(`${spriteName} frame ${frameIndex} row ${rowIndex}: expected width ${width}, got ${row.length}`);
        }
        for (const symbol of row) {
          if (!(symbol in PALETTE)) {
            throw new Error(`${spriteName} frame ${frameIndex} row ${rowIndex}: unknown palette symbol ${symbol}`);
          }
        }
      }
      frameCount += 1;
    }
  }

  return { spriteCount: Object.keys(SPRITES).length, frameCount };
}
