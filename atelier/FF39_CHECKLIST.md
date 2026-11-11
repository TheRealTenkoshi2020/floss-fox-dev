# Floss Fox 3.9 "Stitching Atelier": FF39 scope checklist

Branch `feat/atelier-3.9` (from dev main 1115742). Production `floss-fox` main 6aa04f1 (3.8) is untouched.
Status words: not started / in progress / delivered / blocked-external / needs Myke decision.
"Delivered" means integrated on this branch with passing unit + E2E tests (simulated browser), Pixel sign-off where visual,
and is never claimed from Samira's isolated reference tests. Nothing here is dropped; descoping needs Myke's words.

| ID | Feature | Pri | Stage | Owner | Status | What exists in dev today | Tests (planned / done) |
|---|---|---|---|---|---|---|---|
| FF39-01 | Workbasket / Your Stitching Corner | P0 | B | Mouse (Pixel mockup) | in progress (Stage B UI built + tested; provisional styling, awaiting Pixel sign-off) | Workbasket tab (hidden for fresh visitors), newest active project card, palette strip, leftOff, plan stats, quick links | atelier_stageb_e2e.py s1-2b, s7-9 (B, done) |
| FF39-02 | Universal search | P0 | A core, B UI | Mouse (Pixel mockup) | in progress (Stage B UI built + tested; awaiting Pixel sign-off) | Search panel: Ctrl/Cmd+K, combobox/listbox, colors / My threads / projects, BLANC/WHITE/B5200 distinct + note, refresh on ff:data-saved, in memory only | atelier_unit.cjs search block (A); atelier_stageb_e2e.py s5 (B, done) |
| FF39-03 | Micro-interactions, layout steadiness | P1 | D | Pixel design, Mouse | not started | theme-pair.css tokens, reduced-motion rules | atelier_themes_e2e.py (D) |
| FF39-04 | Appearance choices (System / Morning Linen / Forest Twilight / Moonlit Threads) | P1 | A pref, D UI | Pixel tokens, Mouse | in progress (pref field + validation only) | theme-pair.css light/dark via prefers-color-scheme only; no manual override | prefs tests (A, done); themes e2e + contrast (D) |
| FF39-05 | Floss swatches + palette strips | P1 | A core, D UI | Pixel design, Mouse | in progress (palette core done) | flat chips using DMC hex | palette tests (A, done); gallery e2e (D) |
| FF39-06 | Saved location + preferences, reset | P0/P1 | A core, B UI | Mouse | in progress (Stage B: opt-in Resume + Reset settings built + tested) | Settings card: Resume where I was (OFF by default), Reset settings (removes only the pref key, never projects/threads); precedence safety > URL hash > onboarding > resume; deleted project falls back to Projects list | prefs tests (A); atelier_stageb_e2e.py s3-4 (B, done) |
| FF39-07 | Accessibility + performance budget | P0 | every stage, H audit | Mouse, Pixel | in progress (search perf bound in unit test) | contrast.js, 44px work in flow-pass | per-stage e2e + H audit |
| FF39-08 | Recent conversions + explicit Add actions | P0/P1 | A core, C/D UI | Mouse | in progress (recentConversions in prefs) | converter UI; threads add; projects add | prefs tests (A, done); color studio e2e |
| FF39-09 | Rich comparison surface | P1 | D | Pixel design, Mouse | not started | pCmp compare, exact/close/estimated labels | color studio e2e (D) |
| FF39-10 | Quick quantities (+/-, Undo, verified save) | P0 | B (pulled forward) / C polish | Mouse | in progress (Stage B: verified save, Undo of latest step, rollback on failed save) | threads.js stepper: readback-verified save, Undo button (only if entry unchanged), failed write restores the previous count and says Not saved | atelier_stageb_e2e.py s6 (B, done); visible pending state (C) |
| FF39-11 | Collection views, sorting, low-stock filter | P1 | C/D | Mouse (Pixel shelf look) | not started | list view, storage location (schema 2), `restock` flag | collection e2e (C) |
| FF39-12 | Low-stock suggestions (explicit Add / Not now) | P1 | C | Mouse | not started | `restock` flag per thread already exists | low-stock e2e (C) |
| FF39-13 | Gallery cards, palette colors, optional cover photo | P1/P2 | D gallery, G media | Mouse, Pixel | decided by Myke, not started: "Make one backup file that includes the photos" | project list (no gallery) | gallery e2e (D), media backup e2e (G) |
| FF39-14 | Progress clarity, manual % ring, completion once | P1 | E | Mouse, Pixel | not started (mockups landed: mockups/progress.html, contact-progress.png; copy in COPY.md) | status planning/ready/progress/done | projects e2e (E): number always shown as text, aria '35% done, your own estimate', no ring when unset, 100% never auto-completes |
| FF39-15 | Continue where I left off | P0 | B | Mouse | in progress (Stage B: Continue project opens the project and focuses the Where I left off note) | Workbasket shows leftOff or a prompt; Add a note button | atelier_stageb_e2e.py s2 (B, done) |
| FF39-16 | Stitch Session focus mode | P1/P2 | E | Mouse, Pixel layout | not started (mockups: mockups/timer.html, contact-timer.png) | none | session e2e (E): timer OFF by default, never saved, never in backups; wall-clock elapsed from a start timestamp while the page is open (keeps counting when the tab is hidden), resets when the page closes, no rewards, never touches stitch counts or inventory |
| FF39-17 | In-store checklist (one checkbox per line) | P0 | A core, C UI | Mouse | in progress (store-visit core done) | per-project Store mode in projects.js (store-mode-core.js), shop/ui.js merchant groups | store tests (A, done); atelier_shop_e2e.py (C) |
| FF39-18 | Printable / shareable list | P0 | A core, C UI | Mouse | in progress (privacy-safe shareText) | Print list + Copy in shop/ui.js | store tests (A, done); share e2e (C) |
| FF39-19 | Bought vs owned reconciliation | P0 | C | Mouse | not started | Mark bought (purchased map), "I received this thread" check-in, Add from projects + Undo | no-inventory-mutation e2e (C) |
| FF39-20 | Fabric diagram + presets + cut slip | P1 | E | Mouse, Pixel layout | not started | fabric/calc.js compute() (design.w/h, cut.w/h), fabric/ui.js prefs + print/copy | atelier_fabric_e2e.py (E) |
| FF39-21 | Contextual Pip reactions | P0/P1 | F | Pixel lines, Mouse events | not started | FlossFoxPip.react(key,vars,anchor,opts), levels, cooldowns, pip-follow single companion | atelier_pip_e2e.py (F) |
| FF39-22 | Seasonal optional adornments | P2 | core now, F wiring | Pixel art (Myke generates), Mouse | in progress: mapping APPROVED (relayed via Pixel); date core `atelier/atelier-seasonal-core.js` built + unit-tested (not loaded yet); art not made, so missing/failed images fall back to standard Pip; toggle default + visibility, hemisphere, 4 vs 6 images, dark variants still open (SEASONAL-PLAN.md questions) | `seasonalPip` pref field (A, OFF) | atelier_unit.cjs seasonal block (done: season edges, leap day, Dec 31-Jan 2 wrap, Jul 29-31 inside summer, local-date edges, toggle/Pip Off/Quiet/missing art); pip e2e (F) |
| FF39-23 | UX copy + visual consistency | P1 | D-F | Pixel, Mouse | not started | Fraunces/Nunito self-hosted, no em dash rule | copy scans each stage |
| FF39-24 | Trust and continuity | P0 | A-H | Mouse | in progress (first-visit fix done; Stage B tab visits byte-identical, prefs never in backups) | all 3.8 safety systems | atelier_first_visit_e2e.py + atelier_unit landing/resume blocks; atelier_stageb_e2e.py byte-identical checks; full regression each stage |
| FF39-25 | Leave a review button | P0 | external | Myke (form URL) | blocked-external | draft PR 17 (review.js, REVIEW_FORM_URL empty, hidden) | review_button_e2e.py (in PR 17) |

