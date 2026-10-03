---
type: task
status: in_progress
id: task-write-mvp-plan
title: Write the Loopo MVP implementation plan
assignee: SebaRomeroX
branch: feat/task-write-mvp-plan
parent: define-loopo-mvp-scope
labels: [documentation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
claimed_at: "2026-10-03T20:07:54.122Z"
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-write-mvp-plan
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-write-mvp-plan.md
  Leaves live only under a story. id is the filename stem: task-write-mvp-plan.
  CLI `arggon create task write-mvp-plan` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# Write the Loopo MVP implementation plan

## Context

The pipeline artifact after the ADR: exploration → ADR → spec → **plan**.
`ArggonManager/docs/plans/plan-loopo-mvp-001.md` breaks the spec
(`spec-loopo-mvp-001.md`, ADR 0017 gate — analyze clean) into six ordered
tasks T1–T6 with waves, and each task mirrors a tracked implementation item
whose `depends_on` edges encode the ordering.

## Acceptance

- [x] `ArggonManager/docs/plans/plan-loopo-mvp-001.md` exists with the
      `templates/plan.md` frontmatter (`plan_id`, `title`, `spec`, `status`,
      `created`) and the `## Tasks` / `### Tn` sections.
- [x] Every task carries a verifiable acceptance criterion that maps to spec
      acceptance rows; all 17 spec rows are covered exactly once (3+3+2+3+2+4).
- [x] Ordering/gates recorded: ADR 0017 gate, terminal prerequisites for T1,
      wave structure (parallel T3/T4 noted with merge tiebreak).
- [x] The round-5 "same PR" testing-policy phrasing is superseded in the plan
      (own docs PR first, one-branch-per-item) — recorded, not swapped.
- [x] Six implementation items created under `define-loopo-mvp-scope` with
      `depends_on` edges matching the plan (verified with `arggon list --json`).
- [x] `arggon spec validate` passes for the plan file; `arggon validate` green.
- [x] Draft PR opened referencing this item id: **#4**
      (`feat/task-write-mvp-plan`).
- [ ] PR merged after coordinator review.

## Notes

- Implementation items are created from the primary checkout so their files
  land on `main` and are claimable immediately (the worktree-base lesson from
  the ADR claim).
- `spec validate` was run with the spec file materialized from PR #1's
  branch; on the plan branch alone it reports `PLAN_SPEC_NOT_FOUND` (pure
  file-existence check, clears when PR #1 merges). CI does not run
  `spec validate` — it runs `arggon validate`, which is green.
- Merge order: `#3 → #1 → #2 → #4`.
