<!-- arggon:generated template="ARCHITECTURE.md" -->
# Loopo — Architecture

<!-- matklad-style skeleton: big picture first, then a code map, then the boundaries.
     Replace every TODO; delete sections that genuinely do not apply. Keep it current in the
     same PR that changes the architecture it describes. -->

## Problem

<!-- What problem does Loopo solve, for whom, and what are the hard constraints?
     Two or three paragraphs at most. Name the non-goals explicitly. -->

Loopo is a personal reminders web app for people who want account-free,
offline-friendly nudges: recurring **loops** (every N hours/days/…), **dates**
(day countdowns) and **counters** (elapsed time since an event) — one kind per
task, shown in a single due list.

Hard constraints, all of them architectural: **zero build** (HTML/CSS/vanilla
ES modules served as-is from GitHub Pages — no `package.json`, no bundling, no
dependencies), **no backend** (persistence is `localStorage` behind one
`schemaVersion` envelope; there is no auth and no cross-device sync),
**mobile-first at 320 px** with no hover-only affordances, and **XSS-safe
rendering** (titles and any other user text reach the DOM only through
`textContent`/`value`).

Non-goals: cross-device sync, accounts, Web Push (in-tab notifications only
for the MVP), `file://` support (HTTPS/localhost origins only), and legacy
browser support.

## Big picture

<!-- How does a request / command / event flow through the system? Name the major moving
     parts and the direction of dependencies. A small diagram helps. -->

`index.html` mounts `js/main.js`, which composes every other module and owns
all process-level listeners (page load, 30 s timer, `visibilitychange`,
`focus`, cross-tab `storage`). Nothing else subscribes to those events.

Representative operation — **adding a reminder**:

1. `form.js` validates input and builds a task via `tasks.js#createTask`
   (loud per-kind validation; `kinds.js` drives the picker).
2. `main.js#commit` inserts it into the in-memory list, asks `engine.js` to
   compute its first `nextAt`, persists through `store.js#saveTasks`
   (one atomic `setItem`), then re-renders.
3. `render()` draws banners (`banners.js`), notices (`notify.js`), the list
   (`list.js` → `format.js` → `engine.js`) or the first-run empty state.

Reads happen once at startup (`store.js#loadTasks`: migrate forward, back up
unreadable/newer values, classify failures → banners or read-only mode). The
same engine that computes due state also emits occurrences, which
`notify.js` dedupes across tabs through the `lastNotifiedAt` anchor before
firing a system notification or an in-app notice.

```text
index.html ─▶ main.js (listeners + compose)
              ├── store.js        localStorage envelope (only module that touches it)
              ├── form.js ─▶ tasks.js ─▶ kinds.js
              ├── list.js / empty-state.js ─▶ format.js ─▶ engine.js (pure)
              ├── engine.js  (ticks → occurrences)
              ├── notify.js  (permission, dedupe anchors, notices)
              └── banners.js (keyed failure surfaces)
```

## Code map

<!-- "You are here" map of the tree. One bullet per directory: what lives here, what must
     NOT live here. Update in the same PR that moves code. -->

```text
Loopo/
  index.html     # static shell: header, <noscript> fallback, #app mount point
  styles.css     # mobile-first styles — base targets 320 px, only widens on larger viewports
  js/            # app ES modules loaded directly (no build step, no dependencies):
    main.js        # entry module: engine ticks (load/timer/visibility/focus), occurrence consumption, banners + read-only mode, storage-event last-write-wins convergence
    engine.js      # due computation: zone-correct loop steps, date countdown, occurrence stream (T5)
    notify.js      # occurrence -> notification/in-app notice: gesture-gated permission, dedupe anchor, missed marker, adopted-anchor sanitizer
    banners.js     # keyed session banners: load/save failure paths, hidden-task warnings, read-only explanation
    empty-state.js # first-run empty state: one example per reminder kind
    format.js      # task -> detail + due-status strings (engine-backed), textContent-only
    list.js        # task list: due badge, per-task Edit/Delete, textContent-only rendering
    form.js        # add/edit form; the kind picker swaps the second field; read-only disable + dedupe-anchor sync
    kinds.js       # reminder-kind registry (loop/date/counter) shared by every screen
    tasks.js       # task model: createTask with loud per-kind validation
    store.js       # loopo.tasks envelope: schemaVersion, migration, backup, atomic save
  ArggonManager/ # tracker root: work items + product docs (ArggonManager/docs/)
```

## Boundaries and layering rules

<!-- The rules reviewers enforce: allowed dependency directions, module ownership, public
     API surface, what may import what. Keep the list short and checkable. -->

- **`store.js` is the only module that may touch `localStorage`.** No other
  file reads, writes, or even names the envelope keys; everything else
  receives tasks as data.
- **`main.js` owns all listeners and all mutation orchestration.** Leaf
  modules are pure-ish helpers called with data; they never subscribe to
  page/storage events and never mutate the task list themselves.
- **`engine.js` stays DOM-free.** It computes due state and occurrences and
  reports diagnostics on the console; surfacing them in the UI would break
  its no-DOM boundary (decided: see the T6 item).
- **`notify.js` is the single `requestPermission()` call site**, reachable
  only from the permission button's click handler.
- **User text renders through `textContent`/`input.value` only** — no
  `innerHTML` anywhere in `js/` (enforced by review and smokes).
- **Task-shape changes land atomically**: `tasks.js` (model + validation),
  `store.js` (migration step), `engine.js`/`format.js` consumers, and the
  affected smokes move in the same PR.

## Invariants

<!-- Properties that must always hold (never overwrite user data, pure reads, etc.).
     These usually correspond to dedicated tests. -->

- **User data is never destroyed on read** → `store.js` migrates older
  envelopes forward and backs up unreadable/newer values write-once, primary
  untouched (spec rows 7–8; smoke row 7/8 evidence + review probes).
- **An unknown/newer envelope is never overwritten by any write in the
  session** → `futureGuard` in `main.js#persist()` refuses saves with a
  persistent banner (spec row 7; T6 browser probe).
- **A rejected save leaves the stored bytes identical** → `saveTasks`
  classifies quota/unavailable inside one `try` (spec row 10; quota smoke).
- **Each occurrence surfaces at most once per task+instant, across tabs** →
  `lastNotifiedAt` anchor written with the task, adopted anchors sanitized
  by `notify.js#sanitizeAnchors` (spec row 14; notify smokes).
- **Two tabs converge last-write-wins** → the `storage` listener adopts the
  winning envelope wholesale (schemaVersion+shape guarded; corrupt/foreign
  ignored; removed/cleared key → empty list) (spec row 12; T6 smoke).
- **No network after first load** → zero external references in shipped
  files; the app is same-origin by construction (spec row 16; grep + offline
  smoke).

---

Generated by `arggon init` 2026 — edit freely; `arggon init` never overwrites existing files.
