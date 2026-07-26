// SPEC §8: пауэр-ап выпадает из убитого пикирующего врага (30% шанс) и с
// каждого попадания по живому боссу (10% шанс); распределение у обоих
// источников одно — 70% выстрел / 30% щит. Падает 60 px/s и ЗАМИРАЕТ в зоне
// игрока (§1), где подбирается касанием; висит 6.0 s, последние 1.5 s мигает,
// затем пропадает. Тип: 'shot' (уровень оружия) | 'shield' (заряд щита) —
// сам эффект и потолок уровня знает Player.applyPowerUp().
//
// Решение владельца 2026-07-25: раньше дроп оставался висеть в точке гибели
// врага — в полосе формации/середины (y 36–176), куда корабль не залетает
// (§2: центр y ∈ [184, 262]), и был физически недостижим.
// Причина зависания: `Phaser.Physics.Arcade.Group.add()` прогоняет по телу
// ВСЕ `defaults` (PhysicsGroup.createCallbackHandler), включая
// `setVelocityX/Y(0)`, то есть обнуляет заданную в конструкторе скорость.
// Поэтому падение здесь позиционное (как у Player), а не через body.velocity —
// оно не зависит от того, в какую группу объект добавят.
const FALL_SPEED = 60; // px/s, §8
// Середина полосы движения корабля (§2: центр y ∈ [184, 262]) — дроп
// достижим и сверху, и снизу.
const REST_Y = 223;
// Ограничение корабля по x (§2) — дроп у самого края поля тоже достижим.
const MIN_X = 8;
const MAX_X = 472;
const LIFE_MS = 6000;
const BLINK_MS = 1500;

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const texture = type === 'shield' ? 'powerupShield-0' : 'powerupDoubleShot-0';
    // Появление никогда не ниже точки покоя: дроп только падает, вверх не идёт.
    super(scene, Phaser.Math.Clamp(x, MIN_X, MAX_X), Math.min(y, REST_Y), texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type; // 'shot' | 'shield'
    this.landed = false;
    this.body.setSize(this.width, this.height);
    this.body.setAllowGravity(false);
    this.body.reset(this.x, this.y);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.landed) {
      return;
    }

    this.y = Math.min(this.y + (FALL_SPEED * delta) / 1000, REST_Y);
    this.body.reset(this.x, this.y);

    if (this.y >= REST_Y) {
      this.land();
    }
  }

  // Замер в зоне игрока: ждём подбора LIFE_MS, последние BLINK_MS мигаем.
  land() {
    this.landed = true;

    this.blinkEvent = this.scene.time.delayedCall(LIFE_MS - BLINK_MS, () => {
      this.blinkTween = this.scene.tweens.add({
        targets: this,
        alpha: 0.25,
        duration: 100,
        yoyo: true,
        repeat: -1,
      });
    });

    this.lifeEvent = this.scene.time.delayedCall(LIFE_MS, () => {
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
