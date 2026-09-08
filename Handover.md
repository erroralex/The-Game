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
  - Verified in-browser via claude-in-chrome: background/obstacle/bug
    rendering, dash-through-obstacle-into-bug homing, collision/game-over
    flow, and high-score persistence across a page reload all confirmed
    working, no console errors. Note: the automated browser tab throttles
    `requestAnimationFrame` (background-tab behavior), which made live
    "play through a full session" timing checks slow; a manual playtest
    with a focused tab is still worth doing for difficulty/feel.

## Next Steps
- Manual playtest with a normally focused browser tab to confirm difficulty
  feel now that obstacle spacing and bug placement changed (gravity, flap
  strength, gap/speed, spawn intervals are still first-pass-tuned values
  otherwise).
- Consider a title/logo treatment for polish.
- No automated tests exist yet (manual/browser verification only, per the
  Project header); add some if the game grows past a single demo session.
