# Redovisning: Duke's Debug Dash

## Vad är det här för spel?

Duke's Debug Dash är ett webbläsarspel i samma stil som Flappy Bird.
Man styr figuren Duke (Javas maskot) som flyger genom ett rör av
kodrader. Spelaren måste undvika röda "stack trace"-hinder, samla gröna
buggar för poäng, och kan använda en sköld för att rädda sig om man
krockar med ett hinder.

Spelet är byggt med bara HTML, CSS och JavaScript, helt utan ramverk
eller server. Allt ritas upp direkt i webbläsaren med hjälp av `<canvas>`,
som är ett HTML-element man kan rita grafik på med kod.

## Hur är koden uppdelad?

Koden är uppdelad i flera mindre filer, där varje fil sköter en egen
del av spelet. Det gör koden lättare att förstå och ändra:

- **`game.js`** - Hjärnan i spelet. Håller koll på allt som händer:
  poäng, var Duke är, vilka hinder och buggar som finns, samt vad som
  ska hända när man trycker på tangenter eller klickar.
- **`entities.js`** - Beskriver spelobjekten: Duke, hindren och
  buggarna. Här bestäms till exempel hur snabbt Duke faller, och hur
  krockar upptäcks.
- **`render.js`** - Ritar allt som syns på skärmen: bakgrunden, Duke,
  hindren, buggarna och poängen.
- **`sound.js`** och **`music.js`** - Skapar alla ljudeffekter och
  bakgrundsmusiken helt med kod (inga ljudfiler behövs).
- **`narrator.js`** - Ritar ut professorn som pratar med spelaren i
  start- och slutskärmen.
- **`index.html`** och **`styles.css`** - Sidans grundstruktur och
  utseende (färger, knappar, placering).

## Hur fungerar spelet rent tekniskt?

Spelet bygger på en **spel-loop**: en funktion som körs om och om
igen, ungefär 60 gånger per sekund. Varje gång den körs:

1. Duke flyttas nedåt lite grann (som gravitation).
2. Hinder och buggar flyttas åt vänster.
3. Koden kollar om Duke krockar med något.
4. Allt ritas upp igen på skärmen.

Detta kallas en `requestAnimationFrame`-loop och är ett standardsätt att
bygga spel och animationer i webbläsaren.

## De viktigaste spelmekanikerna

- **Flappa:** Tryck mellanslag eller klicka för att ge Duke en skjuts
  uppåt. Gravitationen drar honom sedan nedåt igen hela tiden.
- **Sköld:** Duke har 3 sköldladdningar som *inte* laddas om under
  omgången. Aktiveras med Shift, högerklick eller två-finger-tryck på
  mobil. Under en kort stund blir Duke osårbar och kan säkert krascha
  igenom ett hinder istället för att dö - hindret går sönder och tonas
  bort i grönt.
- **Poäng:** Man får 1 poäng per insamlad bugg och 0.25 poäng för varje
  hinder man tar sig förbi. Var 10:e poäng blir spelet lite svårare
  (allt rör sig snabbare, även musiken) och man hör ett extra roligt
  ljud.
- **Slumpmässiga hinder:** Ibland rör sig ett hinders öppning långsamt
  upp och ner, för att göra spelet lite svårare.
- **Highscore:** Sparas i webbläsaren (`localStorage`) så den finns kvar
  även om man laddar om sidan.

## Sammanfattning

Spelet är uppbyggt enligt en vanlig princip inom spelutveckling: skilj
på **vad som händer** (spelets regler och tillstånd, i `game.js` och
`entities.js`) och **hur det ser ut** (ritningen, i `render.js`). Det gör
det enkelt att till exempel ändra utseendet på ett hinder utan att
behöva röra koden som bestämmer om man krockat med det.
