export const GRAVITY = 1500;
export const FLAP_VELOCITY = -400;
export const MAX_FALL_SPEED = 650;

export const DASH_LUNGE = 55;
export const DASH_INVINCIBLE_TIME = 0.35;
export const DASH_SPRING = 7;
export const DASH_MAX_CHARGES = 3;
export const DASH_RECHARGE_INTERVAL = 4;

export class Duke {
  constructor(baseX, y) {
    this.baseX = baseX;
    this.x = baseX;
    this.y = y;
    this.vy = 0;
    this.radius = 16;
    this.rotation = 0;
    this.dashCharges = DASH_MAX_CHARGES;
    this.dashTimer = 0;
    this.rechargeTimer = 0;
  }

  get invincible() {
    return this.dashTimer > 0;
  }

  flap() {
    this.vy = FLAP_VELOCITY;
  }

  dash(target = null) {
    if (this.dashCharges <= 0) return false;
    this.dashCharges -= 1;
    this.x = this.baseX + DASH_LUNGE;
    this.dashTimer = DASH_INVINCIBLE_TIME;
    if (target) {
      this.vy = (target.y - this.y) / DASH_INVINCIBLE_TIME;
    }
    return true;
  }

  update(dt) {
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);
    this.y += this.vy * dt;
    this.rotation = Math.max(-0.5, Math.min(0.9, this.vy / 500));

    this.x += (this.baseX - this.x) * DASH_SPRING * dt;

    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
    }

    if (this.dashCharges < DASH_MAX_CHARGES) {
      this.rechargeTimer += dt;
      if (this.rechargeTimer >= DASH_RECHARGE_INTERVAL) {
        this.rechargeTimer = 0;
        this.dashCharges += 1;
      }
    }
  }

  hitsCircle(cx, cy, cr) {
    const dx = this.x - cx;
    const dy = this.y - cy;
    return Math.hypot(dx, dy) < this.radius + cr;
  }

  hitsRect(rx, ry, rw, rh) {
    const closestX = Math.max(rx, Math.min(this.x, rx + rw));
    const closestY = Math.max(ry, Math.min(this.y, ry + rh));
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    return dx * dx + dy * dy < this.radius * this.radius;
  }
}

export class Obstacle {
  constructor(x, width, gapY, gapHeight, speed, canvasHeight) {
    this.x = x;
    this.width = width;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.speed = speed;
    this.canvasHeight = canvasHeight;
  }

  update(dt) {
    this.x -= this.speed * dt;
  }

  get offscreen() {
    return this.x + this.width < 0;
  }

  collidesWith(duke) {
    if (duke.invincible) return false;
    const topRect = { x: this.x, y: 0, w: this.width, h: this.gapY };
    const bottomRect = {
      x: this.x,
      y: this.gapY + this.gapHeight,
      w: this.width,
      h: this.canvasHeight - (this.gapY + this.gapHeight),
    };
    return (
      duke.hitsRect(topRect.x, topRect.y, topRect.w, topRect.h) ||
      duke.hitsRect(bottomRect.x, bottomRect.y, bottomRect.w, bottomRect.h)
    );
  }
}

export class Bug {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.speed = speed;
    this.collected = false;
  }

  update(dt) {
    this.x -= this.speed * dt;
  }

  get offscreen() {
    return this.x + this.radius < 0;
  }

  collidesWith(duke) {
    return !this.collected && duke.hitsCircle(this.x, this.y, this.radius);
  }
}
