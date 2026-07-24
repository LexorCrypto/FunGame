'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '../lib/store';

const WIDTH = 480;
const HEIGHT = 380;
const SCALE = 3;
const ENEMY_SIZE = 24;

const PALETTE = {
  K: '#1a1c2c',
  W: '#f4f4f4',
  B: '#3fa7f5',
  N: '#7a4a2b',
  C: '#5a4a3a',
  P: '#59d6e6',
  Y: '#ffd94d',
  O: '#f5893d',
  R: '#c23b4e',
};

const SPRITES = {
  ship: [
    '...P....',
    '..PPP...',
    '.PBPBP..',
    'PPPPPPP.',
    '.PPWPP..',
    '..P.P...',
    '.P...P..',
    '........',
  ],
  toilet: [
    '.WWWW...',
    '.WKKW...',
    '.WWWW...',
    '..WW....',
    '.WWWW...',
    '.W..W...',
    '.WWWW...',
    '........',
  ],
  poop: [
    '........',
    '...N....',
    '..NNN...',
    '.NNNNN..',
    '..NNN...',
    '.NNNNN..',
    '.NKNK...',
    '........',
  ],
  roach: [
    '.C...C..',
    '..C.C...',
    '.CCCCC..',
    '..CKC...',
    '.CCCCC..',
    '.C.C.C..',
    'C.....C.',
    '........',
  ],
  urinal: [
    '..PPP...',
    '.PWWP...',
    '.PWWP...',
    '.PWWP...',
    '.PWWP...',
    '..PP....',
    '...P....',
    '........',
  ],
};

const ENEMIES = [
  { sprite: SPRITES.toilet, colors: ['W', 'B'] },
  { sprite: SPRITES.poop, colors: ['N', 'O'] },
  { sprite: SPRITES.roach, colors: ['C', 'R'] },
  { sprite: SPRITES.urinal, colors: ['P', 'W'] },
];

function drawSprite(context, sprite, x, y) {
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const color = sprite[row][column];
      if (color !== '.') {
        context.fillStyle = PALETTE[color];
        context.fillRect(Math.round(x - 12 + column * SCALE), Math.round(y - 12 + row * SCALE), SCALE, SCALE);
      }
    }
  }
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createStars(count, speed, alpha) {
  const stars = new Array(count);
  for (let index = 0; index < count; index += 1) {
    stars[index] = { x: Math.random() * WIDTH, y: Math.random() * HEIGHT, speed, alpha };
  }
  return stars;
}

