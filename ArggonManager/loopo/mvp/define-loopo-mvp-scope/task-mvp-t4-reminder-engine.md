---
type: task
status: todo
id: task-mvp-t4-reminder-engine
title: "MVP T4: reminder engine - zone-correct loop/date/counter"
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
depends_on: [task-mvp-t2-localstorage-store]
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t4-reminder-engine.md
  Leaves live only under a story. id is the filename stem: task-mvp-t4-reminder-engine.
  CLI `arggon create task mvp-t4-reminder-engine` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T4: reminder engine - zone-correct loop/date/counter

## Context

Wave 2, parallel-eligible with T3 (plan §T4): due computation over the
stored IANA zone (`Date` + `Intl.DateTimeFormat`, ADR 0001) — `loop`
recurrence keeping wall-clock time across DST transitions, `date` countdown,
`counter` elapsed; recomputed on load, on a timer while open, and on
`visibilitychange`/focus.

## Acceptance

- [ ] A `loop` rule fires at the same wall-clock time after a DST transition
      in its stored zone.
- [ ] A `date` task reaches due without rendering negative day counts.
- [ ] A `counter` task's elapsed display refreshes while the app is open.

## Notes

- Produces the occurrence stream that T5 dedupes.
