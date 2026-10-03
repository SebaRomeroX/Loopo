---
type: task
status: in_progress
id: task-mvp-testing-policy
title: "Reconcile testing policy: manual smoke vs review bar"
assignee: SebaRomeroX
branch: feat/task-mvp-testing-policy
parent: define-loopo-mvp-scope
labels: [documentation]
priority: p2
created: "2026-10-03"
updated: "2026-10-03"
claimed_at: "2026-10-03T20:22:06.594Z"
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-testing-policy
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-testing-policy.md
  Leaves live only under a story. id is the filename stem: task-mvp-testing-policy.
  CLI `arggon create task mvp-testing-policy` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# Reconcile testing policy: manual smoke vs review bar

## Context

`docs/engineering.md`'s review bar expects automated tests; the MVP spec
chose manual smoke only (the 0-dependency constraint rules out a test
harness). Exploration round 5 flagged the conflict and originally planned to
resolve it "in the same PR as the first behavior change". One branch per item
makes a shared PR impossible, so the resolution ships as its own docs PR
**before** the first behavior claim — `task-mvp-t1-shell-empty-state` depends
on this item. Supersession recorded here and in
`ArggonManager/docs/plans/plan-loopo-mvp-001.md`, not swapped silently.

## Acceptance

- [x] `ArggonManager/docs/engineering.md` (or an approved amendment) states
      the Loopo MVP exception: manual smoke with expected-vs-observed evidence
      recorded on the PR, in place of automated tests, for MVP-scope items.
- [x] The exception's scope is explicit (frontend-only MVP items; not a
      blanket exemption for future backend/tooling work).
- [x] Exploration round-5 wording superseded ("same PR as first behavior
      change" → "own docs PR before T1") — recorded in this item and the
      plan.
- [x] PR merged (docs-only, smoke-exempt).

## Notes

- Blocks `task-mvp-t1-shell-empty-state` via `depends_on` (priority p2 —
  dependency gating is readiness-based, not priority-based).
- Draft PR: **#5** (`feat/task-mvp-testing-policy`). CI is expected red on
  the drift gate until PR #3 merges (the merge ref carries the un-pinned
  workflow — same known issue as #1/#2/#4); re-run after #3 merges.
- Drift-gate safety verified: `arggon init --no-commit` with the pinned
  generator preserves the amended `engineering.md` (only the excluded
  `.convention.yml` goes dirty).

### 2026-10-03 @SebaRomeroX
Review verdict (arggon-reviewer, session ses_efc7dcc0effeaxM1TSurT7V3lF) — relayed by the coordinator; change request applied in 07ab1ef.

Recommendation: was "no-merge as-is" → now MERGE, after #3's re-run (merge order #3 → … → #5).

Change request applied (07ab1ef): engineering.md's Definition-of-done line "Tests green locally and in CI (including lint/typecheck gates)" — the one line the exception did not reach — now carries the MVP pointer (no lint/typecheck gates exist in the 0-dependency scope; the manual-smoke exception satisfies it). Without this, a literal reading would block every future MVP PR — the exact conflict this task exists to eliminate.

Verified by the reviewer: the three touch points (checklist :13, smoke gate :29, Testing expectations) are mutually consistent; the scope guard is explicit and frontend-only (backend/sync/tooling/dependency changes fall back to the default bar); the round-5 supersession is triangulated (this item, plan-loopo-mvp-001, engineering.md) and now also pointed to from the exploration row (PR #1, 7607d84); validate green; diff scope clean; drift-gate safety supported by the file's own footer.

Nits left: the plan path dangles on main until PR #4 (merge-order only; the amended doc itself has no dangling refs).
