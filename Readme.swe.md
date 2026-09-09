# Duke's Debug Dash

Ett webbläsarspel i Flappy Bird-stil: Javas maskot Duke flyger genom
stack-trace-hinder och dashar för att samla buggar och få poäng. Statisk
HTML5 Canvas + vanilla JavaScript (ES-moduler), inget byggsteg, ingen
backend.

Spela live på https://erroralex.github.io/The-Game/, eller kör lokalt med
`npx serve .` (se `AGENTS.md` för detaljer).

## Översikt

Appen består av ett litet antal ES-moduler, var och en med ett ansvar:

| Modul | Ansvar |
| --- | --- |
| `game.js` | Äger spelets tillstånd, update/draw-loopen, inmatningshantering, spawning och poängräkning. Huvudingången till appen. |
| `entities.js` | Definierar spelobjekten (`Duke`, `Obstacle`, `Bug`) samt deras fysik- och kollisionsregler. |
| `render.js` | Ritar bakgrund, hinder, buggar, Duke och HUD på canvasen. Ren rendering, inget tillstånd. |
| `narrator.js` | Ritar professorns overlay-bild på sin egen canvas. |
| `sound.js` | Syntetiserar korta ljudeffekter (flap, dash, samla, träff, game over) via Web Audio API. |
| `music.js` | Syntetiserar och schemalägger det loopande chiptune-soundtracket via Web Audio API, med mute-knapp. |
| `index.html` / `styles.css` | Sidstruktur, canvas-element, overlay/HUD-markup och all visuell styling. |

## Detaljer

### `game.js`

Huvudkontrollern. Kopplar upp DOM:en (canvas, overlay, knappar), håller det
föränderliga speltillståndet (`state`, `duke`, `obstacles`, `bugs`, `score`,
timers), och driver allt från en enda `requestAnimationFrame`-loop
(`loop` -> `update` -> `draw`).

Ansvarsområden:
- **Tillståndsmaskin:** tre tillstånd, `"start"`, `"playing"`, `"gameover"`,
  som byts via `startGame()` och `endGame()`.
- **Inmatningshantering:** tangentbord (mellanslag för att flappa, Shift
  för att dasha, `M` för att stänga av ljud) och pekhändelser
  (klick/tryck för att flappa, högerklick för att dasha), allt via
  `handleFlap()` / `handleDash()`.
- **Spawning:** `spawnObstacle()` placerar stack-trace-hinder med jämna
  mellanrum och slumpad gap-position. `spawnBug()` placerar samlarbuggar
  med en deterministisk placeringsalgoritm (`forbiddenBandsAt` /
  `freeSegments` / `pickFromSegments`) som räknar ut de vertikala band som
  blockeras av närliggande hinder och bara slumpar inom det garanterat
  fria utrymmet, så en bugg kan aldrig spawnas någonstans oåtkomligt.
- **Dash-målsökning:** `findNearestBug()` hittar närmaste ej insamlade
  bugg så att en dash kan styra mot den (se `Duke.dash` i `entities.js`).
- **Highscore:** sparas i `localStorage` via `loadHighScore()` /
  `saveHighScore()`, visas på game over-overlayen.
- **Update/draw-loop:** `update(dt)` uppdaterar fysik, kollisioner och
  spawning varje bildruta; `draw()` delegerar all rendering till
  `render.js` och `narrator.js`.

### `entities.js`

Definierar spelets data-/fysikobjekt som vanliga ES-klasser utan
rendering- eller DOM-kunskap.

- **`Duke`** - spelarkaraktären. Håller position, vertikal hastighet,
  rotation (för lutning) och antal dash-laddningar. `flap()` ger en
  uppåtgående hastighetsimpuls; `dash(target)` rusar Duke framåt, ger
  kort osårbarhet och (om en målbugg skickas med) böjer Dukes vertikala
  hastighet för att styra mot den under dashens varaktighet. `update(dt)`
  applicerar gravitation, fjäderdämpar Duke tillbaka till hans
  standard-x-position efter en dash, räknar ner osårbarheten och laddar
  om dash-laddningar över tid. `hitsCircle` / `hitsRect` är
  kollisionsprimitiverna som används av `Obstacle` och `Bug`.
