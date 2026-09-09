import { DASH_MAX_CHARGES } from "./entities.js";

const CODE_COLORS = ["#569cd6", "#c586c0", "#9cdcfe", "#ce9178", "#4ec9b0", "#dcdcaa", "#6a9955", "#d4d4d4"];
const GUTTER_WIDTH = 34;
const LINE_HEIGHT = 16;

export function createCodeLines(width, height) {
  const lines = [];
  const rows = Math.ceil(height / LINE_HEIGHT);
  const usableWidth = width - GUTTER_WIDTH - 20;
  for (let i = 0; i < rows; i++) {
    const indent = Math.floor(Math.random() * 4) * 14;
    const tokens = [];
    let x = indent;
    const tokenCount = 2 + Math.floor(Math.random() * 4);
    for (let t = 0; t < tokenCount; t++) {
      const tokenWidth = 12 + Math.random() * 40;
      if (x + tokenWidth > usableWidth) break;
      tokens.push({ x, width: tokenWidth, color: CODE_COLORS[Math.floor(Math.random() * CODE_COLORS.length)] });
      x += tokenWidth + 6 + Math.random() * 10;
    }
    lines.push({ y: i * LINE_HEIGHT + LINE_HEIGHT, tokens });
  }
  return lines;
}

export function drawBackground(ctx, width, height, groundHeight, codeLines) {
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#252526";
  ctx.fillRect(0, 0, GUTTER_WIDTH, height);
  ctx.strokeStyle = "#3c3c3c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(GUTTER_WIDTH + 0.5, 0);
  ctx.lineTo(GUTTER_WIDTH + 0.5, height);
  ctx.stroke();

  ctx.fillStyle = "#6e7681";
  ctx.font = "10px 'Courier New', monospace";
  ctx.textAlign = "right";
  let lineNumber = 1;
  for (const line of codeLines) {
    ctx.fillText(String(lineNumber), GUTTER_WIDTH - 6, line.y);
    lineNumber++;
  }

  ctx.globalAlpha = 0.55;
  for (const line of codeLines) {
    for (const token of line.tokens) {
      ctx.fillStyle = token.color;
      ctx.fillRect(GUTTER_WIDTH + 8 + token.x, line.y - 9, token.width, 6);
    }
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#2e2620";
  ctx.fillRect(0, height - groundHeight, width, groundHeight);
  ctx.fillStyle = "#4a3d30";
  ctx.fillRect(0, height - groundHeight, width, 6);
}

function seededRandom(seed) {
  let s = Math.floor(seed) % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function drawStackSegment(ctx, rand, x, y, w, h) {
  ctx.fillStyle = "rgba(80, 20, 20, 0.92)";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#e06c75";
  ctx.fillRect(x, y, 4, h);

  const lineHeight = 15;
  const rows = Math.floor(h / lineHeight);
  for (let i = 0; i < rows; i++) {
    const rowY = y + i * lineHeight + 4;
    const lineWidth = 10 + rand() * Math.max(1, w - 24);
    ctx.fillStyle = "rgba(224, 108, 117, 0.55)";
    ctx.fillRect(x + 10, rowY, lineWidth, 5);
  }

  ctx.strokeStyle = "#ff8a80";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function drawHazardEdge(ctx, x, w, edgeY) {
  ctx.strokeStyle = "#ff5252";
  ctx.lineWidth = 2;
  const amplitude = 3;
  const step = 6;
  ctx.beginPath();
  let first = true;
  for (let px = x; px <= x + w; px += step) {
    const bump = Math.floor((px - x) / step) % 2 === 0 ? -amplitude : amplitude;
    const py = edgeY + bump;
    if (first) {
      ctx.moveTo(px, py);
      first = false;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

export function drawObstacle(ctx, o, height, groundHeight) {
  // Uses the obstacle's fixed spawn-time seed (not the live gapY) so an
  // oscillating obstacle's panel pattern stays stable instead of flickering.
  const rand = seededRandom(o.seed);
  const bottomHeight = height - groundHeight - (o.gapY + o.gapHeight);

  drawStackSegment(ctx, rand, o.x, 0, o.width, o.gapY);
  drawStackSegment(ctx, rand, o.x, o.gapY + o.gapHeight, o.width, bottomHeight);

  drawHazardEdge(ctx, o.x, o.width, o.gapY);
  drawHazardEdge(ctx, o.x, o.width, o.gapY + o.gapHeight);
}

export function drawBug(ctx, b) {
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

export function drawDuke(ctx, duke, animTime) {
  const s = duke.radius / 14;

  ctx.save();
  ctx.translate(duke.x, duke.y);
  ctx.rotate(duke.rotation);

  if (duke.invincible) {
    ctx.shadowColor = "#ffe066";
    ctx.shadowBlur = 18;
  }

  ctx.scale(s, s);

  // body: white cone with a wavy hem and a small pointed left foot
  ctx.beginPath();
  ctx.moveTo(1, -23);
  ctx.quadraticCurveTo(11, -12, 14, 3);
  ctx.quadraticCurveTo(16, 12, 10, 17);
  ctx.quadraticCurveTo(2, 22, -6, 17);
  ctx.quadraticCurveTo(-11, 14, -9, 8);
  ctx.lineTo(-14, 11);
  ctx.quadraticCurveTo(-10, 3, -9, -2);
  ctx.quadraticCurveTo(-9, -14, 1, -23);
  ctx.closePath();
  ctx.fillStyle = "#fdfdfd";
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = "#1c1c1c";
  ctx.stroke();
  ctx.shadowBlur = 0;

  // hood: black, pointed at the top
  ctx.beginPath();
  ctx.moveTo(1, -23);
  ctx.quadraticCurveTo(10, -13, 11, -4);
  ctx.quadraticCurveTo(2, -9, -8, -3);
  ctx.quadraticCurveTo(-8, -14, 1, -23);
  ctx.closePath();
  ctx.fillStyle = "#1c1c1c";
  ctx.fill();

  // eye: red oval with a highlight
  ctx.save();
  ctx.translate(-1, -8);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#e8483a";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-1.5, -1.3, 2, 1.3, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = "#ff9d8f";
  ctx.fill();
  ctx.restore();

  // left arm: small static stub
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.quadraticCurveTo(-15, 6, -14, 12);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineCap = "round";
  ctx.stroke();

  // right arm: waves independently of flight
  const waveAngle = 0.5 + Math.sin(animTime * 6) * 0.35;
  ctx.save();
  ctx.translate(11, -6);
  ctx.rotate(waveAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -15);
  ctx.lineWidth = 3.4;
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -18, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1c1c1c";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export function drawHud(ctx, width, score, duke) {
  ctx.fillStyle = "#fdfdfd";
  ctx.font = "bold 28px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(score), width / 2, 46);

  const chargeRadius = 6;
  const spacing = 18;
  const startX = width / 2 - ((DASH_MAX_CHARGES - 1) * spacing) / 2;
  for (let i = 0; i < DASH_MAX_CHARGES; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * spacing, 64, chargeRadius, 0, Math.PI * 2);
    ctx.fillStyle = i < duke.dashCharges ? "#ffb703" : "rgba(253,253,253,0.25)";
    ctx.fill();
  }
}
