# Duke's Debug Dash

A Flappy Bird-style browser game: Java's Duke mascot flies through
stack-trace obstacles, collects bugs for score, and can burn a shield
charge to safely break through an obstacle in a pinch. Static HTML5
Canvas + vanilla JavaScript (ES modules), no build step, no backend.

Play it live at https://erroralex.github.io/The-Game/, or run it locally
with `npx serve .` (see `AGENTS.md` for details).

## Overview

The app is a small set of ES modules, each with one job:

| Module | Responsibility |
| --- | --- |
| `game.js` | Owns game state, the update/draw loop, input handling, spawning, and scoring. The main entry point. |
| `entities.js` | Defines the game objects (`Duke`, `Obstacle`, `Bug`) and their physics/collision rules. |
| `render.js` | Draws the background, obstacles, bugs, Duke, and HUD onto the canvas. Pure rendering, no state. |
| `narrator.js` | Draws the professor narrator overlay image onto its own canvas. |
| `sound.js` | Synthesizes short one-shot sound effects (flap, shield, collect, milestone, hit, game over) via the Web Audio API. |
| `music.js` | Synthesizes and schedules the looping chiptune soundtrack via the Web Audio API, with a mute toggle and a tempo that ramps up with difficulty. |
| `index.html` / `styles.css` | Page structure, canvas elements, overlay/HUD markup, and all visual styling. |

## Details

### `game.js`

The main controller. It wires up the DOM (canvas, overlay, buttons),
holds the mutable game state (`state`, `duke`, `obstacles`, `bugs`, `score`,
timers), and drives everything from a single `requestAnimationFrame` loop
(`loop` -> `update` -> `draw`).

Responsibilities:
- **Game state machine:** three states, `"start"`, `"playing"`, `"gameover"`,
  transitioned by `startGame()` and `endGame()`.
- **Input handling:** keyboard (Space to flap, Shift to activate the
  shield, `M` to mute) and pointer events (click/tap to flap, right-click
  or a two-finger tap to activate the shield), each routed through
  `handleFlap()` / `handleShield()`.
- **Spawning:** `spawnObstacle()` places stack-trace obstacles at a fixed
  interval with a random gap position; every 3-5 obstacles (randomized),
  the spawned obstacle's gap also drifts slowly up and down
  (`oscillate`/`amplitude`/`angularSpeed`, see `entities.js`).
  `spawnBug()` places collectible bugs using a deterministic placement
  algorithm (`forbiddenBandsAt` / `freeSegments` / `pickFromSegments`)
  that computes the vertical bands blocked by nearby obstacles - using
  an oscillating obstacle's full min/max gap range, not just its current
  position - and samples only from the guaranteed-clear remainder, so a
  bug can never spawn somewhere unreachable.
- **Scoring:** collecting a bug awards 1 point; passing an obstacle
  (surviving or safely breaking it with the shield) awards 0.25 points,
  into the same score pool. `addScore(amount)` / `triggerMilestone()`
  detect every 10-point crossing (via a floor comparison, robust to
  fractional increments landing past a boundary rather than exactly on
  it) and, on a crossing, play a distinct milestone fanfare and bump
  obstacle/bug scroll speed and music tempo together by 5%, applied to
  every entity currently on screen as well as future spawns.
- **High score:** persisted to `localStorage` via `loadHighScore()` /
  `saveHighScore()`, shown on the game-over overlay.
- **Update/draw loop:** `update(dt)` advances physics, collisions, and
  spawns each frame; `draw()` delegates all rendering to `render.js` and
  `narrator.js`.

### `entities.js`

Defines the game's data/physics objects as plain ES classes with no
rendering or DOM knowledge.

- **`Duke`** - the player character. Tracks position, vertical velocity,
  rotation (for tilt), and shield charges. `flap()` applies an upward
  velocity impulse. `activateShield()` consumes one of Duke's 3 fixed
  shield charges (`SHIELD_MAX_CHARGES`, set once per run and never
  recharges) and grants `SHIELD_DURATION` (0.35s) of invulnerability.
  `hitsCircle` / `hitsRect` are the collision primitives used by
  `Obstacle` and `Bug`.
