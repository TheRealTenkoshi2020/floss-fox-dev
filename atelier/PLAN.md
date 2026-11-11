# Floss Fox 3.9 "Stitching Atelier": implementation plan (dev reality)

Base: floss-fox-dev main 1115742 (cache flossfox-dev-v2.0a-ci005-91, keys flossfox-dev.*). Branch feat/atelier-3.9.
Production floss-fox main verified 6aa04f1 (3.8, cache flossfox-v3.8-1): untouched, and stays untouched until Myke approves.
Nothing on this branch merges to dev main or deploys to the test site without a separate go-ahead. All browser tests are simulated (Playwright Chromium).

## Handoff vs dev tree: mismatches found
1. Samira inspected PRODUCTION (6aa04f1, flossfox.* keys). We build in floss-fox-dev (flossfox-dev.* keys, hardcoded in projects.js, pip.js,
   pip-follow.js, landing.js; derived elsewhere). The release port re-keys as in 3.8.
2. Every file/API the plan names exists in dev: projects.js, threads.js, pip-hybrid/thread-locations.js, shop/ui.js, shop/offers.js,
   store-mode-core.js, fabric/ui.js, fabric/calc.js, theme-pair.css, pip.js, pip-follow.js, landing.js fresh(), snapshots.js, restore-verify.js,
   backup-core.js, backup-ui.js, recent-changes.js, sw.js. Differences in detail:
   - Threads key is flossfox-dev.threads.v1 (derived from projects KEY), not the plan's literal flossfox.threads.v1 (that is prod).
   - plan(p).lines is {key:'<dest>:<code>', from:[DMC codes], to, q, bought, ts, prov, ...}. One line can cover several DMC codes
     (e.g. Anchor 2 for WHITE+BLANC). Reference store core assumed {code,quantity}; adapter linesFromPlan() added.
   - fabric/calc.js compute() returns design.{w,h,wCm,hCm}, cut.{w,h,wCm,hCm}, cutExact, marginIn (no stitchedWidth/cutWidth names).
   - fabric/ui.js derives its key from location.pathname (/floss-fox-dev/), not from projects KEY (fabric.html has no projects.js).
     Atelier prefs on fabric.html must use the same pathname rule or not run there.
   - DMC catalog is a script-scoped `const DMC` in index.html (534 codes, BLANC/WHITE/B5200 each #fafafa). Not on window; UI layer
     must read it lexically (classic script) or receive it. Anchor equivalents are DMC[c].anchor[]; Sullivans via SULL map.
   - Store Mode already exists per project inside projects.js (renderStore with FlossFoxStoreModeCore, sort/search, buy links). The
     in-store checklist (FF39-17) is an upgrade of that, not new.
   - +/- skein stepper already exists in threads.js (max 999, >20 confirm via okCap). FF39-10 is the Undo/pending/rollback layer.
   - threads have a `restock` boolean (user "Restock" checkbox; journal records it as 'shopping'). Not shown on any shopping list.
   - No manual theme override exists: theme-pair.css is prefers-color-scheme only; no data-theme attribute anywhere.
   - ff:data-saved is dispatched by projects.js save() and threads.js backupChanged(): search can rebuild on it.
   - shop/ui.js already has Print list + Copy as text (copy triggers pCopy/sCopy/copy); Shop tab also has CSV.
   - Project statuses: planning / ready / progress / done (PSTAT). leftOff 500 chars. IDs are randomUUID or p+base36.
   - Pip: FlossFoxPip.react(key, vars, anchor, opts) with levels chatty/important/quiet/off, caps, siteAnnounces. Rich canonical pose
     set in assets/pip (celebrating, proud-finish, saved, checklist, floss-box, pattern-reader, measuring-fabric, ...). No seasonal art.
3. Reference module issues fixed in Stage A: rememberPlace defaulted ON (spec says opt-in); key(preview) boolean instead of the
   prefix-derivation convention; save() could overwrite a newer-schema/unreadable stored value; brands free-form uppercase (app uses
   dmc/anchor/sullivans); share text used em dashes; group key 'unassigned' collidable by a merchant id; search sorted Anchor 310
   above DMC 310; status shown as raw 'progress'; palette had no visibility outline for whites.
4. landing.js fresh() treated ANY flossfox* key as returning user, so the new pref key would have hidden Start here. Fixed:
   only flossfox(-dev).atelier.v1 is ignored; every other key still counts (red-green proven by atelier_first_visit_e2e.py).
5. Prefs key is NOT in projects.js snapshot()/PREF_KEYS, so it is excluded from auto copies and backups (disposable convenience
   state, as the spec allows). If Myke wants theme in backups that is a later, explicit change.
6. sw.js untouched in Stage A (modules are inert). landing.js changed, so the cache MUST be bumped whenever this branch is put on the
   test site. PR 17 already uses ci005-92; pick the next free number at that time.

## PR 17 (Leave a review) decision
Branch is based on dev main WITHOUT PR 17. PR 17 stays separate and hidden (REVIEW_FORM_URL empty, no URL invented). When Myke supplies
the form link and approves, PR 17 merges to dev main first; this branch then merges main in (expected conflicts: index.html footer/Help/
Settings and sw.js CORE + cache name; trivial). FF39-25 stays blocked-external until then and is never marked delivered on our side.

## Stages (adapted)
A. Pure cores + prefs lifecycle + first-visit fix + privacy tests. DONE on branch (see report). Store core strings switched to Pixel's draft copy.
B. DONE on branch (tests + regression in PR 18). Workbasket (heading "Your workbasket", Myke's name choice as relayed), Continue project (FF39-15), saved spot (FF39-06), search UI (FF39-02).
   - New atelier/atelier.css + atelier/atelier-ui.js loaded after existing scripts; reads FlossFoxProjects._store().projects,
     lastProject(), plan(), FlossFoxThreadsUI.data().threads; navigates only via showView()/openProject() after validating ids.
   - Precedence: restore/safety message > URL hash > landing/Start here > opted-in last tab/project > Find floss.
   - Workbasket only for a visitor with saved projects or threads; fresh visitors keep landing + Start here.
   - Strings from Pixel's copy.json (DRAFT, flagged). Pip lines: Pixel's starred line per event for dev.
   - Gate: fresh-user + persisted-data E2E, hash precedence, deleted-project fallback, keyboard search, no-mutation dumps, full regression.
   - Also pulled forward from C: +/- skein verified save, Undo of the latest step, rollback on a failed save (FF39-10).
   - Returning visitors who opted into Resume skip the welcome landing (flagged for Myke).
C. DONE on branch (see FF39_CHECKLIST Stage C record). Shopping + thread library: in-store checklist on top of existing Store mode (one checkbox per line), Share (Web Share, else copy,
   else print; Pixel's share strings), Bought vs owned (FF39-19), quick quantity Undo/pending/rollback (FF39-10), collection sort/views
   and low-stock threshold (FF39-11), low-stock suggestion with explicit Add / Not now (FF39-12).
   - Receipt copy (relayed): the "in your threads" line ONLY after the confirmed "I received it" step that really changed My threads;
     "Mark bought" uses the project-only line.
   - Gate: no-inventory-mutation E2E (dump threads key before/after every non-receipt action), duplicate merchant links, offline reload.
D. Visual: themes DONE on this branch (tests + regression in PR 18): System / Morning Linen / Forest Twilight / Moonlit Threads
   as token overlays on theme-pair.css via <html data-atelier-theme> set before first paint from the pref key (no key created on
   first visit). Pixel's final tokens shipped (Moonlit is DARK). Pip art + lantern halo follow the chosen theme; ~28 theme-pair
   rules now key off data-atelier-scheme. Still open in Stage D: gallery cards (color-strip fallback), comparison surface (FF39-09),
   remaining micro-interactions. Gate (themes): contrast.js all themes, 390/1280, reduced motion, no flash — done in atelier_themes_e2e.py.
E. Fabric diagram from compute() only + named presets + cut slip (FF39-20); Stitch Session (FF39-16; timer OFF by default, never saved or backed up, wall-clock while the page is open, resets on close); progress
   clarity (FF39-14, manual % ring per Pixel mockups: number as text, no ring when unset, 100% never auto-completes; celebration once per real transition).
F. Pip events at verified points only (import, covers, receipt verified, return with note, finished), respecting level/cooldown and
   siteAnnounces; seasonal art REQUIRED (Myke): build only the switch with graceful fallback; season-to-art mapping held for Myke's OK on SEASONAL-PLAN.md; to standard Pip when art is missing; toggle visibility pending Myke.
G. Cover photos (FF39-13) in IndexedDB (downscaled, EXIF stripped, size-capped); Myke: one backup file that includes the photos
   (versioned manifest, checksums, size limits, optional media section old importers ignore, readback + rollback on restore,
   automatic copies exclude media; restore keeps every project even if one photo fails and names the failed photo;
   cover-photo line ships only once backup + readback work); quota/rollback tests; legacy backup migrations; stress (500 colors).
H. Full offline/PWA regression, cache bump, owner walkthrough on the test site (only after Myke says so), release report, rollback SHA.
   Production port only on Myke's explicit approval.

## Integrable immediately (no design dependency)
- Search core, prefs core, store-visit core, palette core (done, tested, inert).
- First-visit protection (done).
- Behavior-only logic of: saved spot precedence + Resume where I was (opt-in) + Reset settings; Continue project routing to leftOff;
  Bought vs owned state machine and no-mutation tests; quick-quantity Undo + verified-write rollback; low-stock threshold logic;
  fabric diagram geometry from compute(); search refresh on ff:data-saved. These can ship with plain existing styles, then get Pixel's look.

## Dependencies
- Pixel: mockups (Workbasket, search, color studio, thread library, journal/gallery, store mode, cutting table, Pip mapping), theme token
  sheet for 3 themes, swatch styling, seasonal art (if any). Draft copy is in /workspace/pip-art/atelier39/copy/copy.json (244 strings,
  17 Pip lines), still unapproved by Myke.
- Myke decisions: see report list (cover photo backup, manual %, timer, seasonal art mandatory?, review form URL, low-stock list home,
  receipt-to-My-threads behavior, privacy lines, Compare chart matches, seasonal toggle visibility, pose swap, cover-photo warning).

## Facts for Pixel / Myke questions (from dev code)
(a) "estimated" in dev is about the SKEIN AMOUNT, not the color match. skeins/calc.js requirement(): source:'estimated' when the
    project has Pip's skein estimator enabled (p.skeinEstimator.enabled), the buy brand is DMC, no stated quantity exists, and the
    estimator returns kind 'estimate' (from stitch counts). projects.js plan() sets t.estimated = req.source==='estimated'; shown as
    "about N skeins (Pip estimate, including extra)". Conversion confidence is separate: index.html resolve() gives prov
    'original' (DMC), 'chart'/'official chart', 'chart option 1 of N', 'your choice ...', and review for BLANC/WHITE/B5200 disputes.
    There is no exact/close/estimated color-match field; the UI tags Anchor matches "chart" ("Not an exact match").
(b) No general (non-project) shopping list. The Shop tab shows ONE project's plan at a time (shopPicker, mountShop). planner.js is a
    read-only multi-project preview. The only project-free "want to buy" signal is the thread `restock` flag (Restock checkbox).
    Recommended home for low-stock "Add to shopping list": set restock:true on that thread (existing, backed-up, journaled field)
    and show a "Restock for My threads" section in Shop that does not depend on a project. Needs Myke's OK because it gives restock a
    visible list.
(c) Today, "I received this thread..." (projects.js receive()) writes ONLY project data: decisions[code].recv={brand,to,qty} and clears
    purchased[key]. My threads is not changed. Colors reach My threads only via the explicit "Add from my projects" button
    (threads.js addFromProjects, with Undo), which ADDS colors not already in the collection and never increases the count of a color
    you already own. So a confirmed receipt does not raise an existing skein count today: FF39-19 must add that explicit step.
