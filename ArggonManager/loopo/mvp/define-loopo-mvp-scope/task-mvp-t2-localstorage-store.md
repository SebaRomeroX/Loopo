---
type: task
status: done
id: task-mvp-t2-localstorage-store
title: "MVP T2: task model + localStorage store"
assignee: SebaRomeroX
branch: feat/task-mvp-t2-localstorage-store
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
depends_on: [task-mvp-t1-shell-empty-state]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t2-localstorage-store
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t2-localstorage-store.md
  Leaves live only under a story. id is the filename stem: task-mvp-t2-localstorage-store.
  CLI `arggon create task mvp-t2-localstorage-store` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T2: task model + localStorage store

## Context

Wave 1 (plan §T2): the persistence core — task model and the `loopo.tasks`
versioned envelope with atomic save, forward migration, backup of
unparseable/unknown-`schemaVersion` input, and quota-safe writes. Spec
invariant 1 ("stored tasks are never destroyed on read") is implemented here.

## Acceptance

- [x] `schemaVersion` envelope: an older envelope migrates forward; an
      unknown/newer envelope is copied to `loopo.tasks.backup` before the
      store ever resets to empty.
- [x] Unparseable JSON backs up the raw value and never crashes the load
      path (empty list + reported failure, never a silent wipe).
- [x] A save rejected by quota leaves the stored list byte-identical.

## Notes

- Depends on T1 (entry-module wiring); T3 and T4 both branch from here.
- Scope: `js/store.js` (envelope I/O) + `js/tasks.js` (model) only — no UI
  wiring in this PR; T3 imports the store for create/reload, T6 renders the
  failure banners/messages the store already returns (`unparseable`,
  `unknown-version`, `unavailable` / `quota`, `invalid-tasks`).
- Evidence (2026-10-04): scratch Node smoke (not committed — manual-smoke
  policy) ran 12 cases, all pass: fresh load; v1 round trip via one atomic
  `setItem` with no `removeItem`; v0→v1 migration in memory and on disk;
  unknown-version backed up with primary byte-identical; write-once backup
  across repeated failures (both raw values preserved); unparseable +
  structural garbage (5 shapes) each backed up, empty + reported, no throw;
  quota-rejected save byte-identical; non-list save refused with storage
  untouched; blocked storage reported on both paths; `createTask` throws on
  5 malformed inputs; no code path ever calls `removeItem` (invariant 1 by
  construction).
- Browser smoke (chromium via `playwright-cli`, real `localStorage`, page at
  320×568): fresh `{tasks:[],failure:null}`; save ok → `schemaVersion:1`
  stored → round trip; `{tasks:[…]}` (no version) migrated to v1 on disk;
  `schemaVersion:99` → `unknown-version` failure + backup written + primary
  byte-identical; `"{oops"` → `unparseable` + backup + primary untouched +
  empty list; `Storage.prototype.setItem` throwing a real
  `QuotaExceededError` → `{ok:false,type:"quota"}` and stored list
  byte-identical; T1 empty state still renders ("No reminders yet"),
  console zero entries.
- Review round (arggon-reviewer, session ses_ef62d0e71ffewGxPWU01bFki35):
  **blocker** — `defaultStorage()` was evaluated in the default-parameter
  position, before every `try`, so with blocked storage the `localStorage`
  *getter* (SecurityError) escaped `loadTasks`/`saveTasks`, falsifying the
  module's "never throws" contract. Fixed: storage is resolved inside the
  first `try` of both functions. Regression covered by Node smoke case 13
  and an in-browser probe: a throwing getter now yields
  `{tasks:[],failure:{type:"unavailable"}}` /
  `{ok:false,error:{type:"unavailable"}}`, page intact, console clean.
  **should-fix** — `ARCHITECTURE.md` code map now lists `tasks.js` +
  `store.js`. **nit** — failure messages no longer claim a backup that may
  have been skipped ("the stored value is left untouched; a backup copy is
  kept when possible"). **design note for T6** (reviewer nit): when the
  backup slot is already occupied, a later failure's raw value lives only in
  the primary key and a subsequent successful save would overwrite it — the
  T6 banner/save flow should warn or block saves after `unknown-version`.
  Full browser smoke re-run on the fixed code: every path green.

### 2026-10-05 @SebaRomeroX
Review verdict (arggon-reviewer, session ses_ef62d0e71ffewGxPWU01bFki35) — relayed by the coordinator; change requests applied.

Verdict at review: NO-MERGE (small change request) → now satisfied:

- blocker — `defaultStorage()` ran in the default-parameter position, outside every `try`: with blocked storage the `localStorage` *getter* itself throws SecurityError and escaped both functions, falsifying the module's "never throws / returns `unavailable`" contract in exactly the scenario the spec names (row 9). Fixed: storage resolved inside the first `try` of `loadTasks`/`saveTasks`. Regression: Node smoke case 13 (throwing getter → `unavailable` on both paths) + in-browser probe confirming it, page intact, console zero entries. Full browser smoke re-run green on the fixed code.
- should-fix — `ARCHITECTURE.md` code map now lists `js/tasks.js` + `js/store.js` (same-PR doc travel, T1 precedent).
- nit — failure messages tightened: "the stored value is left untouched; a backup copy is kept when possible" (never claim a possibly-skipped or older backup).
- nits left as recorded — double-failure save window: design note for T6 recorded in the item Notes (warn/block saves after `unknown-version`); `JSON.stringify` outside the try stays (programmer errors loud, storage failures classified — now documented in code).

Reviewer independently reproduced first-hand: 13-case smoke in /tmp, invariant-1 greps (zero `removeItem` anywhere; `localStorage` referenced only in store.js; unknown-version path = zero writes to the primary), migration step-chain incl. missing-step backup, five `createTask` throws, zero-line diff on T1 files, no package.json/deps, CI green (pinned seam), `arggon validate` green. Evidence table in the PR body and item Notes holds under re-execution.
