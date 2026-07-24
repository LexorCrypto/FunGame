import { readFile } from 'node:fs/promises';

const sourceUrl = new URL('../src/data/sprites.js', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const { SPRITES, validateSprites } = await import(
  `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`,
);

const { spriteCount } = validateSprites();

for (const [name, frames] of Object.entries(SPRITES)) {
  const [firstFrame] = frames;
  console.log(`${name}: ${frames.length} кадров, ${firstFrame[0].length}x${firstFrame.length}`);
}

console.log(`OK: ${spriteCount} спрайта`);
