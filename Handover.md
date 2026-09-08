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

## Next Steps
- Manual playtest with audio unmuted to verify music volume balance against
  SFX during gameplay.
- Confirm difficulty feel now that obstacle spacing, bug placement, and dash
  reach changed (gravity, flap strength, gap/speed, spawn intervals).
- No automated tests exist yet (manual/browser verification only, per the
  Project header); add some if the game grows past a single demo session.
