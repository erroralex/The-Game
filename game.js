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
const OBSTACLE_INTERVAL = 1.8;

const BUG_SPEED = 170;
const BUG_INTERVAL = 1.9;
const BUG_MARGIN = 30;
const BUG_RADIUS = 10;
const BUG_OBSTACLE_CLEARANCE = 36;

const HIGH_SCORE_KEY = "dukesDebugDash.highScore";

const codeLines = createCodeLines(WIDTH, HEIGHT);

let state = "start"; // "start" | "playing" | "gameover"
let duke, obstacles, bugs, score, obstacleTimer, bugTimer, lastTime;
let animTime = 0;
let highScore = loadHighScore();

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

// Bug and obstacle move at the same speed, so their horizontal offset never
// changes after spawn: checking clearance once, at spawn time, holds forever.
function forbiddenBandsAt(x, threshold) {
  const bands = [];
  for (const o of obstacles) {
    const dx = Math.max(o.x - x, x - (o.x + o.width), 0);
    if (dx >= threshold) continue;
    const verticalPad = Math.sqrt(threshold * threshold - dx * dx);
    bands.push([0, o.gapY + verticalPad]);
    bands.push([o.gapY + o.gapHeight - verticalPad, HEIGHT - GROUND_HEIGHT]);
  }
  return bands;
}

function mergeBands(bands) {
  const sorted = bands.slice().sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

function freeSegments(forbidden, rangeStart, rangeEnd) {
  const clipped = forbidden
    .map(([start, end]) => [Math.max(start, rangeStart), Math.min(end, rangeEnd)])
    .filter(([start, end]) => start < end);
  const merged = mergeBands(clipped);
  const free = [];
  let cursor = rangeStart;
  for (const [start, end] of merged) {
    if (start > cursor) free.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < rangeEnd) free.push([cursor, rangeEnd]);
  return free;
}

function pickFromSegments(segments) {
  const total = segments.reduce((sum, [start, end]) => sum + (end - start), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const [start, end] of segments) {
    const length = end - start;
    if (r <= length) return start + r;
    r -= length;
  }
  return segments[segments.length - 1][1];
}

function spawnBug() {
  const spawnX = WIDTH + 20;
  const threshold = BUG_RADIUS + BUG_OBSTACLE_CLEARANCE;
  const forbidden = forbiddenBandsAt(spawnX, threshold);
  const segments = freeSegments(forbidden, BUG_MARGIN, HEIGHT - GROUND_HEIGHT - BUG_MARGIN);
  const y = pickFromSegments(segments) ?? HEIGHT / 2;
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

function loadHighScore() {
  try {
    const stored = Number(localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  } catch {
    // localStorage unavailable (private mode, disabled): high score just won't persist.
  }
}

function endGame() {
  state = "gameover";
  const isNewHighScore = score > highScore;
  if (isNewHighScore) {
    highScore = score;
    saveHighScore(highScore);
  }
  overlayTitle.textContent = "Debugged!";
  overlayMessage.innerHTML = `Score: <strong>${score}</strong> bug${score === 1 ? "" : "s"} squashed.<br />Best: <strong>${highScore}</strong>${isNewHighScore ? " (new high score!)" : ""}<br />Press Space or tap to try again.`;
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
