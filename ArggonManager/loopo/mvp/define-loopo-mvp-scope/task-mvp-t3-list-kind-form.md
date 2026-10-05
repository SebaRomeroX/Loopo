---
type: task
status: done
id: task-mvp-t3-list-kind-form
title: "MVP T3: task list + kind-aware create/edit form"
assignee: SebaRomeroX
branch: feat/task-mvp-t3-list-kind-form
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
depends_on: [task-mvp-t2-localstorage-store]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t3-list-kind-form
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t3-list-kind-form.md
  Leaves live only under a story. id is the filename stem: task-mvp-t3-list-kind-form.
  CLI `arggon create task mvp-t3-list-kind-form` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T3: task list + kind-aware create/edit form

## Context

Wave 2, parallel-eligible with T4 (plan §T3): list view plus the add/edit
form whose kind picker (`loop`/`date`/`counter`) swaps the second field
(every-N + unit, target date, start instant); create/edit/delete wired
through the T2 store; all rendering via `textContent` only.

## Acceptance

- [x] A task can be created, edited and deleted with exactly one kind
      (`loop`/`date`/`counter`); all three kinds survive a reload.
- [x] Titles render via `textContent` only — a task titled
      `<img src=x onerror=...>` never executes.

## Notes

- File-disjoint from T4 except the entry module; if both touch it, T3 merges
  first (plan waves).
- Evidence (manual smoke, per `task-mvp-testing-policy`):
  - node scratch smoke `/tmp/opencode/t3/smoke.mjs` — 10/10 PASS: format
    details per kind, list rendering (XSS title as literal text node, zero
    `innerHTML`), form structure + kind swap, create for all three kinds with
    exactly-one-kind field checks, loud validation (empty title/every/date
    never reach `onSubmit`), edit identity (same id/zone/`lastNotifiedAt`,
    `nextAt` reset), cancel reset.
  - browser smoke (playwright chromium, 320×568, `python3 -m http.server`):
    create ×3 via real clicks (radio check + fill + submit) → envelope has
    exactly one of `rule`/`targetDate`/`startedAt` per task; reload → 4 rows
    persist (3 kinds + XSS title); edit keeps id `t_08b18f03`, detail
    re-renders `every 4 hours`, form returns to add mode; cancel clears
    without touching storage; delete removes from DOM **and** storage; XSS
    title renders as a literal text node (0 `<img>` in list,
    `window.__pwned` undefined); console 0 errors/0 warnings; layout
    `scrollWidth: 320`, 0 overflowing elements, 0 `:hover` rules, row buttons
    45 px, kind labels 44 px, inputs 16 px.
  - screenshots (add mode, edit mode with Date kind restored + field swap +
    Save/Cancel, XSS title rendered literally) reviewed during the run;
    `.playwright-cli/` removed before commit.
- Bug found and fixed during the browser smoke: author rule
  `.btn { display: inline-flex }` outranks the UA sheet's
  `[hidden] { display: none }`, so the hidden Cancel button rendered in add
  mode (`hidden: true` but `display: flex`). Fixed with a global
  `[hidden] { display: none !important }`; regression check in-browser:
  `hidden: true, display: none`.
- For T4: the loop units the form offers are `hours`/`days`/`weeks`/`months`
  (`UNITS` exported from `js/form.js`) — the engine must evaluate all four.
- For T5: editing a loop task preserves `lastNotifiedAt` (dedupe anchor) and
  resets `nextAt` to null for the engine to recompute.
- For T6: load/save failures currently go to `console.warn` in `js/main.js`;
  banner/message UI is T6's (plan §T6). T6 will also need: a form-disable
  path (API today is `element` + `edit` + `resetIfEditing`), the
  `storage`-event hook into `main.js`'s `render()`, a decision on delete
  confirmation (spec/plan silent — reviewer N-5), and the standing
  `ARCHITECTURE.md` TODO sections (Problem/Big picture/Boundaries/
  Invariants — reviewer N-6, pre-existing since T1).
- Review round 1 (verdict `approve`, no blockers):
  - **SF-1 applied**: deleting the task being edited resets the form
    (`form.resetIfEditing(id)` from `onDelete`) — "Save changes" can no
    longer resurrect a deleted row. Verified in-browser: edit → delete →
    form back to "Add reminder"; new save stores only the new task
    (`resurrected: false`).
  - **SF-2 applied**: untrusted stored entries missing their kind payload
    are skipped at the view boundary (`isRenderable`/`forDisplay` in
    `js/main.js`, warn once per entry) instead of blanking the list;
    skipped entries stay in `tasks` and persist untouched. Verified
    in-browser: seeded `kind:"banana"` + loop-without-rule → 1 row, form
    alive, storage keeps all three ids, 2 warnings / 0 errors.
  - **N-1/N-2/N-3 applied**: dead `list-slot` class dropped;
    `toLocalInput` documents why it must stay browser-local (a task-zone
    prefill would shift the stored instant); `fail()` unhides the alert
    region before writing its text so `role="alert"` announces.
  - **N-4 recorded → T4**: the form puts no upper bound on `every`
    (any integer ≥ 1) — T4's `nextAt` arithmetic must guard against
    `Invalid Date` for huge values.
  - **N-5/N-6 recorded → T6** (see the T6 note above).
- Plan overlap note (reviewer): T4's acceptance includes *display* work
  ("counter elapsed display", date countdown) that lands in T3-owned
  `js/list.js`/`js/format.js` — the plan's "T3 merges first" tiebreak
  applies to those files too, not only `js/main.js`.

### 2026-10-05 @SebaRomeroX
### Review round 1 — verdict: approve (arggon-reviewer)

PR #8 (`feat/task-mvp-t3-list-kind-form`), reviewed against `ArggonManager/docs/engineering.md`.

**Blockers: none.** Evidence rows confirmed: row 11 (`textContent`-only) structurally confirmed — zero HTML sinks anywhere in `js/`; row 1 (exactly one kind + reload) confirmed via `createTask`'s shape, the edit path rebuilding from the draft instead of merging, and the reviewer's independent re-run of the node smoke.

**Should-fixes — applied in this PR:**
- SF-1: deleting the task being edited left the form in edit mode; "Save changes" would resurrect it. Fixed with `form.resetIfEditing(id)` called from `onDelete`; in-browser regression: edit → delete → form back to "Add reminder", storage `resurrected: false`.
- SF-2: an untrusted stored entry with a bad kind payload blanked the whole list (`taskDetail` throws by design). Fixed with an `isRenderable`/`forDisplay` view boundary in `js/main.js` (warn once per entry; skipped entries stay in `tasks` and persist untouched); in-browser: seeded `kind:"banana"` + loop-without-rule → 1 row, form alive, storage keeps all ids, 2 warnings / 0 errors.

**Nits:** N-1 (dead `list-slot` class) dropped; N-2 (`toLocalInput` browser-local rationale) documented; N-3 (`fail()` unhides before writing so `role="alert"` announces) fixed. N-4 recorded → T4 (no upper bound on `every` — guard `nextAt` arithmetic against `Invalid Date`); N-5 (no delete confirmation, spec-silent) and N-6 (standing `ARCHITECTURE.md` TODO sections) recorded → T6. Reviewer's plan note recorded too: T4's display ACs land in T3-owned `list.js`/`format.js`, so "T3 merges first" covers those files, not only `main.js`.

**Disposition:** approve; SF-1/SF-2/N-1/N-2/N-3 applied and re-verified (node smoke 11/11, browser probes above); N-4..N-6 recorded on this item for downstream tasks.
