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

- [ ] A task can be created, edited and deleted with exactly one kind
      (`loop`/`date`/`counter`); all three kinds survive a reload.
- [ ] Titles render via `textContent` only — a task titled
      `<img src=x onerror=...>` never executes.

## Notes

- File-disjoint from T4 except the entry module; if both touch it, T3 merges
  first (plan waves).
