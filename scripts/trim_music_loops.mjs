#!/usr/bin/env node
// Подрезка зацикленных музыкальных треков (SPEC §12, «Бесшовность лупов»).
//
// Зачем отдельный шаг: ElevenLabs отдаёт трек с тишиной в начале и/или в конце,
// а `loop: true` превращает её в слышимую паузу каждый круг. generate_audio.mjs
// пишет ответ API как есть, поэтому после ЛЮБОЙ регенерации луп-треков этот
// скрипт надо прогнать снова — иначе `--force` вернёт паузы (codex-аудит fb7a242).
//
// Метрика та же, что в SPEC §12: разрыв петли = тихий хвост + тихое начало,
// порог −50 dB, замер ПО ОБОИМ каналам (ffmpeg silencedetect по умолчанию
// считает тишиной только момент, когда молчат все каналы сразу, и пропускает
// хвост, в котором ещё звучит один канал).
//
// Требует ffmpeg/ffprobe в PATH. Идемпотентен: уже подрезанный трек
// пропускается (перекодирование только ухудшало бы качество).
//
// Использование:
//   node scripts/trim_music_loops.mjs            # подрезать что нужно
//   node scripts/trim_music_loops.mjs --check    # только замерить, не трогать
//   node scripts/trim_music_loops.mjs --force    # перерезать даже уложившиеся
import { execFileSync } from 'node:child_process';
import { renameSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// SPEC §12: зациклены только эти три трека.
const LOOP_TRACKS = ['music_title', 'music_battle', 'music_boss'];

const SILENCE_DB = -50;
const FADE_S = 0.004; // микро-фейд на краях: стык петли идёт через нуль, без щелчка
const MAX_GAP_MS = 16; // допустимый разрыв петли; сам фейд даёт ~8 ms на двоих
const SAMPLE_RATE = 44100;
const BITRATE = '128k';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = join(ROOT, 'assets', 'audio');

function pcm(file) {
  const raw = execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-f', 's16le', '-ac', '2', '-ar', String(SAMPLE_RATE), '-'],
    { maxBuffer: 1 << 30 },
  );
  return new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
}

// Границы содержимого в кадрах: первый и последний кадр, где хотя бы один канал
// громче порога. Возвращает также разрыв петли в миллисекундах.
function bounds(file) {
  const samples = pcm(file);
  const frames = samples.length >> 1;
  const threshold = 32768 * 10 ** (SILENCE_DB / 20);
  const loud = (f) => Math.max(Math.abs(samples[f * 2]), Math.abs(samples[f * 2 + 1])) >= threshold;

  let head = 0;
  while (head < frames && !loud(head)) head += 1;
  let tail = frames - 1;
  while (tail > head && !loud(tail)) tail -= 1;

  const jump = Math.max(
    Math.abs(samples[0] - samples[(frames - 1) * 2]),
    Math.abs(samples[1] - samples[(frames - 1) * 2 + 1]),
  );

  return {
    frames,
    headQuietMs: (head / SAMPLE_RATE) * 1000,
    tailQuietMs: ((frames - 1 - tail) / SAMPLE_RATE) * 1000,
    gapMs: ((head + (frames - 1 - tail)) / SAMPLE_RATE) * 1000,
    startS: head / SAMPLE_RATE,
    endS: (tail + 1) / SAMPLE_RATE,
    jump: jump / 32768,
  };
}

function trim(file, b) {
  const duration = b.endS - b.startS;
  const fadeOutAt = Math.max(0, duration - FADE_S);
  const tmp = `${file}.trim.mp3`;

  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    '-ss', b.startS.toFixed(6),
    '-i', file,
    '-t', duration.toFixed(6),
    '-af', `afade=t=in:st=0:d=${FADE_S},afade=t=out:st=${fadeOutAt.toFixed(6)}:d=${FADE_S}`,
    '-c:a', 'libmp3lame', '-b:a', BITRATE, '-ar', String(SAMPLE_RATE),
    tmp,
  ]);

  try {
    renameSync(tmp, file);
  } catch (error) {
    unlinkSync(tmp);
    throw error;
  }
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const force = args.includes('--force');
let failed = false;

for (const track of LOOP_TRACKS) {
  const file = join(AUDIO_DIR, `${track}.mp3`);
  const before = bounds(file);
  const needs = force || before.gapMs > MAX_GAP_MS;

  if (!needs) {
    console.log(
      `${track}: разрыв петли ${before.gapMs.toFixed(1)} ms (норма ≤ ${MAX_GAP_MS}) — пропуск`,
    );
    continue;
  }

  if (checkOnly) {
    console.log(
      `${track}: разрыв петли ${before.gapMs.toFixed(1)} ms ` +
        `(начало ${before.headQuietMs.toFixed(1)}, хвост ${before.tailQuietMs.toFixed(1)}) — НУЖНА ПОДРЕЗКА`,
    );
    failed = true;
    continue;
  }

  trim(file, before);
  const after = bounds(file);
  console.log(
    `${track}: ${before.gapMs.toFixed(1)} ms → ${after.gapMs.toFixed(1)} ms, ` +
      `скачок на стыке ${after.jump.toFixed(5)}`,
  );
  if (after.gapMs > MAX_GAP_MS) {
    console.error(`${track}: ПОСЛЕ подрезки разрыв всё ещё ${after.gapMs.toFixed(1)} ms`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
