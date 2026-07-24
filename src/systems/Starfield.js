const LAYERS = [
  { count: 30, speed: 10, alpha: 0.4, size: 1 },
  { count: 20, speed: 25, alpha: 0.7, size: 1 },
  { count: 12, speed: 45, alpha: 1.0, size: 2 },
];

export class Starfield {
  constructor(scene) {
    this.width = scene.scale.width;
    this.height = scene.scale.height;
    this.stars = [];

    for (const layer of LAYERS) {
      for (let index = 0; index < layer.count; index += 1) {
        const star = scene.add.rectangle(
          this.randomX(),
          Math.floor(Math.random() * this.height),
          layer.size,
          layer.size,
          0xffffff,
          layer.alpha,
        );

        this.stars.push({ star, size: layer.size, speed: layer.speed });
      }
    }
  }

  update(delta) {
    for (const { star, size, speed } of this.stars) {
      star.y += (speed * delta) / 1000;

      if (star.y > this.height) {
        star.x = this.randomX();
        star.y = -size;
      }
    }
  }

  randomX() {
    return Math.floor(Math.random() * this.width);
  }
}
