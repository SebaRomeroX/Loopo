---
type: task
status: in_progress
id: task-mvp-t4-reminder-engine
title: "MVP T4: reminder engine - zone-correct loop/date/counter"
assignee: SebaRomeroX
branch: feat/task-mvp-t4-reminder-engine
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
claimed_at: "2026-10-05T03:31:15.499Z"
depends_on: [task-mvp-t2-localstorage-store]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t4-reminder-engine
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

- [x] A `loop` rule fires at the same wall-clock time after a DST transition
      in its stored zone.
- [x] A `date` task reaches due without rendering negative day counts.
- [x] A `counter` task's elapsed display refreshes while the app is open.

## Notes

- Produces the occurrence stream that T5 dedupes.
- Evidence (manual smoke, per `task-mvp-testing-policy`):
  - node scratch smoke `/tmp/opencode/t4/smoke.mjs` — 7 sections ALL PASS:
    (1) daily 09:00 `Europe/Berlin` steps across the 2026-03-29 spring-forward
    in 23 h and the 2026-10-25 fall-back in 25 h, wall hour stays `09`
    both times; (2) unit semantics — hours = real elapsed, weeks = wall +14 d,
    months clamp Jan 31 → Feb 28; (3) zero/negative/fractional/huge/bad-unit/
    bad-zone rules → `null` (review N-4); (4/5) `evaluateTask`/`taskStatus` —
    zone-correct "today" (Kiritimati +14 vs UTC), `in 3 days`/`in 1 day`/
    `Due today`/`Overdue` (no digits, no minus), elapsed forms `0m`/`1h 25m`/
    `2d 3h`; (6) `tick` init/live/missed/cap/absurd/corrupt paths — one
    occurrence per crossing, warn-once, no storm; (7) date stream emits once
    per session (on-time + `missed`), counter/unknown-kind silent.
    T3 regression smoke re-run against this tree: 11/11 PASS.
  - browser smoke (playwright chromium, 320×568): created all three kinds via
    real clicks — statuses `in 3 days` + `1h 30m elapsed`, loop `nextAt`
    initialized at commit ≈ now+1 h (`loopInitWithinAnHour: true`); seeded an
    overdue `date` and a `loop` anchored `2026-03-28T08:00:00Z` (09:00 CET)
    → after reload the engine advanced it to `2026-10-05T07:00:00Z` with
    Berlin wall `hour=09` (crossed the spring-forward, stayed in the future);
    overdue card shows `Overdue` (0 digits) with the `task--due` class;
    `visibilitychange`/`focus` dispatch re-render synchronously
    (element identity swap); over a 66 s wait the 30 s timer re-rendered and
    the counter line advanced `1h 31m elapsed` → `1h 32m elapsed`;
    layout `scrollWidth: 320`, 0 overflowing elements, 0 `:hover` rules;
    console 0 errors / 0 warnings. Screenshots (statuses list + overdue card)
    reviewed during the run; `.playwright-cli/` removed before commit.
- Design decisions (plan §T4 leaves these open):
  - **Unit semantics**: `days`/`weeks`/`months` step by wall-clock field
    arithmetic in the stored zone (invariant 4 — 09:00 stays 09:00 even
    though that day lasts 23/25 real hours); `hours` steps by real elapsed
    time (a 2-hour cadence is elapsed time, not a wall-clock appointment).
    - **First `nextAt`**: one full rule from the first time the engine sees
    the task (create/edit/first load), persisted immediately so reloads keep
    the anchor. T3's edit path resets `nextAt` → engine re-anchors on rule
    change (documented in `js/form.js`).
  - **Missed detection**: a crossing observed more than 2 min late
    (`MISSED_SLACK_MS`) carries `missed: true` — a throttled background
    timer or a closed tab both land there; live ticks never do.
  - **Cap**: more than 1 000 missed loop steps anchor `nextAt` from `now`
    (O(1)) with a warn-once; an unschedulable rule clears `nextAt` instead
    of storming (the due occurrence still surfaces exactly once).
  - **Date occurrences** emit once per page session (module set); `counter`
    never emits — spec shows it as elapsed display, notifications are T5's
    call. Re-emission across reloads is T5's `lastNotifiedAt` to dedupe.
- For T5: occurrence shape is `{ taskId, kind: "loop"|"date", at, missed }`
  where `at` is the consumed loop `nextAt` (ISO) or the date's `targetDate`
  (date-only string) — dedupe key = `taskId + at`. `tick()` returns them;
  `js/main.js` marks the consumption seam in `runEngine()`. Writing
  `lastNotifiedAt` remains T5's.
- For T6: engine `warnOnce` diagnostics (unschedulable rule, step-cap
  anchor) are banner candidates alongside the load/save warnings.
