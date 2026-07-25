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
import { existsSync, renameSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// SPEC §12: зациклены только эти три трека.
const LOOP_TRACKS = ['music_title', 'music_battle', 'music_boss'];

const SILENCE_DB = -50;
// Микро-фейд на краях: стык петли идёт через нуль, без щелчка. Если короткого
// не хватает (трек обрезан «по-живому»), берём следующий по списку.
const FADE_STEPS_S = [0.004, 0.012, 0.03, 0.08];
const MAX_GAP_MS = 16; // допустимый разрыв петли; сам фейд даёт ~8 ms на двоих
// Второй критерий SPEC §12: стык петли идёт через нуль. Трек без тишины, но с
// резким несовпадением первого и последнего семпла, щёлкает каждый круг —
// одного gapMs мало (codex-аудит 17461e1). Текущие треки дают ≤ 0.00015.
const MAX_JUMP = 0.001; // доля от полной шкалы (1.0)
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

// Рендерит подрезанный вариант в `out`. Всегда режет из ИСХОДНОГО файла:
// перебор длины фейда не должен накапливать перекодирование. Путь `out`
// передаётся снаружи, чтобы уборка временного файла жила в `finally` у
// вызывающего: ffmpeg может создать файл и упасть уже после этого
// (codex-аудит f389d17, [P3]).
function renderTrim(file, b, fadeS, out) {
  const duration = b.endS - b.startS;
  const fadeOutAt = Math.max(0, duration - fadeS);

  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    '-ss', b.startS.toFixed(6),
    '-i', file,
    '-t', duration.toFixed(6),
    '-af', `afade=t=in:st=0:d=${fadeS},afade=t=out:st=${fadeOutAt.toFixed(6)}:d=${fadeS}`,
    '-c:a', 'libmp3lame', '-b:a', BITRATE, '-ar', String(SAMPLE_RATE),
    out,
  ]);
}

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const force = args.includes('--force');
let failed = false;

// Возвращает true, если трек в норме (или приведён к ней).
function processTrack(track) {
  const file = join(AUDIO_DIR, `${track}.mp3`);
  const before = bounds(file);
  const needs = force || before.gapMs > MAX_GAP_MS || before.jump > MAX_JUMP;

  if (!needs) {
    console.log(
      `${track}: разрыв петли ${before.gapMs.toFixed(1)} ms (норма ≤ ${MAX_GAP_MS}), ` +
        `скачок на стыке ${before.jump.toFixed(5)} (норма ≤ ${MAX_JUMP}) — пропуск`,
    );
    return true;
  }

  if (checkOnly) {
    console.log(
      `${track}: разрыв петли ${before.gapMs.toFixed(1)} ms ` +
        `(начало ${before.headQuietMs.toFixed(1)}, хвост ${before.tailQuietMs.toFixed(1)}), ` +
        `скачок на стыке ${before.jump.toFixed(5)} — НУЖНА ПОДРЕЗКА`,
    );
    return false;
  }

  // Короткий фейд достаточен, когда края трека и так тихие. Если трек обрезан
  // «по-живому», 4 ms не доводят стык до нуля — удлиняем, пока не уложимся.
  // Кандидаты всегда рендерятся из ИСХОДНОГО файла: перебор не накапливает
  // перекодирование, а оригинал не трогается, пока не найден годный вариант.
  let applied = null;
  let worst = null;
  const tmp = `${file}.trim.mp3`;
  for (const fadeS of FADE_STEPS_S) {
    let measured;
    try {
      renderTrim(file, before, fadeS, tmp);
      measured = bounds(tmp);
    } finally {
      // Временный файл снимаем в любом случае — ffmpeg может создать его и
      // упасть уже после этого, а декодер может упасть на замере
      // (codex-аудиты dca51ea/f389d17, [P3]).
      if (existsSync(tmp)) unlinkSync(tmp);
    }
    worst = { fadeS, measured };
    if (measured.gapMs <= MAX_GAP_MS && measured.jump <= MAX_JUMP) {
      applied = { fadeS, measured };
      break;
    }
  }

  if (!applied) {
    // Оригинал НЕ перезаписываем негодным кандидатом: иначе он потерян, а
    // следующий запуск режет уже перекодированный файл (codex-аудит dca51ea, [P2]).
    console.error(
      `${track}: ни один фейд до ${(FADE_STEPS_S.at(-1) * 1000).toFixed(0)} ms не уложился ` +
        `в норму (лучшее: разрыв ${worst.measured.gapMs.toFixed(1)} ms, ` +
        `скачок ${worst.measured.jump.toFixed(5)}) — файл оставлен как есть, трек нужно перегенерировать`,
    );
    return false;
  }

  try {
    renderTrim(file, before, applied.fadeS, tmp);
    renameSync(tmp, file);
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }

  const after = bounds(file);
  console.log(
    `${track}: разрыв ${before.gapMs.toFixed(1)} → ${after.gapMs.toFixed(1)} ms, ` +
      `скачок ${before.jump.toFixed(5)} → ${after.jump.toFixed(5)}, ` +
      `фейд ${(applied.fadeS * 1000).toFixed(0)} ms`,
  );
  return true;
}

for (const track of LOOP_TRACKS) {
  try {
    if (!processTrack(track)) {
      failed = true;
    }
  } catch (error) {
    // Битый файл или отсутствующий ffmpeg не должны ронять весь прогон
    // стек-трейсом: сообщаем по-человечески и идём к следующему треку.
    console.error(`${track}: обработать не удалось — ${String(error.message).split('\n')[0]}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
