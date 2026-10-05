---
type: task
status: in_progress
id: task-mvp-t3-list-kind-form
title: "MVP T3: task list + kind-aware create/edit form"
assignee: SebaRomeroX
branch: feat/task-mvp-t3-list-kind-form
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
claimed_at: "2026-10-05T02:26:27.070Z"
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
  banner/message UI is T6's (plan §T6).
