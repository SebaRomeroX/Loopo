---
type: task
status: in_progress
id: task-mvp-t6-failure-paths-smoke-deploy
title: "MVP T6: failure paths, multi-tab sync, offline, smoke + deploy"
assignee: SebaRomeroX
branch: feat/task-mvp-t6-failure-paths-smoke-deploy
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
claimed_at: "2026-10-05T14:50:43.142Z"
depends_on: [task-mvp-t3-list-kind-form, task-mvp-t5-in-tab-notifications]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t6-failure-paths-smoke-deploy
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t6-failure-paths-smoke-deploy.md
  Leaves live only under a story. id is the filename stem: task-mvp-t6-failure-paths-smoke-deploy.
  CLI `arggon create task mvp-t6-failure-paths-smoke-deploy` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T6: failure paths, multi-tab sync, offline, smoke + deploy

## Context

Wave 4 (plan §T6): the cross-cutting endgame — `SecurityError` read-only
banner with create/edit disabled, quota failure message, storage-corruption
error banner, `storage`-event convergence between two tabs (last-write-wins),
offline-after-first-load behavior, GitHub Pages enablement, and the full
manual smoke pass with expected-vs-observed evidence recorded on the PR.

## Acceptance

- [x] Storage blocked (`SecurityError`) → session-local read-only mode with a
      visible banner; create/edit disabled.
      Chromium, 320×568, two variants: (a) **cold start** — `addInitScript`
      throws `SecurityError` from the `localStorage` getter before the app
      loads → persistent banner (`role="alert"`, no dismiss control):
      "Browser storage is blocked — this session is read-only: create and
      edit are disabled and changes cannot be saved."; form note visible;
      submit/radios/inputs `disabled` (opacity 0.55, `cursor: not-allowed`);
      empty state renders; console 0 errors / 1 honest warning. (b)
      **mid-session** — load healthy (7 cards), then the running document's
      `localStorage` getter redefined to throw, then a form submit →
      `enterReadOnly()` fires: same persistent banner, form + all row
      Edit/Delete actions disabled, the 7 cards stay visible, in-memory card
      #8 added, nothing persisted. Screenshot evidence reviewed.
- [x] A change in one tab appears in the other tab via the `storage` event,
      last-write-wins.
      Two real tabs (playwright `tab-new`): create "From tab B" in tab 1 →
      tab 0 shows it with `performance.navigation == 1` (no reload). LWW
      conflict chain on one task: V1 app-edit (tab 0) → V2 racing raw
      `setItem` from tab 0 → tab 1 adopts V2 (later write survived storage) →
      V3 app-edit (tab 1) → storage and tab 0 both end at V3 (last write
      wins). Corollaries: a delete in tab 1 removed the card **and the
      one-shot notice** for that id in tab 0 (convergence purge);
      `schemaVersion: 99` / corrupt remote envelopes are ignored (never
      adopted); a cleared key converges to an empty list.
- [x] No network after first load: the app still opens and computes due
      state.
      Deployed origin `https://sebaromerox.github.io/Loopo/` (Pages sends
      `cache-control: max-age=600`): first load online (seeded overdue date +
      counter), `network-state-set offline` → uncached probe URL fails
      `net::ERR_INTERNET_DISCONNECTED` (network genuinely blocked) →
      navigating back to the app URL **serves from HTTP cache** → renders
      "Overdue" + "4h 17m elapsed". Runtime offline: with the network still
      down, `visibilitychange`/`focus` + the 30 s timer re-render and the
      engine recomputes; storage reads/writes work. Resource audit: 12
      resources, **all same-origin**, zero external references in shipped
      files (grep). Note: a Chrome *reload* forces revalidation and fails
      offline — "opens" = a navigation/open, which the cache answers.
- [x] Manual smoke of every spec acceptance row passes; expected-vs-observed
      evidence recorded on the PR.
      All 17 rows exercised end-to-end (Chromium 320×568 + node smokes);
      expected-vs-observed table on PR #11. Scratch smokes: T6 7/7, T5 9/9,
      T4 7/7 ALL PASS (`/tmp/opencode/`, testing-policy exception);
      `node --check` ×11; `arggon validate` ok.

## Evidence (17-row matrix, expected vs observed)

1. **Static/no build** — no `package.json`/lockfiles/build configs/
   `node_modules`; `<script type="module" src="js/main.js">`; grep for
   external URLs in `index.html`/`styles.css`/`js/*` → none. Observed:
   served by `python3 -m http.server` and GitHub Pages identically.
2. **First run** — cleared storage → "No reminders yet" + exactly one
   example per kind (Loop/Date/Counter).
3. **CRUD** — 3 tasks created through the real form (loop `2 hours`, date
   `2026-10-18`, counter `2026-09-24`), reload → 3 cards with correct
   details, `schemaVersion: 1`.
4. **DST loop** — node T4 engine smoke (`t4/smoke.mjs` 7/7) covers the
   wall-clock-across-DST rows; browser loop `nextAt` advances from the same
   rule each tick.