- **`Obstacle`** - a stack-trace wall with a vertical gap. Scrolls left at
  a constant speed, optionally oscillating (`update(dt)` moves `gapY`
  along a sine wave when `oscillate` is set). `collidesWith(duke)` reports
  plain geometric overlap; it's `game.js` that decides what a collision
  means (game over, or - if Duke is shielded - `break()`s the obstacle
  instead, starting a 0.4s fade-out, `OBSTACLE_BREAK_FADE_DURATION`, during
  which `collidesWith` returns false and `faded` eventually signals it's
  gone).
- **`Bug`** - a collectible. Scrolls left at a constant speed;
  `collidesWith(duke)` is a circle-circle check, and `collected` marks it
  consumed so it stops being drawn or checked.

All tunable physics constants (gravity, flap strength, shield
duration/charges, obstacle break fade duration) live at the top of this
file.

### `render.js`

Pure drawing functions; every function takes a canvas context and the data
to draw, with no side effects on game state.

- `createCodeLines(width, height)` / `drawBackground(...)` - generate and
  draw the dark IDE-themed background once at load (gutter, line numbers,
  randomly colored syntax-token bars) and the ground strip.
- `drawObstacle(...)` - draws a stack-trace obstacle as two red "error
  panel" segments (accent bar, pseudo-code line fills via a seeded random
  generator, seeded from a fixed spawn-time value so an oscillating
  obstacle's pattern doesn't flicker as its gap moves) with a squiggly red
  hazard line at each gap edge. A broken obstacle fades out over 0.4s
  while its palette shifts from red to green.
- `drawBug(...)` - draws a bug as a green ellipse with leg lines and eye
  dots.
- `drawDuke(...)` - draws Duke as a canvas vector sprite (white cone body,
  black pointed hood, red eye, a static left arm and a right arm that waves
  continuously using `animTime`), with a golden radial-gradient aura and
  glow while shielded.
- `drawHud(...)` - draws the score and the shield-charge indicators (small
  blue shield-icon glyphs, filled for remaining charges, dim outline for
  spent ones).

### `narrator.js`

Draws the professor narrator overlay image onto its own dedicated canvas
(`narrator-canvas` in `index.html`). Loads the PNG asset once at module
load and no-ops until it's ready; `drawNarrator(ctx, width, height)` is
called by `game.js` on the start and game-over screens. The narrator's
speech-bubble text itself is plain DOM text set directly by `game.js`, not
drawn on this canvas.

### `sound.js`

Short one-shot sound effects synthesized with the Web Audio API, no audio
files. `getContext()` lazily creates (and resumes, if suspended by
autoplay policy) a shared `AudioContext`, also reused by `music.js`.
`playTone(freq, duration, options)` is the shared oscillator+gain
primitive; `playFlap`, `playShieldActivate`, `playShieldBreak`,
`playCollect`, `playMilestone`, `playHit`, and `playGameOver` each call it
with tuned frequencies/waveforms to produce a distinct retro chip sound
per event.

### `music.js`

The looping background chiptune soundtrack, also synthesized via Web
Audio (no audio files or libraries). Uses a lookahead scheduler
(`schedulerTimer` ticking every `LOOKAHEAD_MS`, scheduling notes
`SCHEDULE_AHEAD_SEC` ahead) for sample-accurate timing independent of
`requestAnimationFrame` jitter. Synthesizes its own kick, snare, hi-hat,
bassline, lead melody, and arpeggio chords as separate functions that
schedule oscillators/noise bursts at each 16th-note step, spaced by a
mutable `stepTime` (reset to its base value each `startMusic()`).
`startMusic()` / `stopMusic()` are called by `game.js` on state
transitions; `increaseMusicTempo(factor)` shortens `stepTime` so the beat
speeds up in step with the game's difficulty ramp. `isMuted` is persisted
to `localStorage` and toggled by `toggleMusicMute()` (`M` key or the
on-screen mute button).

### `index.html` / `styles.css`

`index.html` holds the header (title + mute button), the game canvas, the
narrator overlay markup (its own canvas plus a speech-bubble `<p>` with a
connecting tail), and the start/retry overlay panel. `styles.css`
provides the dark IDE-inspired page theme, the floating pill start/retry
button, and narrator/overlay positioning.

### `scripts/play.js`

A small Node script backing `npm run play`: starts `npx serve .` on port
5173 and opens it in the default browser, for one-command local testing.
