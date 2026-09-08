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
  point), start/game-over overlay with retry. Verified end-to-end in a real
  browser via claude-in-chrome: flap, obstacle/bug spawn, scoring, collision,
  game-over, and retry all work.
- `drop-in-brain-main/` (the assembly kit) lives inside this project folder
  but is gitignored; it's assembly tooling, not part of the game.
- Added `package.json` (npm scripts only, no dependencies) and
  `scripts/play.js`: `npm run play` starts `serve` on port 5173 and opens
  the browser in one step. Backs a local-only IntelliJ run configuration
  ("Play Duke's Debug Dash" in `.idea/runConfigurations/`, gitignored per
  the project owner's choice to keep IDE config local rather than shared).
  A separate Compound run configuration was tried first and failed to start
  in this IntelliJ build; replaced with the single-script approach, which
  was verified working end-to-end via the IDE's own run tooling.
- Installed the GitHub CLI (`gh`) via winget (also missing on this machine)
  and authenticated via device code; repo is pushed to
  `https://github.com/erroralex/The-Game.git` on `main`. Git identity
  (`erroralex` / the project owner's email) is set locally to this repo,
  not globally.
- Redrew Duke as a canvas vector sprite (cone body, black hood, red eye,
  continuously waving arm) matching a reference Java mascot image the
  project owner dropped into `assets/` (gitignored; not wired into code,
  vectors only). Verified visually in-browser: wave animation and flight
  rotation both render correctly.

## Next Steps
- Playtest and tune difficulty (gravity, flap strength, obstacle gap/speed,
  spawn intervals) — current values are first-pass guesses, not tuned.
- Consider sound effects and a simple title/logo treatment for polish.
- No automated tests exist yet (manual/browser verification only, per the
  Project header); add some if the game grows past a single demo session.
