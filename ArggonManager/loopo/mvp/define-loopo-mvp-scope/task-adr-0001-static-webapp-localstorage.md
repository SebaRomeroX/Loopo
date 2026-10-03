---
type: task
status: in_progress
id: task-adr-0001-static-webapp-localstorage
title: "Record ADR 0001: static webapp + localStorage for the Loopo MVP"
assignee: SebaRomeroX
branch: feat/task-adr-0001-static-webapp-localstorage
parent: define-loopo-mvp-scope
labels: [documentation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
claimed_at: "2026-10-03T18:52:13.243Z"
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-adr-0001-static-webapp-localstorage
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-adr-0001-static-webapp-localstorage.md
  Leaves live only under a story. id is the filename stem: task-adr-0001-static-webapp-localstorage.
  CLI `arggon create task adr-0001-static-webapp-localstorage` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# Record ADR 0001: static webapp + localStorage for the Loopo MVP

## Context

The exploration (`ArggonManager/docs/explorations/exploration-loopo-mvp-001.md`,
rounds 1–5) ended on a cross-cutting decision — stack + persistence +
hosting — which `ArggonManager/docs/engineering.md` §ADRs requires to be
recorded as an ADR under `ArggonManager/docs/adr/`. The exploration itself
names the target path (`0001-static-webapp-localstorage.md`), and the spec
(`ArggonManager/docs/specs/spec-loopo-mvp-001.md`) links to it as the decision
of record.

## Acceptance

- [x] `ArggonManager/docs/adr/0001-static-webapp-localstorage.md` exists with
      the template sections: Status / Date / Deciders, Context, Decision,
      Consequences, Alternatives considered.
- [x] Status is `Proposed` (it becomes `Accepted` on merge, per §ADRs).
- [x] Grounded in `exploration-loopo-mvp-001.md` with links to the exploration
      and the spec; no decision claims that neither artifact supports.
- [x] All three exploration supersessions are recorded as supersessions, not
      silent swaps: hosted+GitHub Auth → static GitHub Pages with no accounts;
      OAuth → skipped; TypeScript + Vite → zero-build.
- [x] Consequences name the accepted costs (no sync/backup, no delivery while
      the tab is closed, no type-checking/automated tests) with their tracked
      follow-up items where they exist.
- [x] `arggon validate` green on the branch.
- [x] Draft PR opened referencing this item id.
- [x] PR merged after coordinator review (ADR status flips to `Accepted` in
      the merge).

## Notes

- Follow-ups already tracked: `task-deliver-reminders-while-the-tab-is-closed-web-push`
  (post-MVP), `task-mvp-testing-policy` (review-bar conflict), and the
  ADR 0017 implementation gate is satisfied by the spec's clean
  `arggon spec analyze`.
- Merge sequencing: PR #1 (exploration + spec + item definitions) must merge
  first; this PR links files that PR #1 introduces.

### 2026-10-03 @SebaRomeroX
Review verdict (arggon-reviewer, session ses_efc7dcc11ffeyGmrHsoh4UroVn) — relayed by the coordinator; change requests applied in 704f4dc.

Recommendation: was "no-merge as-is" → now MERGE, after PR #1 (merge order #3 → #1 → #2 → #4 → #5).

Change requests applied (704f4dc):
- "The binding constraints, all recorded in exploration round 5" → "rounds 3–5" (the lead-in contradicted its own bullet citing round 3).
- "synchronous single-tab API" → "synchronous API shared across tabs (two-tab changes converge via the storage event, last-write-wins)"; "the spec's edge-case table" → "the exploration's edge-case table, as adopted by the spec's acceptance criteria".
- nit: "which resolves the conflict" → "which tracks the resolution" (policy item not landed on this branch).
- left: approach-C round attribution, folded supersessions bullet — reviewer judged defensible.

Verified by reviewer: all five Decision items trace to exploration/spec; Temporal treatment correct (not Baseline; polyfill forbidden); alternatives fair; consequences follow; validate green; 7/8 boxes honest.
Post-merge bookkeeping: flip Status Proposed → Accepted with the merge, tick the final box, set item done.
