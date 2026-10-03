---
type: task
status: done
id: task-write-greenfield-exploration-and-mvp-spec
title: Write greenfield exploration and MVP spec
assignee: SebaRomeroX
branch: feat/task-write-greenfield-exploration-and-mvp-spec
parent: define-loopo-mvp-scope
labels: [documentation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
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
- [x] Draft PR reviewed and merged with this item id referenced.

## Notes

### 2026-10-03 @SebaRomeroX
Review verdict (arggon-reviewer, session ses_efc7dcc13ffeR4Wsbzhd78e2Lq) — relayed by the coordinator; change requests applied in b928495 and 7607d84.

Recommendation: MERGE (was conditional on two coordinator-run probes; both pass):
- `arggon spec validate --json` → ok:true, errors:[] (evidence for ticked box 4).
- `arggon spec analyze --json` → ambiguity/consistency/decisions findings all empty (evidence for ticked box 5; ADR 0017 gate holds).

Change requests applied:
- should-fix: four exploration Resolution cells didn't match where each case landed (limits/quota bound, visibilitychange recompute, ?debug=1 opt-in, SW-notification vs in-app) — cells corrected to the spec's actual resolution (b928495).
- the "acceptance criteria ARE the edge-case rows" claim (spec intro + this item's Context) softened to derived-from with an explicit maps-to rule (b928495).
- nits: classification section past-tensed (b928495); round-5 testing-policy row now points at the recorded supersession (7607d84).
- left as recorded: PR-body staleness (refresh at undraft), `status: settled` (validator accepts).

Reviewer praise: six-phase protocol coverage incl. the 13th dimension; spec matches templates/spec.md; 17 verifiable ACs; honest 7/8 checklist.
