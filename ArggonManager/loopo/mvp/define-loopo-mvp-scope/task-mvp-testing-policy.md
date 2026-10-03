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

- [ ] `ArggonManager/docs/engineering.md` (or an approved amendment) states
      the Loopo MVP exception: manual smoke with expected-vs-observed evidence
      recorded on the PR, in place of automated tests, for MVP-scope items.
- [ ] The exception's scope is explicit (frontend-only MVP items; not a
      blanket exemption for future backend/tooling work).
- [ ] Exploration round-5 wording superseded ("same PR as first behavior
      change" → "own docs PR before T1") — recorded in this item and the
      plan.
- [ ] PR merged (docs-only, smoke-exempt).

## Notes

- Blocks `task-mvp-t1-shell-empty-state` via `depends_on` (priority p2 —
  dependency gating is readiness-based, not priority-based).
