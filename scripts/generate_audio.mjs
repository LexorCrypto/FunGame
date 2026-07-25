// Офлайн-генерация аудио через ElevenLabs API (SPEC §12).
//
// Запуск:
//   ELEVENLABS_API_KEY=... node scripts/generate_audio.mjs [--only=a,b] [--force] [--dry-run]
//
// Файлы пишутся в assets/audio/ как mp3 (44.1 kHz) и коммитятся в репозиторий
// (см. SPEC §12 — генерация одноразовая/офлайн, не часть игрового рантайма).
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const AUDIO_DIR = fileURLToPath(new URL('../assets/audio/', import.meta.url));

// Дословно из таблицы «SFX (16 файлов)», SPEC.md строки 700-719.
const SFX = [
  ['sfx_shoot.mp3', 0.3, '8-bit chiptune laser zap, punchy retro arcade blaster shot, high quality'],
  ['sfx_hit.mp3', 0.2, 'short 8-bit impact blip, retro arcade hit confirm, high quality'],
  ['sfx_enemy_explode.mp3', 0.5, '8-bit crunchy noise explosion, retro arcade enemy pop, high quality'],
  ['sfx_player_death.mp3', 1.2, '8-bit descending explosion with falling pitch whine, dramatic retro arcade death'],
  ['sfx_flush.mp3', 1.0, 'comical toilet flush whoosh rendered in 8-bit chiptune style, swirling water'],
  ['sfx_stream.mp3', 0.4, 'short cartoon water squirt, 8-bit retro game style'],
  ['sfx_splat.mp3', 0.4, 'wet squishy splat, 8-bit retro game style'],
  ['sfx_dryer.mp3', 0.8, 'air blower whoosh, 8-bit retro game style, hand dryer'],
  ['sfx_plunger.mp3', 0.5, 'rubber plunger pop and squelch, 8-bit cartoon game style'],
  ['sfx_wrench.mp3', 0.7, 'spinning metallic whoosh with soft clang, 8-bit retro game style'],
  ['sfx_powerup.mp3', 0.8, 'cheerful 8-bit power-up jingle, rising arpeggio, high quality'],
  ['sfx_shield.mp3', 0.5, '8-bit energy shield bubble pop, retro arcade'],
  ['sfx_wave_clear.mp3', 1.0, 'cheerful 8-bit level clear ding arpeggio, retro arcade'],
  ['sfx_roach_spawn.mp3', 0.4, 'chittering insect skitter, 8-bit retro game style'],
  ['sfx_boss_hit.mp3', 0.3, '8-bit heavy impact thud, boss damage, retro arcade'],
  ['sfx_phase.mp3', 0.8, '8-bit alarm riser, boss enrage sting, retro arcade'],
].map(([file, durationSeconds, prompt]) => ({ file, kind: 'sfx', durationSeconds, prompt }));

// Дословно из таблицы «Музыка (6 файлов, ElevenLabs Music)», SPEC.md строки 723-730.
// Длительности переведены в мс: 30s/45s/40s/60s/8s/6s.
const MUSIC = [
  ['music_title.mp3', 30_000, 'Heroic 8-bit chiptune title theme, catchy square-wave melody over driving bass, retro arcade, seamless loop, instrumental'],
  ['music_battle.mp3', 45_000, 'Energetic 8-bit chiptune battle loop, driving eighth-note bassline, punchy drums, retro arcade shooter, seamless loop, instrumental'],
  ['music_boss.mp3', 40_000, 'Intense 8-bit chiptune boss battle loop, minor key, fast arpeggios, urgent drums, seamless loop, instrumental'],
  ['music_crawl.mp3', 60_000, 'Epic space-opera opening overture in 8-bit chiptune style, triumphant brass-like fanfare, soaring heroic melody, galactic adventure, instrumental'],
  ['music_victory.mp3', 8_000, 'Short triumphant 8-bit fanfare, rising major arpeggio finale, retro arcade'],
  ['music_gameover.mp3', 6_000, 'Sad descending 8-bit jingle, retro game over'],
].map(([file, lengthMs, prompt]) => ({ file, kind: 'music', lengthMs, prompt }));

/** Полный список из 22 записей: 16 SFX + 6 музыкальных треков (SPEC §12). */
export const MANIFEST = [...SFX, ...MUSIC];

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Строит {url, init} для fetch() по одной записи MANIFEST (SPEC §12: эндпоинты
 * `/v1/sound-generation` для SFX и `/v1/music` для музыки, output_format
 * mp3_44100_128). Ключ передаётся только в заголовке запроса, никогда не
 * логируется и не сохраняется.
 */