export default function TeaserCanvas() {
  const canvasRef = useRef(null);
  const addZap = useGameStore((state) => state.addZap);
  const addBreached = useGameStore((state) => state.addBreached);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    const scene = {
      animationFrame: 0,
      lastTime: performance.now(),
      visible: !document.hidden,
      pointerActive: false,
      pointerX: WIDTH / 2,
      shipX: WIDTH / 2,
      fireElapsed: 0,
      spawnElapsed: 0,
      nextSpawn: random(1.2, 2.2),
      shakeElapsed: 0,
      stars: [createStars(30, 10, 0.4), createStars(20, 25, 0.7), createStars(12, 45, 1)],
      bullets: [],
      enemies: [],
      particles: [],
    };

    const spawnEnemy = () => {
      const spec = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
      scene.enemies.push({
        x: random(12, WIDTH - 12),
        y: -12,
        speed: random(40, 70),
        sway: random(8, 18),
        phase: random(0, Math.PI * 2),
        age: 0,
        spec,
      });
    };

    const explode = (enemy) => {
      for (let index = 0; index < 10; index += 1) {
        const color = enemy.spec.colors[index % enemy.spec.colors.length];
        scene.particles.push({
          x: enemy.x,
          y: enemy.y,
          vx: random(-70, 70),
          vy: random(-70, 70),
          color: PALETTE[color],
          life: 0.4,
        });
      }
    };

    const update = (delta, time) => {
      let targetX = scene.pointerX;
      if (!scene.pointerActive) targetX = WIDTH / 2 + Math.sin(time * 0.001) * 62;
      scene.shipX += (targetX - scene.shipX) * 0.15;

      for (let layer = 0; layer < scene.stars.length; layer += 1) {
        const stars = scene.stars[layer];
        for (let index = 0; index < stars.length; index += 1) {
          const star = stars[index];
          star.y += star.speed * delta;
          if (star.y > HEIGHT) {
            star.y = 0;
            star.x = Math.random() * WIDTH;
          }
        }
      }

      scene.fireElapsed += delta;
      if (scene.fireElapsed >= 0.45) {
        scene.fireElapsed -= 0.45;
        scene.bullets.push({ x: scene.shipX - 2, y: 332 });
      }

      scene.spawnElapsed += delta;
      if (scene.spawnElapsed >= scene.nextSpawn) {
        scene.spawnElapsed = 0;
        scene.nextSpawn = random(1.2, 2.2);
        spawnEnemy();
      }

      for (let index = scene.bullets.length - 1; index >= 0; index -= 1) {
        const bullet = scene.bullets[index];
        bullet.y -= 320 * delta;
        if (bullet.y < -6) scene.bullets.splice(index, 1);
      }

      for (let index = scene.enemies.length - 1; index >= 0; index -= 1) {
        const enemy = scene.enemies[index];
        enemy.age += delta;
        enemy.y += enemy.speed * delta;
        enemy.x += Math.sin(enemy.age * 3 + enemy.phase) * enemy.sway * delta;
        if (enemy.y - 12 > HEIGHT) {
          scene.enemies.splice(index, 1);
          scene.shakeElapsed = 0.2;
          addBreached();
        }
      }

      for (let bulletIndex = scene.bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
        const bullet = scene.bullets[bulletIndex];
        for (let enemyIndex = scene.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
          const enemy = scene.enemies[enemyIndex];
          if (bullet.x + 4 > enemy.x - 12 && bullet.x < enemy.x + 12 && bullet.y + 6 > enemy.y - 12 && bullet.y < enemy.y + 12) {
            explode(enemy);
            scene.enemies.splice(enemyIndex, 1);
            scene.bullets.splice(bulletIndex, 1);
            addZap();
            break;
          }
        }
      }

      for (let index = scene.particles.length - 1; index >= 0; index -= 1) {
        const particle = scene.particles[index];
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.life -= delta;
        if (particle.life <= 0) scene.particles.splice(index, 1);
      }
      if (scene.shakeElapsed > 0) scene.shakeElapsed = Math.max(0, scene.shakeElapsed - delta);
    };

    const draw = () => {
      context.fillStyle = '#050510';
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.save();
      if (scene.shakeElapsed > 0) context.translate(random(-3, 3), random(-3, 3));

      for (let layer = 0; layer < scene.stars.length; layer += 1) {
        const stars = scene.stars[layer];
        for (let index = 0; index < stars.length; index += 1) {
          const star = stars[index];
          context.globalAlpha = star.alpha;
          context.fillStyle = '#f4f4f4';
          context.fillRect(Math.round(star.x), Math.round(star.y), layer === 2 ? 2 : 1, layer === 2 ? 2 : 1);
        }
      }
      context.globalAlpha = 1;

      context.fillStyle = PALETTE.P;
      for (let index = 0; index < scene.bullets.length; index += 1) {
        const bullet = scene.bullets[index];
        context.fillRect(Math.round(bullet.x), Math.round(bullet.y), 4, 6);
      }
      for (let index = 0; index < scene.enemies.length; index += 1) {
        const enemy = scene.enemies[index];
        drawSprite(context, enemy.spec.sprite, enemy.x, enemy.y);
      }
      for (let index = 0; index < scene.particles.length; index += 1) {
        const particle = scene.particles[index];
        context.globalAlpha = particle.life / 0.4;
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x), Math.round(particle.y), 2, 2);
      }
      context.globalAlpha = 1;
      drawSprite(context, SPRITES.ship, scene.shipX, 350);
      context.restore();
    };

    const frame = (time) => {
      const delta = Math.min((time - scene.lastTime) / 1000, 0.05);
      scene.lastTime = time;
      update(delta, time);
      draw();
      scene.animationFrame = window.requestAnimationFrame(frame);
    };

    const onPointerEnter = (event) => {
      scene.pointerActive = true;
      const bounds = canvas.getBoundingClientRect();
      scene.pointerX = (event.clientX - bounds.left) * (WIDTH / bounds.width);
    };
    const onPointerMove = (event) => {
      const bounds = canvas.getBoundingClientRect();
      scene.pointerX = Math.max(12, Math.min(WIDTH - 12, (event.clientX - bounds.left) * (WIDTH / bounds.width)));
    };
    const onPointerLeave = () => {
      scene.pointerActive = false;
    };
    const onVisibilityChange = () => {
      scene.visible = !document.hidden;
      if (scene.visible) {
        scene.lastTime = performance.now();
        scene.animationFrame = window.requestAnimationFrame(frame);
      } else {
        window.cancelAnimationFrame(scene.animationFrame);
      }
    };

    canvas.addEventListener('pointerenter', onPointerEnter);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    draw();
    if (scene.visible) scene.animationFrame = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(scene.animationFrame);
      canvas.removeEventListener('pointerenter', onPointerEnter);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [addBreached, addZap]);

  return <canvas ref={canvasRef} className="teaser-canvas" width={WIDTH} height={HEIGHT} aria-label="Pissuarius animated teaser" />;
}
