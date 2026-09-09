export const GRAVITY = 1500;
export const FLAP_VELOCITY = -400;
export const MAX_FALL_SPEED = 650;

export const SHIELD_DURATION = 0.35; // brief invulnerability window per activation
export const SHIELD_MAX_CHARGES = 3; // fixed for the whole run; does not recharge

export class Duke {
  constructor(baseX, y) {
    this.baseX = baseX;
    this.x = baseX;
    this.y = y;
    this.vy = 0;
    this.radius = 16;
    this.rotation = 0;
    this.shieldCharges = SHIELD_MAX_CHARGES;
    this.shieldTimer = 0;
  }

  get shielded() {
    return this.shieldTimer > 0;
  }

  flap() {
    this.vy = FLAP_VELOCITY;
  }

  activateShield() {
    if (this.shieldCharges <= 0) return false;
    this.shieldCharges -= 1;
    this.shieldTimer = SHIELD_DURATION;
    return true;
  }

  update(dt) {
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL_SPEED);
    this.y += this.vy * dt;
    this.rotation = Math.max(-0.5, Math.min(0.9, this.vy / 500));

    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
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

export const OBSTACLE_BREAK_FADE_DURATION = 0.4;

export class Obstacle {
  constructor(x, width, gapY, gapHeight, speed, canvasHeight, options = {}) {
    const { oscillate = false, amplitude = 0, angularSpeed = 0 } = options;
    this.x = x;
    this.width = width;
    this.gapY = gapY;
    this.gapHeight = gapHeight;
    this.speed = speed;
    this.canvasHeight = canvasHeight;
    this.scored = false;
    this.broken = false;
    this.breakTimer = 0;

    // Fixed at spawn so the rendered stack-panel pattern (seeded from gapY)
    // doesn't flicker as an oscillating obstacle's gapY changes each frame.
    this.seed = gapY * 131 + width;

    this.oscillate = oscillate;
    this.baseGapY = gapY;
    this.amplitude = amplitude;
    this.angularSpeed = angularSpeed;
    this.phase = Math.random() * Math.PI * 2;
    this.oscillateTime = 0;

    // Worst-case gap range over the obstacle's lifetime; used by bug
    // placement to stay clear of the gap no matter where it currently sits.
    this.minGapY = oscillate ? gapY - amplitude : gapY;
    this.maxGapY = oscillate ? gapY + amplitude : gapY;
  }

  update(dt) {
    this.x -= this.speed * dt;
    if (this.oscillate) {
      this.oscillateTime += dt;
      this.gapY = this.baseGapY + Math.sin(this.oscillateTime * this.angularSpeed + this.phase) * this.amplitude;
    }
    if (this.broken) {
      this.breakTimer = Math.max(0, this.breakTimer - dt);
    }
  }

  get offscreen() {
    return this.x + this.width < 0;
  }

  get faded() {
    return this.broken && this.breakTimer <= 0;
  }

  break() {
    this.broken = true;
    this.breakTimer = OBSTACLE_BREAK_FADE_DURATION;
  }

  collidesWith(duke) {
    if (this.broken) return false;
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
