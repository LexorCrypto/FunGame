// Лужа Какахи (SPEC §4): 36×10 на y 250–260, живёт 3.0 s, последние 0.5 s
// мигает, контакт = смерть игрока. Оверлап с игроком вешает сцена (hazards).
export class Puddle extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y, {
    width = 36,
    height = 10,
    color = 0x6b4a2a,
    life = 3000,
    blink = 500,
  } = {}) {
    super(scene, x, y, width, height, color);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(width, height);
    this.body.setAllowGravity(false);
    this.body.immovable = true;

    // Мигание последние `blink` мс перед исчезновением.
    this.blinkEvent = scene.time.delayedCall(Math.max(0, life - blink), () => {
      this.blinkTween = scene.tweens.add({
        targets: this,
        alpha: 0.25,
        duration: 100,
        yoyo: true,
        repeat: -1,
      });
    });

    this.lifeEvent = scene.time.delayedCall(life, () => {
      this.blinkTween?.stop();
      this.destroy();
    });
  }

  preDestroy() {
    this.blinkEvent?.remove();
    this.lifeEvent?.remove();
    this.blinkTween?.stop();
    super.preDestroy();
  }
}
