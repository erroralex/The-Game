# Agent Instructions

<!-- ===== PROJECT (fill in, delete unused lines) ===== -->
## Project

- **Name:** The Game (Duke's Debug Dash)
- **Purpose:** A Flappy Bird-style browser game: Java's Duke mascot flies through stack-trace obstacles and dashes to collect bugs for score.
- **Stack:** Static HTML5 Canvas + vanilla JavaScript (ES modules), no build step, no backend.
- **Build:** none (static files, no compilation)
- **Test:** manual/browser-based (no automated test suite for this scope)
- **Run locally:** `npx serve .` from the project root, then open the printed localhost URL
  (or the "Play Duke's Debug Dash" compound run configuration in `.idea/runConfigurations/`,
  which starts the server on port 5173 and opens it in the browser)

## Workflow

- Before non-trivial changes: state your plan in 2-5 bullet points, then implement.
  If requirements are ambiguous, ask; don't guess.
- Work in small, verifiable steps. One logical change at a time.
- Write or update the test for a behavior change **before** the code (TDD); see
  Testing below.
- Before claiming anything works: run the test/build command and show the result.
  "Should work" is not done; verified is done.
- When a task touches unfamiliar code, read the surrounding files first and follow
  the patterns already there.
- Check `.agents/skills/` for an applicable skill before starting specialized work
  (framework setup, UI design, reviews); use it if its description matches the task.
- Scratch documents (plans, code-review reports, SonarQube findings, design notes)
  go under `docs/<type>/` (e.g. `docs/plans/`, `docs/reviews/`, `docs/sonarqube/`,
  `docs/design/`); gitignored, never committed. Name each file
  `<type>-<slug>-YYYY-MM-DD.md` (e.g. `docs/sonarqube/sonarqube-review-2026-08-24.md`).

## Engineering rules

- **YAGNI:** build what the task needs, nothing speculative. No extra config options,
  abstraction layers, or "flexibility" that wasn't asked for.
- **DRY, but not premature:** extract shared code on the third occurrence, not the
  second. Duplication is cheaper than the wrong abstraction.
- **Single responsibility:** one reason to change per class/module/function. If a file
  needs "and" to describe what it does, split it.
- **Depend on interfaces at boundaries** (service ↔ persistence, domain ↔ external
  APIs); don't interface-ify everything else.
- Keep functions short and files focused. A file approaching ~300 lines is a signal
  to split.
- Prefer boring, idiomatic solutions over clever ones. Optimize only with a
  measurement in hand.
- Fail fast: validate inputs at system boundaries, throw early with specific messages,
  never swallow exceptions silently.

## Testing

- Write the test before the implementation: red, then green, then refactor.
- Every bugfix gets a regression test that fails before the fix and passes after.
- Test behavior through public interfaces, not implementation details.
- Never delete, skip, or weaken a test to make a change pass. If a test seems wrong,
  say so and ask.
- Tests must be deterministic: no sleeps for synchronization, no order dependence,
  no shared mutable state between tests.

## Git

- Small commits, one logical change each. Imperative subject line ≤ 72 chars;
  body explains *why* when it isn't obvious.
- Before committing: create or update `Handover.md` at the project root with the
  latest changes, context, and clear next steps. Keep it relevant, clean, and free of stale logs.
- **No AI attribution anywhere in git:** no `Co-Authored-By` trailers naming an AI,
  no "Generated with ..." lines in commit messages, PR descriptions, or code
  comments. Commits carry the human author's identity only.
- Never commit secrets, credentials, or generated artifacts.
- Never force-push or rewrite history on shared branches.

## Writing

- No em dashes (—) in code, comments, commit messages, or prose. Use a period,
  comma, or parentheses instead.

## Security

- No secrets in code or config files. Use environment variables or a secret manager.
- All user input is untrusted: validate at the boundary, use parameterized
  queries/bound parameters, escape output in templates.
- Don't add dependencies for trivial tasks; when adding one, prefer well-maintained,
  widely-used libraries.

<!-- ===== ADDONS: append per-tech sections from starter-kit/addons/ below ===== -->
## Frontend core (HTML / CSS / JavaScript)

> Skills: `.agents/skills/frontend-design/` for building distinctive UI;
> `.agents/skills/web-design-guidelines/` for auditing existing UI.

- Semantic HTML first: native elements (`button`, `nav`, `dialog`, `details`) before
  div+JS reimplementations. Heading levels in order; one `h1` per page.
- Accessibility is not optional: every input has a `label`; interactive elements are
  keyboard-reachable with visible focus; images have meaningful `alt` (or empty for
  decorative); color contrast ≥ WCAG AA; ARIA only when no native element fits.
- Responsive = mobile-first: base styles for small screens, `min-width` media queries
  upward; relative units (`rem`, `%`) over fixed px for layout; test at 320px,
  768px, 1280px.
- CSS: design tokens as custom properties (colors, spacing, type scale) defined once;
  prefer flexbox/grid over floats and absolute positioning; avoid `!important` and
  deep selector chains; co-locate component styles.
- JavaScript: ES modules; `const`/`let`, never `var`; `async/await` with explicit
  error handling over raw promise chains; `fetch` with status checks (a 404 does not
  reject); no jQuery in new code.
- Forms: validate client-side for UX, **always** revalidate server-side; disable the
  submit button while a request is in flight; show field-level errors.
- Escape user content rendered into the DOM: `textContent` over `innerHTML`;
  if HTML insertion is unavoidable, sanitize.
- Performance basics: `defer` scripts; set width/height (or aspect-ratio) on images;
  lazy-load below-the-fold images; don't ship a framework for a static page.
