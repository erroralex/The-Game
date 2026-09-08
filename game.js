import { Duke, Obstacle, Bug } from "./entities.js";
import { createCodeLines, drawBackground, drawObstacle, drawBug, drawDuke, drawHud } from "./render.js";
import { playFlap, playDash, playCollect, playHit, playGameOver } from "./sound.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startButton = document.getElementById("start-button");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_HEIGHT = 40;

const OBSTACLE_WIDTH = 60;
const OBSTACLE_GAP = 160;
const OBSTACLE_SPEED = 170;
const OBSTACLE_INTERVAL = 1.5;

const BUG_SPEED = 170;
const BUG_INTERVAL = 1.9;
const BUG_OBSTACLE_MARGIN = 30;
const BUG_SPAWN_ATTEMPTS = 20;

const codeLines = createCodeLines(WIDTH, HEIGHT);

let state = "start"; // "start" | "playing" | "gameover"
let duke, obstacles, bugs, score, obstacleTimer, bugTimer, lastTime;
let animTime = 0;

function resetGame() {
  duke = new Duke(90, HEIGHT / 2);
  obstacles = [];
  bugs = [];
  score = 0;
  obstacleTimer = 0;
  bugTimer = BUG_INTERVAL / 2;
}

function spawnObstacle() {
  const margin = 60;
  const gapY = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - OBSTACLE_GAP - margin * 2);
  obstacles.push(new Obstacle(WIDTH, OBSTACLE_WIDTH, gapY, OBSTACLE_GAP, OBSTACLE_SPEED, HEIGHT - GROUND_HEIGHT));
}

function isClearOfObstacles(x, y, radius) {
  for (const o of obstacles) {
    const rects = [
      { x: o.x, y: 0, w: o.width, h: o.gapY },
      { x: o.x, y: o.gapY + o.gapHeight, w: o.width, h: HEIGHT - GROUND_HEIGHT - (o.gapY + o.gapHeight) },
    ];
    for (const r of rects) {
      const closestX = Math.max(r.x, Math.min(x, r.x + r.w));
      const closestY = Math.max(r.y, Math.min(y, r.y + r.h));
      const dx = x - closestX;
      const dy = y - closestY;
      if (Math.hypot(dx, dy) < radius + BUG_OBSTACLE_MARGIN) return false;
    }
  }
  return true;
}

function spawnBug() {
  const margin = 30;
  const spawnX = WIDTH + 20;
  const bugRadius = 10;
  let y = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - margin * 2);
  for (let attempt = 0; attempt < BUG_SPAWN_ATTEMPTS && !isClearOfObstacles(spawnX, y, bugRadius); attempt++) {
    y = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - margin * 2);
  }
  bugs.push(new Bug(spawnX, y, BUG_SPEED));
}

function findNearestBug() {
  let nearest = null;
  let nearestDist = Infinity;
  for (const bug of bugs) {
    const dist = Math.hypot(bug.x - duke.x, bug.y - duke.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = bug;
    }
  }
  return nearest;
}

function endGame() {
  state = "gameover";
  overlayTitle.textContent = "Debugged!";
  overlayMessage.innerHTML = `Score: <strong>${score}</strong> bug${score === 1 ? "" : "s"} squashed.<br />Press Space or tap to try again.`;
  startButton.textContent = "Retry";
  overlay.hidden = false;
  playHit();
  playGameOver();
}

function startGame() {
  resetGame();
  state = "playing";
  overlay.hidden = true;
}

function handleFlap() {
  if (state === "start" || state === "gameover") {
    startGame();
    return;
  }
  if (state === "playing") {
    duke.flap();
    playFlap();
  }
}

function handleDash() {
  if (state === "playing") {
    const target = findNearestBug();
    if (duke.dash(target)) {
      playDash();
    }
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    handleFlap();
  } else if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    e.preventDefault();
    handleDash();
  }
});

canvas.addEventListener("pointerdown", (e) => {
  if (e.button === 2) {
    handleDash();
  } else {
    handleFlap();
  }
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  handleDash();
});

startButton.addEventListener("click", () => {
  startGame();
});

function update(dt) {
  duke.update(dt);

  if (duke.y - duke.radius < 0 || duke.y + duke.radius > HEIGHT - GROUND_HEIGHT) {
    endGame();
    return;
  }

  obstacleTimer += dt;
  if (obstacleTimer >= OBSTACLE_INTERVAL) {
    obstacleTimer = 0;
    spawnObstacle();
  }

  bugTimer += dt;
  if (bugTimer >= BUG_INTERVAL) {
    bugTimer = 0;
    spawnBug();
  }

  for (const obstacle of obstacles) {
    obstacle.update(dt);
    if (obstacle.collidesWith(duke)) {
      endGame();
      return;
    }
  }
  obstacles = obstacles.filter((o) => !o.offscreen);

  for (const bug of bugs) {
    bug.update(dt);
    if (bug.collidesWith(duke)) {
      bug.collected = true;
      score += 1;
      playCollect();
    }
  }
  bugs = bugs.filter((b) => !b.offscreen && !b.collected);
}

function draw() {
  drawBackground(ctx, WIDTH, HEIGHT, GROUND_HEIGHT, codeLines);
  for (const o of obstacles) drawObstacle(ctx, o, HEIGHT, GROUND_HEIGHT);
  for (const b of bugs) drawBug(ctx, b);
  if (state !== "start") drawDuke(ctx, duke, animTime);
  if (state === "playing") drawHud(ctx, WIDTH, score, duke);
}

function loop(timestamp) {
  if (lastTime === undefined) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 1 / 30);
  lastTime = timestamp;
  animTime += dt;

  if (state === "playing") {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