## Copy status (dev only, all DRAFT until Myke approves at owner review)
- String source for wiring: Pixel's /workspace/pip-art/atelier39/copy/copy.json (302 strings after Pixel's Stage B updates), flagged draft.
- Relayed as Myke's choice for dev: dashboard name "Workbasket"; Pixel's starred Pip line per event; receipt copy: the "in your threads"
  line only on the confirmed "I received it" step, "Mark bought" uses the project-only line. Shown again at owner review.
- Still pending Myke: two privacy lines, "Compare chart matches", seasonal accessories toggle visibility, pose swap, cover-photo warning variant.
- Applied in Stage A: store-visit core uses shop.group.other, shop.boughtNote, share.header/line/none/footer (no em dash, no color names).

## Decisions recorded (Stage B)
- (6) Low stock: "Add to shopping list" sets the existing per-thread `restock` flag; Shop gets a "Restock for My threads" section.
  Explicit Add / Not now, never automatic. Build in Stage C.
- (7) Per FF39-19: a confirmed "I received it" adds full skeins to My threads (increments an existing count, creates the color if missing),
  verified save + Undo. Never on "Mark bought". Build in Stage C.
- (8) Theme and other preferences (`<prefix>.atelier.v1`) stay OUT of backups and snapshots as disposable preference state. Documented here;
  Reset settings removes only that key.
