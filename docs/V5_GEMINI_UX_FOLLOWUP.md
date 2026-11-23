# Gemini navigation and usability follow-up

Prepared November 22, 2026. Baseline: development main `dba49770c591f373100175b0b668bfaed351a5b2`, including the approved Pip artwork and latest store-link/cache fixes.

## Findings and changes

| Feedback | Verified result and implementation |
| --- | --- |
| Ask Pip shows Find floss guidance on Settings | Reproduced with existing Find floss results. `FFHelp.screen()` skipped Settings and fell back to results; `tabKey()` then mapped those results to Find floss. Settings now has an explicit screen identity. Open help refreshes from resulting view/selection changes, including programmatic navigation and browser Back. Workbasket also has its own contextual help. |
| Pip overlaps the Ask Pip card | Not reproduced in the original 900px-high baseline sweep. The card nevertheless lacked the side margin already used by other wide-screen sections. It now reserves the companion column too. Geometry checks cover 320/390px phones and 880/1280px-wide, 600px-high windows; rendered narrow and wide layouts were inspected. This is a layout safeguard, not a claim that every reported overlap configuration was reproduced. |
| Two PDF import buttons in empty Projects | Reproduced. The empty-state import remains visible; the persistent project-list import is hidden while that empty state is shown. Once a project exists, the normal project-list import remains available. Both use the original importer and review flow. |
| Workbasket appears only after the first saved thread | Confirmed existing behavior. The app now exposes the existing empty Workbasket from the first visit, keeping the navigation stable before and after the first save. The welcome screen still offers three primary choices plus More tools. Small-screen Workbasket text can break between Work and basket. |
| Search appears to require Enter | Live result lists already update as users type; that part was not reproduced. Instructions now distinguish live results from opening their details. A separate timing defect was reproduced: changing a query and immediately pressing Enter could open the prior query's first result. Enter/arrow navigation now flushes a pending query before using results. |
| Search stays open on another tab | Reproduced. Navigation closes search without sending focus back to its old opener. Actual view changes also close it, covering actions that navigate without clicking a tab. Escape still restores focus to the search trigger. Pending result/announcement timers are cleared on close. |
| Anchor 46 has a striped placeholder | Intentional absence of a verified Anchor screen swatch. The preview now explicitly says no screen color is available and to use the brand and number. No DMC red was invented or relabeled as an Anchor swatch. Manufacturer mappings and special white codes are unchanged. |
| No Add to My threads action in preview | DMC previews now offer Add to My threads. This opens My threads and appends the DMC code to its input, preserving an existing unsaved draft. It focuses the field for quantity review. No inventory is written until the user presses the existing Add button; unspecified quantities retain the existing unconfirmed-count behavior. Anchor rows do not silently add a reverse-matched DMC color. |
| DMC 310 in DMC heading | Reproduced. Same-brand result headings now read DMC 310. Other-brand conversion headings retain the existing wording and disclosures. |
| Ask Pip suggests chat but opens a help card | The card now identifies itself as quick help for the current page and exposes the existing Chat with Pip action. That action opens the existing local chat/guided topics; no new AI service, network request or online permission was added. |
| Folded tools do not open on the first tap | Additional defect found during regressions. The shared focus handler opened a summary's own section before its native click/Space action, which immediately closed it again. Focus now reveals only outer sections, preserving the heading's native toggle behavior. Keyboard focus, Space and a first mouse click are covered. |

## Verification

The initial focused baseline run recorded 33 passing and 44 failing assertions across four viewport/theme combinations; repeated assertions cover the same findings. An earlier setup attempt stopped because the stale search panel intercepted the next click. The baseline harness then closed that panel after recording its failure so the remaining cases could run.

The expanded `tests/v5_navigation_feedback_e2e.py` checks 320, 390, 880 and 1280 pixels in light/dark themes. It covers the original importer, duplicate buttons in empty and populated lists, stable navigation/touch targets, contextual help after clicks/programmatic navigation/Back, help/companion geometry in short windows, live search, rapid-query Enter, missing-swatch disclosure, preserved inventory drafts, explicit saving, confirmed versus unknown counts, local chat reachability, folded-heading focus/Space/mouse behavior, overflow and JavaScript errors. The final count and result are recorded in the engineering report.

```bash
FF_CHROME=/usr/bin/chromium python3 tests/v5_navigation_feedback_e2e.py http://127.0.0.1:8776/
```

Additional existing suites and their exact results are recorded in the engineering report accompanying the full repository ZIP. Browser tests use isolated synthetic profiles and local source. Legacy suites use their existing compact-row/navigation helper where needed; the focused feedback test does not. A stale, pre-existing service-worker identifier assertion was updated with the new cache revision rather than weakening its asset checks. The master suite's old quick-help assertion prohibited a chat shortcut; its replacement checks the single existing Chat with Pip button, contextual explanation, primary action and Close, while keeping topics/settings outside the card. Artwork assertions follow the approved art40 mappings and numbered filenames.

## Data, offline and release boundaries

No schema, storage key, backup format, manufacturer mapping, artwork file or online service configuration changes. The only persistent data changes in the new browser test follow explicit user-style Add/Create actions on synthetic data. Opening help/search, reviewing an import, or following the new inventory shortcut does not write projects or thread counts.

The development worker advances to `flossfox-dev-v5-gemini-audit-4-ux1-seo5`. It retains the upstream fresh-precache fix, cache namespace rules and offline assets. No production repository or flossfox.com changes are authorized by this follow-up. Real phones, camera accuracy, Safari/Firefox and manual screen-reader testing remain outside the available verification.
