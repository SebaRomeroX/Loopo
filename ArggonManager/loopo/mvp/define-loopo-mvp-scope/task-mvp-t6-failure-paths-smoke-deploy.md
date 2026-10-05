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

- [ ] Storage blocked (`SecurityError`) → session-local read-only mode with a
      visible banner; create/edit disabled.
- [ ] A change in one tab appears in the other tab via the `storage` event,
      last-write-wins.
- [ ] No network after first load: the app still opens and computes due
      state.
- [ ] Manual smoke of every spec acceptance row passes; expected-vs-observed
      evidence recorded on the PR.

## Notes

- Depends on T3 and T5 (transitively T4). `task-mvp-testing-policy` must have
  landed before review (this item closes the manual-smoke row).
