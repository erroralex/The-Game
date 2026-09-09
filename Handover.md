# Handover

## Overview
Duke's Debug Dash: a Flappy Bird-style browser game. Java's Duke mascot flies
through stack-trace obstacles and dashes to collect bugs for score. Static
HTML5 Canvas + vanilla JS, no build step, no backend.

## Recent Changes
- Project scaffolded from the drop-in-brain starter kit (archetype G: static
  frontend-only game, no backend addon fits). AGENTS.md/CLAUDE.md/.claude
  wired up; `frontend-core` addon applied; `ai-setup-doctor`,
  `frontend-design`, `web-design-guidelines` skills installed.
- Removed a leftover empty Maven/IntelliJ skeleton (pom.xml, .mvn, src/) that
  predated this game and had no code in it.
- Installed Node.js LTS via winget (was missing on this machine); needed for
  `npx serve` (run command) and `npx skills add` (skill installs).
- Built the playable core loop: `index.html` + `styles.css` + `game.js` +
  `entities.js`. Duke (flap on Space/click, dash on Shift/right-click, 3
  charges regenerating over time), stack-trace wall obstacles (game over on
  collision, dash grants brief invincibility), collectible bugs (each = 1
  point), start/game-over overlay with retry.
- Added `package.json` (npm scripts only, no dependencies) and
  `scripts/play.js`: `npm run play` starts `serve` on port 5173 and opens
  the browser in one step. Backs a local-only IntelliJ run configuration
  ("Play Duke's Debug Dash" in `.idea/runConfigurations/`, gitignored per
  the project owner's choice to keep IDE config local rather than shared).
- Installed the GitHub CLI (`gh`) via winget (also missing on this machine)
  and authenticated via device code; repo is pushed to
  `https://github.com/erroralex/The-Game.git` on `main`. Git identity
  (`erroralex` / the project owner's email) is set locally to this repo,
  not globally. `gh` and `npx serve`/`gh` binaries can be stale in
  already-running shells after a winget install refreshes the machine PATH;
  restart the shell/IDE if `gh` or similar suddenly "isn't found".
- Redrew Duke as a canvas vector sprite (cone body, black hood, red eye,
  continuously waving arm) matching a reference Java mascot image the
  project owner dropped into `assets/` (gitignored; not wired into code,
  vectors only).
- Gameplay/presentation pass:
  - **Dash homing:** `Duke.dash(target)` (`entities.js`) now sets vertical
    velocity to arc toward a target's `y` over the dash's invincibility
    window; `game.js` passes the nearest uncollected bug so dashing steers
    Duke toward it.
  - **Bug/obstacle spacing:** replaced an earlier random-retry bug placement
    (which could occasionally place a bug unreachably close to an obstacle)
    with a deterministic algorithm in `game.js`
    (`forbiddenBandsAt`/`freeSegments`/`pickFromSegments`): it computes the
    exact vertical bands blocked near any nearby obstacle and samples only
    from the guaranteed-clear remainder. Verified via ad hoc scripted math
    checks (100k adversarial trials, 0 failures; a realistic-timing
    simulation of ~31k spawns, 0% "no free spot" cases).
  - **Obstacle pacing:** `OBSTACLE_INTERVAL` raised from 1.5s to 1.8s for
    more horizontal breathing room between obstacles.
  - **Visuals:** split rendering out of `game.js` into a new `render.js`
    (keeps `game.js` focused on state/input/loop). Background is now a dark
    IDE theme (gutter, line numbers, faint syntax-colored token bars,
    generated once at load). Obstacles render as red "error stack" panels
    (accent bar, pseudo-code line fills, squiggly red hazard underline at
    the gap edge) instead of plain rectangles.
  - **Sound:** new `sound.js` synthesizes short square/triangle/sawtooth
    Web Audio tones for flap, dash, bug collect, hit, and a descending
    game-over jingle. No external assets/dependencies (real MIDI file
    playback would need a soundfont library, which conflicts with the
    project's no-trivial-dependencies rule).
  - **High score:** persisted to `localStorage`
    (`dukesDebugDash.highScore`), shown on the game-over overlay as
    "Best: N" with a "(new high score!)" flag when beaten.
  - **Retro Soundtrack:** added `music.js` synthesizing a high-energy 16-bit
    chiptune soundtrack inspired by Mega Man X (150 BPM in E minor, driving
    16th-note synth bassline, pitch-drop kick, bandpass-filtered noise snare,
    hi-hats, heroic lead melody, and rhythmic arpeggio chords). Uses a Web
    Audio lookahead scheduler for sample-accurate timing with zero external
    dependencies. Starts on game start/retry, halts gracefully on game over,
    and includes an in-game mute toggle button plus keyboard shortcut (`M`)
    persisted in `localStorage`.
  - **Dash reach:** doubled `DASH_LUNGE` (55 -> 110 in `entities.js`); the
    homing dash felt too short-ranged to reliably reach a bug.
  - **Professor narrator:** added a large full-body character overlay drawn
    directly on the game canvas, presenting the game on the start screen and
    reporting score/high score on game over via a speech-bubble caption
    (`narrator.js`, wired into `game.js`/`index.html`/`styles.css`). Source
    art is `assets/Gemini_Generated_Image_potvyfpotvyfpotv.png` (goatee
    baked into the generated art itself); its white background was removed
    with a flood-fill run once via a scratch PowerShell/C# script (seeded
    from the image borders so interior whites like teeth/shirt stayed
    opaque), not part of the build. Un-ignored specifically in `.gitignore`
    (same pattern as the earlier `professor-talking.png`, which is now
    unused but left on disk). Replaced the old procedurally-drawn stubble
    goatee approach entirely (that code is gone from `narrator.js`). Also
    removed the redundant title/instructions text from the white start/
    game-over overlay panel (now just the Start/Retry button) since the
    speech bubble carries that messaging.
  - **Overlay contrast fix:** the `.overlay` dim scrim
    (`rgba(10,15,25,0.55)`) sat on top of the narrator and washed out the
    character's colors; removed it. The white `.panel` card behind
    Start/Retry was also oversized for a single button; replaced with a
    compact floating pill button (drop shadow for contrast, no card
    background), anchored near the bottom of the stage instead of centered
    over the character's torso.
  - Verified in-browser via claude-in-chrome: background/obstacle/bug
    rendering, dash-through-obstacle-into-bug homing, collision/game-over
    flow, high-score persistence across a page reload, and the narrator
    overlay on both start and game-over screens all confirmed working, no
    console errors. Note: the automated browser tab throttles
    `requestAnimationFrame` (background-tab behavior), which made live
    "play through a full session" timing checks slow; a manual playtest
    with a focused tab is still worth doing for difficulty/feel.

## Deployment
- Hosted on GitHub Pages, serving `main` from the repo root; no build step
  or path changes were needed since `index.html` already uses relative
  asset/script paths. Confirmed live and working at
  https://erroralex.github.io/The-Game/

## UI Fixes (narrator/mute, mobile dash)
- **Mute button:** moved out of the canvas overlay into a new `.header` row
  next to the `<h1>` title (`index.html`/`styles.css`); no longer absolutely
  positioned on top of the game canvas.
- **Narrator/speech bubble layout:** switched `.narrator` from a flex row to
  absolute positioning so the professor and bubble are placed independently
  instead of the bubble being squeezed into his leftover width. Professor
  (`.narrator-canvas`) is anchored bottom-left at 74% of stage height, sized
  up from the original 96%-of-stage flex layout in a couple of iterative
  passes against the project owner's screenshots. Bubble (`.speech-bubble`)
  is anchored top-right (`top: 4%; right: 4%; width: 74%`), with a
  `clip-path` triangle tail (`::after`) attached flush to its bottom-left
  corner (no border-trick seam) angled down-left toward the professor's
  face. Bubble text now uses `<strong>` for emphasis (styled via
  `.speech-bubble strong`), and the game-over message in `game.js` builds
  the same bold markup via `innerHTML` (safe: only numeric score/high-score
  values are interpolated, never user input).
  - Tuned entirely from the project owner's screenshots since the
    claude-in-chrome browser extension was not connected this session (kept
    reporting "not connected" across `tabs_context_mcp` calls); positioning
    numbers (`top`/`right`/`width`/tail `left`) are a best estimate and may
    need another visual pass once the extension is available or on a fresh
    manual look.
- **Touch dash:** added a two-finger-tap dash gesture for mobile, since
  dash previously had no touch equivalent (only right-click/Shift). In
  `game.js`, `canvas` pointerdown tracks active touch pointer IDs in a
  `Set`; a single touch schedules a flap after a `TOUCH_FLAP_DELAY` (60ms)
  grace period, and if a second finger lands within that window the flap is
  canceled and a dash fires instead. Mouse clicks/right-clicks are
  unaffected (instant, no delay). Added `touch-action: none` on the canvas
  so the browser doesn't intercept the second finger for pinch-zoom/scroll.
  Hint text in `index.html` updated to mention it.

## Bug Fixes
- **Music silent after Retry:** `stopMusic()` (`music.js`) ramps the shared
  `musicGain` node's gain to 0 over 50ms on game over, but `startMusic()`
  never restored it. Since `getMusicGain()` only initializes the gain node
  `if (!musicGain)`, the same node (still scheduled at 0) was reused on
  every subsequent `startMusic()`, so the soundtrack kept scheduling and
  playing, just silently, on every Retry after the first game over. Fixed
  by having `startMusic()` cancel any scheduled ramp and reset the gain to
  `isMuted ? 0 : 0.22` each time it starts.
  - **Status:** the project owner reported music was still silent after
    Retry even after this fix was pushed (commit `67943a4`). Re-read the
    fix and the logic looks correct (verified no other `startMusic`/
    `stopMusic`/`getMusicGain` definitions exist, and the gain-reset
    ordering is sound). Not yet reproduced or disproven, since
    claude-in-chrome could not connect this session. Leading theories:
    stale GitHub Pages CDN cache at the moment they tested (most likely,
    given the timing), or a real second bug not yet found. **Needs a
    fresh manual check** (hard refresh on `localhost:5173`, check the
    DevTools console for errors on Retry) before considering this closed.

## Difficulty Ramp (oscillating obstacles, milestones)
- **Oscillating obstacles:** every 3-5 obstacles (randomized per-gap via
  `randInt(OSCILLATE_MIN_GAP, OSCILLATE_MAX_GAP)` in `game.js`), the next
  spawned obstacle's gap drifts up and down on a sine wave
  (`Obstacle.update` in `entities.js`: `gapY = baseGapY + sin(time *
  angularSpeed + phase) * amplitude`, amplitude 45px, angular speed
  0.7-1.1 rad/s, random phase so multiple oscillating obstacles don't
  sync). `collidesWith` already reads `gapY` live each frame so collision
  detection just works; `render.js`'s `drawObstacle` was changed to seed
  its pseudo-code panel pattern from a fixed `obstacle.seed` (captured at
  spawn) instead of the live `gapY`, so an oscillating obstacle's panel
  no longer flickers as its gap moves.
  - **Bug-placement safety:** the existing deterministic bug-placement
    algorithm (`forbiddenBandsAt` in `game.js`) assumed a fixed `gapY` per
    obstacle. Changed it to use each obstacle's `minGapY`/`maxGapY` (its
    full oscillation range, precomputed at spawn in `entities.js`) instead
    of its instantaneous `gapY`, so a bug spawn stays clear of the gap no
    matter where the oscillation currently is. Re-verified the "no bug
    spawns somewhere unreachable" guarantee with a new adversarial
    simulation (100k trials, ~25% of obstacles oscillating, checking
    collision at 500 time steps across each bug's full lifetime): 0
    failures. Simulation script was scratch-only, not committed.
- **Milestone every 10 points:** collecting a bug that makes `score` a
  multiple of `MILESTONE_SCORE_STEP` (10) plays a distinct ascending
  arpeggio (`playMilestone()` in `sound.js`, a C5-E5-G5-C6 major arpeggio)
  instead of the normal collect chime, and bumps `currentObstacleSpeed`/
  `currentBugSpeed` by `MILESTONE_SPEED_FACTOR` (5%). The bump is applied
  to every obstacle and bug **currently on screen** as well as future
  spawns (`game.js`, in the collision loop), not just future spawns alone
  - this matters because the bug-placement algorithm's safety guarantee
    depends on all concurrently-existing obstacles/bugs moving at the
    same speed; bumping only future spawns would let an old, slower
    obstacle and a new, faster bug drift out of their assumed relative
    positions.

## Music tempo ramp, obstacle scoring, HUD cleanup
- **Music speeds up with difficulty:** `music.js`'s `STEP_TIME` const
  became a mutable `stepTime` (initialized from `BASE_STEP_TIME`, reset in
  `startMusic()` so tempo starts fresh each game). New exported
  `increaseMusicTempo(factor)` divides `stepTime` by `factor`, called from
  `game.js`'s `triggerMilestone()` with the same `MILESTONE_SPEED_FACTOR`
  used for obstacle/bug scroll speed, so the soundtrack speeds up in step
  with the rest of the difficulty ramp every 10 points.
- **Removed the dash-charge "coin" indicator:** the project owner flagged
  three gold circles in the HUD as confusing clutter ("three golden
  coins"). These were the dash-charge indicators in `render.js`'s
  `drawHud` (three dots, `#ffb703` gold when a dash charge is ready,
  dim otherwise). Removed the drawing code; `drawHud` now only draws the
  score and takes a pre-formatted `scoreLabel` string instead of the raw
  `duke` object. Dash charges still work exactly as before as a game
  mechanic (`Duke.dashCharges` in `entities.js`), only their on-canvas
  visualization is gone. Also dropped the now-unused `DASH_MAX_CHARGES`
  import from `render.js`.
- **Obstacles award 0.25 points on pass:** `Obstacle` (`entities.js`)
  gained a `scored` flag; in `game.js`'s `update()`, once an obstacle's
  right edge passes Duke's x position (and it hasn't already scored),
  `addScore(OBSTACLE_PASS_SCORE)` (0.25) fires - same score pool as bug
  pickups, same `highScore`/HUD/milestone system.
  - Introduced a shared `addScore(amount)` / `triggerMilestone()` pair in
    `game.js` to replace the old inline `score % MILESTONE_SCORE_STEP ===
    0` check. That equality check would have missed milestones crossed by
    a whole-point bug pickup landing past a boundary rather than exactly
    on it (e.g. 9.75 + 1 = 10.75, never exactly 10) - `addScore` instead
    compares `Math.floor(score / MILESTONE_SCORE_STEP)` before and after
    the increment, so a crossing is detected regardless of the exact
    landing value. (0.25 and 1 are both exactly representable in binary
    floating point, so no rounding-drift concerns from accumulating
    fractional score.)
  - Score can now be fractional, so the HUD and game-over text use a new
    `formatScore()` helper (whole numbers print bare, fractional ones as
    `toFixed(2)`) instead of the old bare `${score}`/`String(score)`. The
    game-over message's wording also changed from "Score: X bug(s)" to
    "Score: X points", since the score no longer only represents bugs
    collected.

## Next Steps
- **Verify the music-restart fix** (see Bug Fixes above) with a fresh
  manual check; not yet confirmed working after the project owner's report
  that it was still silent post-fix.
- Reconnect claude-in-chrome (or do a manual pass) to verify the narrator
  bubble/tail positioning and the two-finger dash gesture on an actual
  touch device; current values are untested beyond the desktop screenshots
  the project owner shared.
- Manual playtest with audio unmuted to verify music volume balance against
  SFX during gameplay, and to feel out the new oscillating obstacles and
  the every-10-points speed ramp (numbers are a first guess, untested by
  a human hand).
- Confirm overall difficulty feel now that obstacle spacing, bug placement,
  dash reach, oscillation, and the speed ramp have all changed (gravity,
  flap strength, gap/speed, spawn intervals).
- No automated tests exist yet (manual/browser verification only, per the
  Project header); add some if the game grows past a single demo session.
