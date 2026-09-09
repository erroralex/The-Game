# Duke's Debug Dash

A Flappy Bird-style browser game: Java's Duke mascot flies through
stack-trace obstacles and dashes to collect bugs for score. Static HTML5
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
| `sound.js` | Synthesizes short one-shot sound effects (flap, dash, collect, hit, game over) via the Web Audio API. |
| `music.js` | Synthesizes and schedules the looping chiptune soundtrack via the Web Audio API, with a mute toggle. |
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
- **Input handling:** keyboard (Space to flap, Shift to dash, `M` to mute)
  and pointer events (click/tap to flap, right-click to dash), each routed
  through `handleFlap()` / `handleDash()`.
- **Spawning:** `spawnObstacle()` places stack-trace obstacles at a fixed
  interval with a random gap position. `spawnBug()` places collectible bugs
  using a deterministic placement algorithm (`forbiddenBandsAt` /
  `freeSegments` / `pickFromSegments`) that computes the vertical bands
  blocked by nearby obstacles and samples only from the guaranteed-clear
  remainder, so a bug can never spawn somewhere unreachable.
- **Dash targeting:** `findNearestBug()` locates the closest uncollected bug
  so a dash can home in on it (see `Duke.dash` in `entities.js`).
- **High score:** persisted to `localStorage` via `loadHighScore()` /
  `saveHighScore()`, shown on the game-over overlay.
- **Update/draw loop:** `update(dt)` advances physics, collisions, and
  spawns each frame; `draw()` delegates all rendering to `render.js` and
  `narrator.js`.

### `entities.js`

Defines the game's data/physics objects as plain ES classes with no
rendering or DOM knowledge.

- **`Duke`** - the player character. Tracks position, vertical velocity,
  rotation (for tilt), and dash charges. `flap()` applies an upward
  velocity impulse; `dash(target)` lunges Duke forward, grants brief
  invincibility, and (if a target bug is passed) arcs Duke's vertical
  velocity to home toward it over the dash duration. `update(dt)` applies
  gravity, spring-eases Duke's x position back to its base lane after a
  dash, ticks down invincibility, and recharges dash charges over time.
  `hitsCircle` / `hitsRect` are the collision primitives used by
  `Obstacle` and `Bug`.
- **`Obstacle`** - a stack-trace wall with a vertical gap. Scrolls left at
  a constant speed; `collidesWith(duke)` checks the top and bottom solid
  rectangles against Duke's hitbox, ignoring collisions while Duke is
  invincible (mid-dash).
- **`Bug`** - a collectible. Scrolls left at a constant speed;
  `collidesWith(duke)` is a circle-circle check, and `collected` marks it
  consumed so it stops being drawn or checked.

All tunable physics constants (gravity, flap strength, dash lunge
distance/duration/charges) live at the top of this file.

### `render.js`

Pure drawing functions; every function takes a canvas context and the data
to draw, with no side effects on game state.

- `createCodeLines(width, height)` / `drawBackground(...)` - generate and
  draw the dark IDE-themed background once at load (gutter, line numbers,
  randomly colored syntax-token bars) and the ground strip.
- `drawObstacle(...)` - draws a stack-trace obstacle as two red "error
  panel" segments (accent bar, pseudo-code line fills via a seeded random
  generator so each obstacle's look is stable across frames) with a
  squiggly red hazard line at each gap edge.
- `drawBug(...)` - draws a bug as a green ellipse with leg lines and eye
  dots.
- `drawDuke(...)` - draws Duke as a canvas vector sprite (white cone body,
  black pointed hood, red eye, a static left arm and a right arm that waves
  continuously using `animTime`), with a glow effect while invincible.
- `drawHud(...)` - draws the score and dash-charge indicator dots during
  play.

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
primitive; `playFlap`, `playDash`, `playCollect`, `playHit`, and
`playGameOver` each call it with tuned frequencies/waveforms to produce a
distinct retro chip sound per event.

### `music.js`

The looping background chiptune soundtrack, also synthesized via Web
Audio (no audio files or libraries). Uses a lookahead scheduler
(`schedulerTimer` ticking every `LOOKAHEAD_MS`, scheduling notes
`SCHEDULE_AHEAD_SEC` ahead) for sample-accurate timing independent of
`requestAnimationFrame` jitter. Synthesizes its own kick, snare, hi-hat,
bassline, lead melody, and arpeggio chords as separate functions that
schedule oscillators/noise bursts at each 16th-note step. `startMusic()` /
`stopMusic()` are called by `game.js` on state transitions; `isMuted` is
persisted to `localStorage` and toggled by `toggleMusicMute()`
(`M` key or the on-screen mute button).

### `index.html` / `styles.css`

`index.html` holds the game canvas, the narrator overlay markup (its own
canvas plus a speech-bubble `<p>`), the mute button, and the start/retry
overlay panel. `styles.css` provides the dark IDE-inspired page theme, the
floating pill start/retry button, and narrator/overlay positioning.

### `scripts/play.js`

A small Node script backing `npm run play`: starts `npx serve .` on port
5173 and opens it in the default browser, for one-command local testing.