export function buildRequest(entry, apiKey) {
  const headers = {
    'xi-api-key': apiKey,
    'Content-Type': 'application/json',
    Accept: 'audio/mpeg',
  };

  if (entry.kind === 'sfx') {
    return {
      url: `${ELEVENLABS_BASE}/sound-generation?output_format=mp3_44100_128`,
      init: {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: entry.prompt, duration_seconds: entry.durationSeconds }),
      },
    };
  }

  return {
    url: `${ELEVENLABS_BASE}/music?output_format=mp3_44100_128`,
    init: {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: entry.prompt, music_length_ms: entry.lengthMs }),
    },
  };
}

/**
 * Проверяет магию mp3 в буфере: ID3-тег в начале либо frame sync
 * (0xFF, следующий байт & 0xE0 === 0xE0). Защищает от записи мусора/HTML
 * ошибки как якобы валидного аудио.
 */
export function isMp3(buffer) {
  if (!buffer || buffer.length < 3) return false;
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true; // 'ID3'
  return buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
}

function parseArgs(argv) {
  const flags = { only: null, force: false, dryRun: false };
  for (const arg of argv) {
    if (arg === '--force') {
      flags.force = true;
    } else if (arg === '--dry-run') {
      flags.dryRun = true;
    } else if (arg.startsWith('--only=')) {
      flags.only = arg
        .slice('--only='.length)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => (name.endsWith('.mp3') ? name : `${name}.mp3`));
    } else {
      throw new Error(`неизвестный флаг: ${arg}`);
    }
  }
  return flags;
}

function selectEntries(flags) {
  if (!flags.only) return MANIFEST;
  const wanted = new Set(flags.only);
  const selected = MANIFEST.filter((entry) => wanted.has(entry.file));
  const missing = [...wanted].filter((file) => !selected.some((entry) => entry.file === file));
  if (missing.length > 0) {
    throw new Error(`--only: неизвестные файлы: ${missing.join(', ')}`);
  }
  return selected;
}

function describeLength(entry) {
  return entry.kind === 'sfx' ? `${entry.durationSeconds}s` : `${entry.lengthMs}ms`;
}

function describeEndpoint(entry) {
  return entry.kind === 'sfx' ? 'POST /v1/sound-generation' : 'POST /v1/music';
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const entries = selectEntries(flags);

  if (flags.dryRun) {
    console.log(`План генерации (${entries.length} записей):`);
    for (const entry of entries) {
      console.log(`  ${entry.file}\t${describeEndpoint(entry)}\t${describeLength(entry)}`);
    }
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error(
      'Ошибка: не задана переменная окружения ELEVENLABS_API_KEY. ' +
        'Получить ключ: https://elevenlabs.io/app/settings/api-keys (см. .env.example, SPEC §12).',
    );
    process.exit(1);
    return;
  }

  await mkdir(AUDIO_DIR, { recursive: true });

  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    const destPath = path.join(AUDIO_DIR, entry.file);

    if (!flags.force && existsSync(destPath)) {
      console.log(`skip: ${entry.file} (уже существует, используйте --force для перегенерации)`);
      skipped += 1;
      continue;
    }

    console.log(`generate: ${entry.file} (${describeEndpoint(entry)}, ${describeLength(entry)})`);

    let response;
    try {
      const { url, init } = buildRequest(entry, apiKey);
      response = await fetch(url, init);
    } catch (error) {
      console.error(`  ошибка сети: ${entry.file}: ${error.message}`);
      failed += 1;
      continue;
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error(`  ошибка ${response.status} ${response.statusText}: ${entry.file}: ${bodyText}`);
      failed += 1;
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!isMp3(buffer)) {
      console.error(`  ошибка: ${entry.file}: ответ не является валидным mp3, файл не записан`);
      failed += 1;
      continue;
    }

    await writeFile(destPath, buffer);
    console.log(`  записано: ${entry.file} (${buffer.length} байт)`);
    written += 1;
  }

  console.log(`\nИтог: записано ${written}, пропущено ${skipped}, ошибок ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

// CLI запускается только при прямом вызове файла (не при импорте для тестов).
const isMainModule = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMainModule) {
  main().catch((error) => {
    console.error(`Ошибка: ${error.message}`);
    process.exit(1);
  });
}