5. **Date countdown/due** — "Math exam … in 13 days"; overdue "Pay rent"
   (yesterday) → status `Overdue` + `.task--due`, no negative day counts.
6. **Counter refresh** — "Timer probe" recorded `3h 59m elapsed`, left the
   tab open, **no reload**, observed `4h 2m elapsed` after the 30 s timer
   (crossing at :27:00).
7. **Envelope versions** — seeded `{tasks:[…]}` (no schemaVersion) →
   reload → migrated to `schemaVersion: 1`, re-stored, task visible, no
   banner, no backup (migration ≠ failure). Seeded `schemaVersion: 99` →
   backup **byte-identical** to seed, primary **byte-identical** to seed,
   empty list, `role="alert"` banner: "…newer version of Loopo — the stored
   value is left untouched…". Write-once proven: the later corrupt-seed
   failure did **not** clobber the v99 backup.
8. **Unparseable JSON** — primary `'{oops'` byte-identical after load,
   backup = `'{oops'` (after clearing the write-once backup), error banner,
   empty state, form usable, console 0 errors / 1 warning.
9. **SecurityError** — see acceptance box (cold + mid-session variants).
10. **Quota** — filled localStorage with real `QuotaExceededError`s down to
    <64 B headroom (19×256 KB + shrinking tail), then created a task →
    banner "Storage is full — the save was rejected and your stored list is
    unchanged.", stored envelope **byte-identical** before/after, console
    0 errors / 1 warning. Dismiss → next failed save re-shows (`reshow`) →
    after freeing storage a successful save clears the banner.
11. **XSS** — title literal `<script>window.__pwned=1</script><img src=x>`
    rendered as text; `window.__pwned === undefined`; 0 `img` in card or
    document; notices/banners also `textContent`-only (banner re-embeds
    task titles safely).
12. **Two tabs** — see acceptance box (propagation, LWW chain, notice purge,
    corrupt-envelope ignore).
13. **Permission gesture** — instrumented `requestPermission`: 0 requests on
    load, exactly **1** after clicking the real button → `denied` → button
    `hidden` + honest hint; `requestPermission()` exists only in the click
    handler.
14. **Occurrence once + missed** — "Due today" notice appeared once
    (tagged `data-task-id`), reload → 0 notices (anchor), fresh second tab
    → 0 notices; overdue "Pay rent" carried the red `missed` chip; deleting
    its task from the other tab purged the notice.
15. **320 px** — `scrollWidth: 320`; text inputs/select `16px`; kind labels
    `16px` + exactly `44px` tap height; every visible button ≥ 44×44; CSSOM
    `:hover` rules = 0; disabled controls visibly inert.
16. **Offline** — see acceptance box.
17. **This table** — recorded on the item and PR #11 per the testing policy.

## Design decisions

- **`js/banners.js` (new)**: keyed session banners — same failure never
  stacks; messages land via `textContent`; `role="alert"`; tones error/warn.
  Dismissal is final for the session **by default** (a re-render must not
  nag), except `reshow: true` for save failures (a save that fails *again*
  must speak again). Read-only banner is `dismissable: false` — the spec
  wants it visible for the session.
- **`enterReadOnly()` covers both timings**: "when storage is blocked" has
  no timing qualifier, so the mode is entered on a load-time `SecurityError`
  *and* when a save throws one mid-session. The persistent banner carries
  the message the spec asks for; the form adds its own explanatory note
  (row actions disable too — delete cannot persist either, so a "working"
  Delete would lie).
