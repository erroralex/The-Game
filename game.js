import { Duke, Obstacle, Bug, DASH_MAX_CHARGES } from "./entities.js";

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

let state = "start"; // "start" | "playing" | "gameover"
let duke, obstacles, bugs, score, obstacleTimer, bugTimer, lastTime;

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

function spawnBug() {
  const margin = 30;
  const y = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - margin * 2);
  bugs.push(new Bug(WIDTH + 20, y, BUG_SPEED));
}

function endGame() {
  state = "gameover";
  overlayTitle.textContent = "Debugged!";
  overlayMessage.innerHTML = `Score: <strong>${score}</strong> bug${score === 1 ? "" : "s"} squashed.<br />Press Space or tap to try again.`;
  startButton.textContent = "Retry";
  overlay.hidden = false;
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
  }
}

function handleDash() {
  if (state === "playing") {
    duke.dash();
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
    }
  }
  bugs = bugs.filter((b) => !b.offscreen && !b.collected);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#6ec6ff");
  gradient.addColorStop(1, "#bfe9ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#2e2620";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = "#4a3d30";
  ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 6);
}

function drawObstacle(o) {
  ctx.fillStyle = "#c0392b";
  ctx.fillRect(o.x, 0, o.width, o.gapY);
  ctx.fillRect(o.x, o.gapY + o.gapHeight, o.width, HEIGHT - GROUND_HEIGHT - (o.gapY + o.gapHeight));

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  const lineSpacing = 14;
  for (let ly = 10; ly < o.gapY - 5; ly += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(o.x + 8, ly);
    ctx.lineTo(o.x + o.width - 8, ly);
    ctx.stroke();
  }
  const bottomStart = o.gapY + o.gapHeight + 10;
  for (let ly = bottomStart; ly < HEIGHT - GROUND_HEIGHT - 5; ly += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(o.x + 8, ly);
    ctx.lineTo(o.x + o.width - 8, ly);
    ctx.stroke();
  }

  ctx.fillStyle = "#8e2a1f";
  ctx.fillRect(o.x - 4, o.gapY - 10, o.width + 8, 10);
  ctx.fillRect(o.x - 4, o.gapY + o.gapHeight, o.width + 8, 10);
}

function drawBug(b) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.fillStyle = "#6bbf3a";
  ctx.beginPath();
  ctx.ellipse(0, 0, b.radius, b.radius * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3f7a1f";
  ctx.lineWidth = 2;
  for (const dx of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(dx, b.radius * 0.5);
    ctx.lineTo(dx * 1.6, b.radius * 1.1);
    ctx.stroke();
  }
  ctx.fillStyle = "#274d12";
  ctx.beginPath();
  ctx.arc(-4, -2, 2, 0, Math.PI * 2);
  ctx.arc(4, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDuke() {
  ctx.save();
  ctx.translate(duke.x, duke.y);
  ctx.rotate(duke.rotation);

  if (duke.invincible) {
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 18;
  }

  ctx.fillStyle = "#d13b2a";
  ctx.beginPath();
  ctx.ellipse(0, 0, duke.radius, duke.radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.ellipse(6, -4, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c1c1c";
  ctx.beginPath();
  ctx.arc(8, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#8e2a1f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-4, 2, 5, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = "#1c1c1c";
  ctx.font = "bold 28px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), WIDTH / 2, 46);

  const chargeRadius = 6;
  const spacing = 18;
  const startX = WIDTH / 2 - ((DASH_MAX_CHARGES - 1) * spacing) / 2;
  for (let i = 0; i < DASH_MAX_CHARGES; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * spacing, 64, chargeRadius, 0, Math.PI * 2);
    ctx.fillStyle = i < duke.dashCharges ? "#ffb703" : "rgba(28,28,28,0.25)";
    ctx.fill();
  }
}

function draw() {
  drawBackground();
  for (const o of obstacles) drawObstacle(o);
  for (const b of bugs) drawBug(b);
  if (state !== "start") drawDuke();
  if (state === "playing") drawHud();
}

function loop(timestamp) {
  if (lastTime === undefined) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 1 / 30);
  lastTime = timestamp;

  if (state === "playing") {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);
