// SPEC §10: гашение скорости ×0.9 на кадр. velocityX/Y ops не существуют в
// configOpMap 3.90 (проверено эмпирически), поэтому — custom particleClass.
class DampedParticle extends Phaser.GameObjects.Particles.Particle {
  update(delta, step, processors) {
    this.velocityX *= 0.9;
    this.velocityY *= 0.9;
    return super.update(delta, step, processors);
  }
}

function ensurePixelTexture(scene) {
  if (scene.textures.exists('fx-pixel')) {
    return;
  }

  const canvas = scene.textures.createCanvas('fx-pixel', 2, 2);
  canvas.context.fillStyle = '#ffffff';
  canvas.context.fillRect(0, 0, 2, 2);
  canvas.refresh();
}

export function explode(scene, x, y, { count = 10, tint = 0xffffff } = {}) {
  ensurePixelTexture(scene);

  const emitter = scene.add.particles(x, y, 'fx-pixel', {
    speed: { min: 40, max: 90 },
    lifespan: 400,
    gravityY: 0,
    quantity: count,
    scale: 1,
    tint,
    emitting: false,
    particleClass: DampedParticle,
  });

  emitter.explode(count);
  scene.time.delayedCall(400, () => emitter.destroy());
}

export function shakePlayerDeath(scene) {
  scene.cameras.main.shake(
    500,
    new Phaser.Math.Vector2(6 / 480, 6 / 270),
  );
}
