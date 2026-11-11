# Floss Fox 3.9 "Stitching Atelier": FF39 scope checklist

Branch `feat/atelier-3.9` (from dev main 1115742). Production `floss-fox` main 6aa04f1 (3.8) is untouched.
Status words: not started / in progress / delivered / blocked-external / needs Myke decision.
"Delivered" means integrated on this branch with passing unit + E2E tests (simulated browser), Pixel sign-off where visual,
and is never claimed from Samira's isolated reference tests. Nothing here is dropped; descoping needs Myke's words.

| ID | Feature | Pri | Stage | Owner | Status | What exists in dev today | Tests (planned / done) |
|---|---|---|---|---|---|---|---|
| FF39-01 | Workbasket / Your Stitching Corner | P0 | B | Mouse (Pixel mockup) | in progress (data layer: search/palette cores) | `FlossFoxProjects.lastProject()`, `openProject`, `plan()`, `leftOff`; landing gate | atelier_workbasket_e2e.py (B) |
| FF39-02 | Universal search | P0 | A core, B UI | Mouse (Pixel mockup) | in progress (core done + tested) | `thSearch` filter in My threads, thread-locations search only | atelier_unit.cjs search block (A, done); search e2e (B) |
| FF39-03 | Micro-interactions, layout steadiness | P1 | D | Pixel design, Mouse | not started | theme-pair.css tokens, reduced-motion rules | atelier_themes_e2e.py (D) |
| FF39-04 | Appearance choices (System / Morning Linen / Forest Twilight / Moonlit Threads) | P1 | A pref, D UI | Pixel tokens, Mouse | in progress (pref field + validation only) | theme-pair.css light/dark via prefers-color-scheme only; no manual override | prefs tests (A, done); themes e2e + contrast (D) |
| FF39-05 | Floss swatches + palette strips | P1 | A core, D UI | Pixel design, Mouse | in progress (palette core done) | flat chips using DMC hex | palette tests (A, done); gallery e2e (D) |
| FF39-06 | Saved location + preferences, reset | P0/P1 | A core, B UI | Mouse | in progress (pref core done, OFF by default, reset()) | hash routing in showView(); no saved spot | prefs tests (A, done); hash precedence e2e (B) |
| FF39-07 | Accessibility + performance budget | P0 | every stage, H audit | Mouse, Pixel | in progress (search perf bound in unit test) | contrast.js, 44px work in flow-pass | per-stage e2e + H audit |
| FF39-08 | Recent conversions + explicit Add actions | P0/P1 | A core, C/D UI | Mouse | in progress (recentConversions in prefs) | converter UI; threads add; projects add | prefs tests (A, done); color studio e2e |
| FF39-09 | Rich comparison surface | P1 | D | Pixel design, Mouse | not started | pCmp compare, exact/close/estimated labels | color studio e2e (D) |
| FF39-10 | Quick quantities (+/-, Undo, verified save) | P0 | C | Mouse | not started | +/- stepper EXISTS in threads.js (max 999, >20 confirm); missing: visible pending, Undo of latest, rollback on failed write | quick qty e2e (C) |
| FF39-11 | Collection views, sorting, low-stock filter | P1 | C/D | Mouse (Pixel shelf look) | not started | list view, storage location (schema 2), `restock` flag | collection e2e (C) |
| FF39-12 | Low-stock suggestions (explicit Add / Not now) | P1 | C | Mouse | not started | `restock` flag per thread already exists | low-stock e2e (C) |
| FF39-13 | Gallery cards, palette colors, optional cover photo | P1/P2 | D gallery, G media | Mouse, Pixel | needs Myke decision (photo backup promise) | project list (no gallery) | gallery e2e (D), media backup e2e (G) |
| FF39-14 | Progress clarity, manual % ring, completion once | P1 | E | Mouse, Pixel | needs Myke decision (manual % field) | status planning/ready/progress/done | projects e2e (E) |
| FF39-15 | Continue where I left off | P0 | B | Mouse | not started | `leftOff` (500 chars) + editor field | workbasket e2e (B) |
| FF39-16 | Stitch Session focus mode | P1/P2 | E | Mouse, Pixel layout | needs Myke decision (timer yes/no) | none | session e2e (E) |
| FF39-17 | In-store checklist (one checkbox per line) | P0 | A core, C UI | Mouse | in progress (store-visit core done) | per-project Store mode in projects.js (store-mode-core.js), shop/ui.js merchant groups | store tests (A, done); atelier_shop_e2e.py (C) |
| FF39-18 | Printable / shareable list | P0 | A core, C UI | Mouse | in progress (privacy-safe shareText) | Print list + Copy in shop/ui.js | store tests (A, done); share e2e (C) |
| FF39-19 | Bought vs owned reconciliation | P0 | C | Mouse | not started | Mark bought (purchased map), "I received this thread" check-in, Add from projects + Undo | no-inventory-mutation e2e (C) |
| FF39-20 | Fabric diagram + presets + cut slip | P1 | E | Mouse, Pixel layout | not started | fabric/calc.js compute() (design.w/h, cut.w/h), fabric/ui.js prefs + print/copy | atelier_fabric_e2e.py (E) |
| FF39-21 | Contextual Pip reactions | P0/P1 | F | Pixel lines, Mouse events | not started | FlossFoxPip.react(key,vars,anchor,opts), levels, cooldowns, pip-follow single companion | atelier_pip_e2e.py (F) |
| FF39-22 | Seasonal optional adornments | P2 | F | Pixel art | needs Myke decision (is art mandatory?) + blocked on Pixel art | `seasonalPip` pref field (A, OFF) | pip e2e (F) |
| FF39-23 | UX copy + visual consistency | P1 | D-F | Pixel, Mouse | not started | Fraunces/Nunito self-hosted, no em dash rule | copy scans each stage |
| FF39-24 | Trust and continuity | P0 | A-H | Mouse | in progress (first-visit fix done) | all 3.8 safety systems | atelier_first_visit_e2e.py + atelier_unit landing block (A, done); full regression each stage |
| FF39-25 | Leave a review button | P0 | external | Myke (form URL) | blocked-external | draft PR 17 (review.js, REVIEW_FORM_URL empty, hidden) | review_button_e2e.py (in PR 17) |

## Copy status (dev only, all DRAFT until Myke approves at owner review)
- String source for wiring: Pixel's /workspace/pip-art/atelier39/copy/copy.json (244 strings, 17 Pip lines), flagged draft.
- Relayed as Myke's choice for dev: dashboard name "Workbasket"; Pixel's starred Pip line per event; receipt copy: the "in your threads"
  line only on the confirmed "I received it" step, "Mark bought" uses the project-only line. Shown again at owner review.
- Still pending Myke: two privacy lines, "Compare chart matches", seasonal accessories toggle visibility, pose swap, cover-photo warning variant.
- Applied in Stage A: store-visit core uses shop.group.other, shop.boughtNote, share.header/line/none/footer (no em dash, no color names).
