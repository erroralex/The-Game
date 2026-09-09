let audioCtx = null;

export function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, duration, { type = "square", peak = 0.18, delay = 0 } = {}) {
  const ctx = getContext();
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playFlap() {
  playTone(520, 0.09, { type: "square", peak: 0.15 });
}

export function playShieldActivate() {
  playTone(880, 0.05, { type: "square", peak: 0.2 });
  playTone(1320, 0.08, { type: "square", peak: 0.15, delay: 0.05 });
}

export function playShieldBreak() {
  playTone(700, 0.05, { type: "sawtooth", peak: 0.2 });
  playTone(440, 0.12, { type: "triangle", peak: 0.22, delay: 0.04 });
}

export function playCollect() {
  playTone(988, 0.06, { type: "triangle", peak: 0.2 });
  playTone(1568, 0.1, { type: "triangle", peak: 0.18, delay: 0.06 });
}

export function playMilestone() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 major arpeggio
  notes.forEach((freq, i) => playTone(freq, 0.18, { type: "triangle", peak: 0.22, delay: i * 0.07 }));
}

export function playHit() {
  playTone(120, 0.18, { type: "sawtooth", peak: 0.25 });
}

export function playGameOver() {
  const notes = [392, 330, 262, 196];
  notes.forEach((freq, i) => playTone(freq, 0.22, { type: "square", peak: 0.2, delay: i * 0.13 }));
}
