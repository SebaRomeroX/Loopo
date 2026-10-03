---
type: task
status: in_progress
id: task-mvp-t1-shell-empty-state
title: "MVP T1: static shell, mobile-first layout, empty state"
assignee: SebaRomeroX
branch: feat/task-mvp-t1-shell-empty-state
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
claimed_at: "2026-10-03T21:42:25.774Z"
depends_on: [task-write-greenfield-exploration-and-mvp-spec, task-adr-0001-static-webapp-localstorage, task-write-mvp-plan, task-mvp-testing-policy]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t1-shell-empty-state
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t1-shell-empty-state.md
  Leaves live only under a story. id is the filename stem: task-mvp-t1-shell-empty-state.
  CLI `arggon create task mvp-t1-shell-empty-state` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T1: static shell, mobile-first layout, empty state

## Context

Wave 1 of the plan (`ArggonManager/docs/plans/plan-loopo-mvp-001.md` §T1).
Builds the static entry structure every later task hangs off: `index.html`,
`styles.css`, an ES-module entry, single-column mobile-first layout, and the
empty state with one example per reminder kind. Spec:
`ArggonManager/docs/specs/spec-loopo-mvp-001.md`.

First behavior PR: `depends_on` requires the spec, ADR, plan and
testing-policy items to reach terminal status first (one branch per item).

## Acceptance

- [ ] `index.html` + `styles.css` + ES-module `.js` files load straight from
      static files with no build step: no `package.json`, no bundling, no
      vendored third-party code.
- [ ] First run renders an empty state listing one example task per reminder
      kind (`loop`, `date`, `counter`).
- [ ] Usable at a 320 px viewport: single-column layout, no hover-only
      affordances.

## Notes

- Plan waves: T1 → T2 sequential; `task-mvp-testing-policy` must merge before
  this PR passes review (supersession of exploration round 5 recorded in the
  plan).
