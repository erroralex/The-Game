import { getContext } from "./sound.js";

const TEMPO = 150; // Beats per minute
const STEP_TIME = 60 / TEMPO / 4; // 16th note duration (0.1s at 150 BPM)
const TOTAL_STEPS = 256; // 16 bars * 16 steps
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.12;
const MUTE_KEY = "dukesDebugDash.musicMuted";

let noiseBuffer = null;
let musicGain = null;
let isPlaying = false;
let currentStep = 0;
let nextStepTime = 0;
let schedulerTimer = null;
let isMuted = loadMutePreference();

function loadMutePreference() {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

function saveMutePreference(muted) {
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // Ignore if localStorage unavailable
  }
}

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function getNoiseBuffer(ctx) {
  if (!noiseBuffer) {
    const bufferSize = ctx.sampleRate * 1.5;
    noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

function getMusicGain(ctx) {
  if (!musicGain) {
    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(isMuted ? 0 : 0.22, ctx.currentTime);
    musicGain.connect(ctx.destination);
  }
  return musicGain;
}

// Drums
function playKick(ctx, time) {
  const master = getMusicGain(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

  gain.gain.setValueAtTime(0.7, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.13);
}

function playSnare(ctx, time) {
  const master = getMusicGain(ctx);
  const buffer = getNoiseBuffer(ctx);

  // Noise component
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1800, time);
  filter.Q.setValueAtTime(1.8, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.45, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);

  // Tonal body
  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = "triangle";
  body.frequency.setValueAtTime(190, time);
  body.frequency.exponentialRampToValueAtTime(75, time + 0.07);

  bodyGain.gain.setValueAtTime(0.4, time);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

  body.connect(bodyGain);
  bodyGain.connect(master);

  noise.start(time);
  body.start(time);
  noise.stop(time + 0.15);
  body.stop(time + 0.09);
}

function playHat(ctx, time, isOpen = false) {
  const master = getMusicGain(ctx);
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(7500, time);

  const duration = isOpen ? 0.12 : 0.04;
  const peak = isOpen ? 0.25 : 0.15;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  noise.start(time);
  noise.stop(time + duration + 0.01);
}

// Bass synth
function playBass(ctx, time, note) {
  if (!note) return;
  const master = getMusicGain(ctx);
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(midiToFreq(note), time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1200, time);
  filter.frequency.exponentialRampToValueAtTime(400, time + STEP_TIME * 0.9);
  filter.Q.setValueAtTime(3.0, time);

  const duration = STEP_TIME * 0.88;
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(time);
  osc.stop(time + duration + 0.01);
}

// Lead synth
function playLead(ctx, time, note, durationSteps) {
  if (!note) return;
  const master = getMusicGain(ctx);
  const duration = durationSteps * STEP_TIME;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  const freq = midiToFreq(note);
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = "square";
  osc2.frequency.setValueAtTime(freq * 1.002, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, time);
  filter.Q.setValueAtTime(1.5, time);

  const attack = 0.01;
  const decayEnd = time + duration;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.4, time + attack);
  gain.gain.setValueAtTime(0.35, Math.max(time + attack, decayEnd - 0.03));
  gain.gain.exponentialRampToValueAtTime(0.001, decayEnd);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(decayEnd + 0.02);
  osc2.stop(decayEnd + 0.02);
}

// Arpeggio / rhythm pulse
function playArp(ctx, time, note) {
  if (!note) return;
  const master = getMusicGain(ctx);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(midiToFreq(note), time);

  const duration = STEP_TIME * 0.65;
  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(master);

  osc.start(time);
  osc.stop(time + duration + 0.01);
}

// Drum patterns (K=kick, S=snare, H=hat, O=open hat)
const D_STD = ["KH", "H", "H", "H", "SH", "H", "H", "H", "KH", "H", "KH", "H", "SH", "H", "O", "H"];
const D_ROLL = ["KH", "H", "H", "H", "SH", "H", "H", "H", "S", "H", "S", "H", "S", "S", "S", "S"];

// Bass phrases (16 steps per bar)
const B_EM = [40, 40, 52, 40, 40, 40, 52, 40, 40, 40, 43, 40, 45, 43, 40, 38];
const B_EM_RUN = [40, 40, 52, 40, 43, 43, 45, 45, 47, 47, 50, 50, 52, 52, 55, 52];
const B_C = [36, 36, 48, 36, 36, 36, 48, 36, 36, 36, 40, 36, 43, 40, 36, 38];
const B_D = [38, 38, 50, 38, 38, 38, 50, 38, 38, 38, 42, 38, 45, 42, 38, 36];
const B_B = [35, 35, 47, 35, 35, 35, 47, 35, 35, 35, 39, 35, 42, 39, 47, 35];
const B_FILL = [35, 35, 39, 39, 42, 42, 47, 47, 42, 47, 51, 54, 59, 54, 51, 47];

// Lead events: [step, note, durationSteps]
const LEAD_EVENTS = [
  // Bars 1-2: Theme A
  [0, 64, 3], [3, 67, 2], [5, 69, 2], [7, 71, 3], [10, 74, 2], [12, 76, 4],
  [16, 76, 3], [19, 74, 2], [21, 71, 2], [23, 69, 3], [26, 67, 2], [28, 64, 4],
  // Bars 3-4: Response
  [32, 64, 2], [34, 67, 2], [36, 69, 2], [38, 71, 3], [41, 74, 2], [43, 76, 3],
  [46, 79, 5], [52, 78, 3], [55, 76, 3], [58, 74, 5],
  // Bars 5-8: Power lift over C & D
  [64, 67, 3], [67, 72, 3], [70, 74, 2], [72, 76, 6],
  [80, 74, 2], [82, 72, 2], [84, 71, 4], [88, 69, 6],
  [96, 69, 3], [99, 74, 3], [102, 76, 2], [104, 78, 6],
  [112, 76, 2], [114, 74, 2], [116, 78, 4], [120, 79, 6],
  // Bars 9-12: Heroic Drive
  [128, 83, 3], [131, 81, 2], [133, 79, 3], [136, 76, 4],
  [140, 74, 2], [142, 76, 2], [144, 79, 4], [148, 81, 4],
  [152, 83, 6], [160, 76, 3], [163, 79, 3], [166, 81, 2],
  [168, 83, 4], [172, 86, 4], [176, 83, 7],
  // Bars 13-16: Climax & B turnaround
  [192, 72, 2], [194, 76, 2], [196, 79, 2], [198, 84, 6],
  [208, 74, 2], [210, 78, 2], [212, 81, 2], [214, 86, 6],
  [224, 75, 3], [227, 78, 3], [230, 83, 3], [233, 87, 4],
  [238, 83, 3], [241, 81, 2], [243, 78, 2], [245, 75, 3], [248, 71, 7]
];

const leadMap = new Map();
for (const [step, note, dur] of LEAD_EVENTS) {
  leadMap.set(step, { note, dur });
}

// Build 256-step bassline & drum track
const bassTrack = [];
const drumTrack = [];
const arpTrack = [];

const BAR_BASS = [
  B_EM, B_EM, B_EM, B_EM_RUN,
  B_C, B_C, B_D, B_D,
  B_EM, B_EM, B_EM, B_EM_RUN,
  B_C, B_D, B_B, B_FILL
];

const ARP_CHORDS = [
  [64, 67, 71], [64, 67, 71], [64, 67, 71], [64, 67, 71],
  [60, 64, 67], [60, 64, 67], [62, 66, 69], [62, 66, 69],
  [64, 67, 71], [64, 67, 71], [64, 67, 71], [64, 67, 71],
  [60, 64, 67], [62, 66, 69], [59, 63, 66], [59, 63, 66]
];

for (let bar = 0; bar < 16; bar++) {
  const bPattern = BAR_BASS[bar];
  const dPattern = (bar === 15) ? D_ROLL : D_STD;
  const chord = ARP_CHORDS[bar];

  for (let s = 0; s < 16; s++) {
    bassTrack.push(bPattern[s]);
    drumTrack.push(dPattern[s]);
    const arpNote = (s % 2 === 1) ? chord[(Math.floor(s / 2)) % 3] : 0;
    arpTrack.push(arpNote);
  }
}

function scheduleStep(ctx, step, time) {
  // Drums
  const drum = drumTrack[step];
  if (drum.includes("K")) playKick(ctx, time);
  if (drum.includes("S")) playSnare(ctx, time);
  if (drum.includes("O")) playHat(ctx, time, true);
  else if (drum.includes("H")) playHat(ctx, time, false);

  // Bass
  const bassNote = bassTrack[step];
  if (bassNote) playBass(ctx, time, bassNote);

  // Lead
  const lead = leadMap.get(step);
  if (lead) playLead(ctx, time, lead.note, lead.dur);

  // Arp
  const arpNote = arpTrack[step];
  if (arpNote) playArp(ctx, time, arpNote);
}

function scheduler() {
  if (!isPlaying) return;
  const ctx = getContext();

  while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
    scheduleStep(ctx, currentStep, nextStepTime);
    nextStepTime += STEP_TIME;
    currentStep = (currentStep + 1) % TOTAL_STEPS;
  }
}

export function startMusic() {
  const ctx = getContext();
  if (isPlaying) return;
  isPlaying = true;
  currentStep = 0;
  nextStepTime = ctx.currentTime + 0.05;

  const gain = getMusicGain(ctx);
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(isMuted ? 0 : 0.22, ctx.currentTime);

  schedulerTimer = setInterval(scheduler, LOOKAHEAD_MS);
}

export function stopMusic() {
  isPlaying = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  if (musicGain) {
    const ctx = getContext();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
  }
  currentStep = 0;
}

export function toggleMusicMute() {
  isMuted = !isMuted;
  saveMutePreference(isMuted);
  if (musicGain) {
    const ctx = getContext();
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(isMuted ? 0 : 0.22, ctx.currentTime);
  }
  return isMuted;
}

export function isMusicMuted() {
  return isMuted;
}
