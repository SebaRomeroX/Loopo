---
type: task
status: in_progress
id: task-write-greenfield-exploration-and-mvp-spec
title: Write greenfield exploration and MVP spec
assignee: SebaRomeroX
branch: feat/task-write-greenfield-exploration-and-mvp-spec
parent: define-loopo-mvp-scope
labels: [documentation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
claimed_at: "2026-10-03T16:40:28.974Z"
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-write-greenfield-exploration-and-mvp-spec
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-write-greenfield-exploration-and-mvp-spec.md
  Leaves live only under a story. id is the filename stem: task-write-greenfield-exploration-and-mvp-spec.
  CLI `arggon create task write-greenfield-exploration-and-mvp-spec` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# Write greenfield exploration and MVP spec

## Context

Greenfield gate (ADR 0017) for the Loopo MVP. Produces the two upstream
artifacts that unlock implementation:

1. Exploration: `ArggonManager/docs/explorations/exploration-loopo-mvp-001.md`
   (six-phase protocol, rounds 1–5, edge-case hunt).
2. Spec: `ArggonManager/docs/specs/spec-loopo-mvp-001.md` — its acceptance
   criteria are derived from the exploration's edge-case rows (each row maps
   to an acceptance row, a Synopsis invariant, or an explicit supersession).

## Acceptance

- [x] Exploration recorded with classification, frontier-round log (1–5),
      full 13-row edge-case table, 3 approaches and one recommendation.
- [x] Round-5 clarifications applied: zero-build vanilla JS, mobile-first,
      reminder kinds `loop`/`date`/`counter`, manual smoke.
- [x] Spec written with Purpose (invariants + non-goals), Synopsis (storage
      envelope, UI, failure paths) and testable Acceptance rows.
- [x] `arggon spec validate` → `ok: true`.
- [x] `arggon spec analyze` → no findings (ambiguity, consistency, decisions).
- [x] `arggon validate` green before every commit.
- [x] Follow-ups filed as tracked items (ADR 0001, testing policy, Web Push).
- [ ] Draft PR reviewed and merged with this item id referenced.

## Notes