- **`Obstacle`** - en stack-trace-vägg med ett vertikalt gap. Rullar åt
  vänster med konstant hastighet; `collidesWith(duke)` kontrollerar de
  övre och nedre solida rektanglarna mot Dukes hitbox, men ignorerar
  kollisioner medan Duke är osårbar (mitt i en dash).
- **`Bug`** - ett samlarobjekt. Rullar åt vänster med konstant hastighet;
  `collidesWith(duke)` är en cirkel-mot-cirkel-kontroll, och `collected`
  markerar den som insamlad så att den slutar ritas och kontrolleras.

Alla justerbara fysikkonstanter (gravitation, flap-styrka,
dash-avstånd/varaktighet/laddningar) finns högst upp i den här filen.

### `render.js`

Rena ritfunktioner; varje funktion tar en canvas-kontext och den data som
ska ritas, utan sidoeffekter på speltillståndet.

- `createCodeLines(width, height)` / `drawBackground(...)` - genererar
  och ritar den mörka IDE-inspirerade bakgrunden en gång vid start
  (marginal, radnummer, slumpmässigt färgade syntax-token-staplar) samt
  markremsan.
- `drawObstacle(...)` - ritar ett stack-trace-hinder som två röda
  "felpanel"-segment (accentstapel, pseudokodrader via en seedad
  slumpgenerator så att varje hinders utseende är stabilt mellan
  bildrutor) med en vågig röd farolinje vid varje gap-kant.
- `drawBug(...)` - ritar en bugg som en grön ellips med benlinjer och
  ögonprickar.
- `drawDuke(...)` - ritar Duke som en vektorsprite på canvasen (vit
  konformad kropp, svart spetsig luva, rött öga, en statisk vänsterarm
  och en högerarm som viftar kontinuerligt med hjälp av `animTime`), med
  en glow-effekt medan han är osårbar.
- `drawHud(...)` - ritar poäng och dash-laddningsindikatorer under spel.

### `narrator.js`

Ritar professorns overlay-bild på sin egen dedikerade canvas
(`narrator-canvas` i `index.html`). Laddar PNG-bilden en gång vid
modulladdning och gör ingenting förrän den är klar; `drawNarrator(ctx,
width, height)` anropas av `game.js` på start- och game over-skärmarna.
Pratbubblans text är vanlig DOM-text som sätts direkt av `game.js`, inte
ritad på den här canvasen.

### `sound.js`

Korta ljudeffekter syntetiserade med Web Audio API, inga ljudfiler.
`getContext()` skapar lat (och återupptar, om den pausats av
autoplay-policy) en delad `AudioContext`, som även återanvänds av
`music.js`. `playTone(freq, duration, options)` är den delade
oscillator+gain-primitiven; `playFlap`, `playDash`, `playCollect`,
`playHit` och `playGameOver` anropar den var och en med anpassade
frekvenser/vågformer för att skapa ett distinkt retro-chip-ljud per
händelse.

### `music.js`

Det loopande bakgrundschiptunet, också syntetiserat via Web Audio (inga
ljudfiler eller bibliotek). Använder en lookahead-schemaläggare
(`schedulerTimer` som tickar var `LOOKAHEAD_MS`, och schemalägger noter
`SCHEDULE_AHEAD_SEC` framåt) för sampelexakt timing oberoende av
`requestAnimationFrame`-jitter. Syntetiserar sin egen kick, snare, hi-hat,
basgång, ledmelodi och arpeggio-ackord som separata funktioner vilka
schemalägger oscillatorer/brusutbrott vid varje 16-delsslag.
`startMusic()` / `stopMusic()` anropas av `game.js` vid
tillståndsövergångar; `isMuted` sparas i `localStorage` och växlas med
`toggleMusicMute()` (`M`-tangenten eller mute-knappen på skärmen).

### `index.html` / `styles.css`

`index.html` innehåller spelcanvasen, narrator-overlayens markup (sin
egen canvas plus en pratbubbel-`<p>`), mute-knappen och
start/retry-overlaypanelen. `styles.css` ger det mörka
IDE-inspirerade sidtemat, den svävande piller-start/retry-knappen samt
narrator-/overlay-positionering.

### `scripts/play.js`

Ett litet Node-skript bakom `npm run play`: startar `npx serve .` på port
5173 och öppnar det i standardwebbläsaren, för lokal testning i ett
kommando.