- **Full LWW convergence replaces T5's narrow anchor sync**: the `storage`
  listener now adopts the winning envelope wholesale (tasks + schedule +
  anchors); T5's `syncLastNotified` became `sanitizeAnchors` (garbage
  anchors normalize to `null` on arrival — the SF-1 guard survives
  adoption). Envelope `schemaVersion`/shape checked before adoption; a
  corrupt/foreign value is ignored (never adopt data we can't trust); a
  cleared key converges to `[]` (that write won). Removed ids reset an open
  edit (`form.resetIfEditing`), and `form.syncAnchor` keeps an open edit's
  dedupe anchor current — otherwise saving after another tab's notification
  would resurrect a stale anchor (row 15 × row 120 interaction).
- **Notices purge through `render()`**: every notice carries
  `data-task-id`; a render whose task set no longer contains the id drops
  the card — one choke point covers both local deletes and convergence.
- **Quota keeps the in-memory card** (optimistic) while storage stays
  byte-identical — the spec only demands the message + unchanged stored
  list; the banner explains what did not persist. Reload after a
  quota-failed edit shows storage truth again.
- **`document.hidden` gating stays off**: the spec says "on a timer while
  open" and no acceptance row covers hidden-tab cadence; Chrome throttles
  hidden tabs to ~1/min, which stays inside T4's slack. Recorded here as
  the close-out decision for the last open plan note.
- **Disabled inputs needed author styling**: our `.field input` rules beat
  the UA's own disabled rendering — `input:disabled, select:disabled` now
  get `opacity: .55; cursor: not-allowed` like the buttons.
- **GitHub Pages enabled** — `build_type: workflow`, deployed by the pinned
  `.github/workflows/pages.yml` (checkout → configure-pages →
  upload-pages-artifact → deploy-pages; push to `main` = deploy, so the whole
  recipe is config-in-repo per `docs/deploy.md`, not console-only state).
  Site: `https://sebaromerox.github.io/Loopo/` → HTTP 200,
  `cache-control: max-age=600`; deployed-origin smoke above.
- **No delete confirmation** — deleting is immediate (one 44 px tap, no
  undo). Decision: a modal confirm on a 320 px screen taxes every delete to
  guard against a mis-tap that only costs a re-created task in MVP scope;
  localStorage has no soft-delete/undo story yet. Recorded per review S2 —
  revisit with an undo snackbar post-MVP rather than a dialog.

## Review round (PR #11, arggon-reviewer)

Verdict first pass: `request-changes` — 1 blocker + 6 should-fix + 6 nits.
All blockers/should-fixes applied in this round; nits applied except the two
recorded rationales below.

- **B1 (blocker, fixed): saves after an unknown-version load overwrote the
  future envelope.** Reproduced first: seed `schemaVersion: 99` → load →
  banner → one create → primary byte-changed (backup happened to hold the
  copy, primary lost it) — violating spec row 7's "never overwritten" and
  T2's deferred handoff ("the T6 banner/save flow should warn or block
  saves after unknown-version"). Fix: `futureGuard` in `main.js` — the load
  path sets it, `persist()` refuses every save with a persistent
  (non-dismissable) banner: "Not saving — the stored reminders come from a
  newer version of Loopo and must not be overwritten. Changes stay on screen
  for this session only." In-memory editing stays available (session-local);
  a dismissed refusal must not go silent on the next attempt, hence
  non-dismissable. Browser probe: primary byte-identical after a create,
  both banners stacked, card visible in-memory, backup holds the future
  envelope.
- **S1 (fixed):** ARCHITECTURE.md TODOs replaced — Problem (constraints +
  non-goals), Big picture (add-reminder walkthrough + module diagram),
  Boundaries (6 checkable rules), Invariants (6 invariant → test pairs).
- **S2 (fixed):** delete-without-confirmation decision recorded above.
- **S3 (fixed):** `storage` listener now also accepts `event.key === null`
  (`clear()` elsewhere → converge to empty list) — the key-equality check
  rejected it before. Probed both key paths in two real tabs: `removeItem`
  → empty list (backup kept), re-seed → adopt, `clear()` → empty list.
- **S4 (fixed):** adoption failures (corrupt / shape-bad remote value) now
  show a warn banner — "Another tab stored a value this app could not read
  — it was ignored here." — instead of console-only, so the PR note can
  claim what actually ships. Probed: one keyed banner (no stack on repeat),
  dismissable, `role="alert"`, nothing adopted.
- **S5 (recorded):** row 16's deployed-origin run predates this PR's code
  (Pages was enabled from `main` = T5 build) — the cache/offline behavior
  under test is deploy-origin behavior, not T6-UI behavior. Will re-run the
  offline navigation probe on `main` after merge as part of the final
  verification.
- **S6 (fixed):** `.github/workflows/pages.yml` (pinned to tag refs, the
  repo's convention) + Pages switched to `build_type: workflow` via API —
  deploy is now config-in-repo; the one-time source switch is documented in
  the workflow header.
- **N2 (fixed):** Cancel no longer disabled in read-only mode — it only
  resets the form (never persists), so trapping an open edit behind it
  would strand the user. Probed: read-only submit → Cancel enabled →
  clicking it exits the edit to "Add reminder".
- **N3 (fixed):** `.kind-option:has(input:disabled)` dims the kind-picker
  label text with the disabled controls.
- **N4 (fixed):** `warnedUnrenderable` keys on the task id instead of
  object identity — adoption re-parses tasks, so identity keys re-warned
  and leaked detached objects into the Set on every storage event.
- **N6 (fixed):** a successful save clears `save:invalid-tasks` as well as
  `save:quota`.
- **Honesty wording (fixed):** quota message now ends "…this change stays
  on screen only until storage is freed." — the banner alone could not say
  it (it shows the store's message verbatim). Re-probed with a real quota
  fill: revised text renders, stored bytes identical, dismiss/reshow/
  clear-on-success cycle intact.
- **N1 (not applied, rationale):** the `storageArea` identity check is
  redundant — the key equality check already filters (no app code writes
  the `loopo.tasks` key into `sessionStorage`), and evaluating
  `window.localStorage` inside the listener would re-introduce a
  `SecurityError` throw site precisely in blocked-storage sessions.
- **N5 (not applied, rationale):** `engine.js` `warnOnce` diagnostics stay
  console-only — surfacing them in a banner would break the engine's
  no-DOM boundary (it would have to return diagnostics for rendering); the
  card still renders the task's rule and status. Recorded in
  ARCHITECTURE.md Boundaries; revisit post-MVP if the diagnostics matter
  to users.

## Notes

- Depends on T3 and T5 (transitively T4). `task-mvp-testing-policy` must have
  landed before review (this item closes the manual-smoke row).
