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

- [ ] `ArggonManager/docs/adr/0001-static-webapp-localstorage.md` exists with
      the template sections: Status / Date / Deciders, Context, Decision,
      Consequences, Alternatives considered.
- [ ] Status is `Proposed` (it becomes `Accepted` on merge, per §ADRs).
- [ ] Grounded in `exploration-loopo-mvp-001.md` with links to the exploration
      and the spec; no decision claims that neither artifact supports.
- [ ] All three exploration supersessions are recorded as supersessions, not
      silent swaps: hosted+GitHub Auth → static GitHub Pages with no accounts;
      OAuth → skipped; TypeScript + Vite → zero-build.
- [ ] Consequences name the accepted costs (no sync/backup, no delivery while
      the tab is closed, no type-checking/automated tests) with their tracked
      follow-up items where they exist.
- [ ] `arggon validate` green on the branch.
- [ ] Draft PR opened referencing this item id.
- [ ] PR merged after coordinator review (ADR status flips to `Accepted` in
      the merge).

## Notes

- Follow-ups already tracked: `task-deliver-reminders-while-the-tab-is-closed-web-push`
  (post-MVP), `task-mvp-testing-policy` (review-bar conflict), and the
  ADR 0017 implementation gate is satisfied by the spec's clean
  `arggon spec analyze`.
- Merge sequencing: PR #1 (exploration + spec + item definitions) must merge
  first; this PR links files that PR #1 introduces.