- FF39-13 (Myke): "Make one backup file that includes the photos". Stage G plan: cover photos in IndexedDB (downscaled, EXIF stripped,
  size-capped); Download backup becomes one file carrying the photo bytes with a versioned manifest, checksums and size limits; it must still
  import every older JSON backup; older app versions importing a new backup must not break (same JSON structure, optional media section that
  old importers ignore, verified by test); restore does readback verification with rollback for media; automatic copies exclude media (documented).
- FF39-22 (Myke): seasonal Pip art is required in 3.9. Seasonal switch with graceful fallback to standard Pip if art is missing; Pixel supplies
  transparent seasonal poses. Stage F.
- Moonlit Threads becomes a DARK theme. Current Moonlit token values are NOT shipped or locked; Pixel will send updated tokens and mockups.
  Morning Linen and Forest Twilight are unchanged. Pip art and the lantern halo must use the dark variants under Moonlit (Stage D).
  UPDATE: Pixel's final Moonlit tokens (DARK: night blue, silver, amethyst) are now in tokens/themes.css, TOKENS.md, contrast.md;
  Moonlit uses Pip's starlight/dark art. Use these for Stage D.
- Pixel design deliverables (dev only) landed: tokens at /workspace/pip-art/atelier39/tokens/ (themes.css, TOKENS.md, contrast.md: existing token
  names plus 9 new: --disabled-bg/-text/-line, --swatch-edge, --fiber-hi/-lo, --demo-bg/-ink, --hover-tint; System = light to Morning Linen,
  dark to Forest Twilight; a manual pick overrides). Mockups in /workspace/pip-art/atelier39/mockups/ (42 shots, NOTES.md). Copy in
  copy/COPY.md wins over mockup wording.
- Stage D note: about 28 rules in theme-pair.css switch only on prefers-color-scheme with fixed colors; TOKENS.md maps their replacements.
  Pip light/dark art (pip.js around line 72, landing image) and the lantern halo must follow the chosen theme, not only the OS setting.
- Not drawn by Pixel: loading, save-failure and invalid-input states, 360px and 200% zoom. Covered in tests with token-based styling.

## Stage B notes for Myke (flagged, dev only)
- Resume where I was is OFF by default. To make it useful, a returning visitor who turned it ON skips the welcome landing on a fresh open
  (landing.js `resumeOn()`); new visitors and anyone with it OFF see the landing exactly as before. Needs Myke's OK at owner review.
- Workbasket is a nav tab (per Pixel's mockups) shown only to visitors with saved projects or threads; Find floss stays the default view.
- Stage B styling is provisional (atelier/atelier.css, scoped to .ffa-*, #ffSearch*, #workbasketView) using existing tokens with fallbacks for
  Pixel's new tokens; easy to restyle when Pixel signs off.
- copy.json has no heading string for the Settings preferences card; uses pref.resume / pref.reset strings only. Ask Pixel.
- Pixel's copy.json updated during Stage B (now 302 strings); atelier-copy.js regenerated; changed strings: session.timer.hint, theme.moon.hint (now Dark).

## Decisions recorded (steering after Stage B tests)
- FF39-16 timer (CORRECTION, per PRODUCT_SPEC "never records time by default" and Pixel's copy): not saved, not in backups, counts wall-clock
  elapsed from a start timestamp while the page is open (keeps counting if the tab is hidden), resets when the page closes, no rewards,
  never touches stitch counts or inventory, OFF by default. Mockups: mockups/timer.html, contact-timer.png.
- FF39-14: progress ring mockups landed (mockups/progress.html, contact-progress.png, copy in COPY.md). Number always shown as text,
  aria "35% done, your own estimate", no ring when unset, 100% does not auto-complete.
- FF39-13: the cover-photo line in COPY.md ships only once backups include photos AND restore reads them back. Restore must keep all projects
  even if one photo fails, and report which photo failed.
- FF39-22: build only the switch with fallback to standard Pip; hold season-to-art mapping until Myke approves Pixel's SEASONAL-PLAN.md.

## FF39-22 seasonal mapping (approved, dev only, relayed via Pixel)
- 6 seasonal Greeting Pip variants replace ONLY resting art (greeting, greeting-alt, neutral; landing, Find floss hero, Pip bar greeting).
  Event poses, errors, restore, onboarding, icons and Pip Off/Quiet never change.
- Spring Mar 1-May 31, Summer Jun 1-Aug 31, Autumn Sep 1-Nov 30, Winter Dec 1-Feb 28/29, New Year Dec 31-Jan 2, World Embroidery Day
  Jul 29-31. New Year and Embroidery Day win over the season. Device's local date.
- Respect the seasonal toggle (default off), theme light/dark variants if Pixel provides them, and reduced motion (no animation added).
- Images lazy-load only when seasonal is on, not in sw.js CORE precache; missing or failed image shows standard Pip, never a blank.
- Core supports an optional Southern hemisphere flip (Pixel's plan); default Northern; whether to expose it is pending Myke.
