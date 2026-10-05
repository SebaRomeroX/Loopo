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
    (`MISSED_SLACK_MS`) carries `missed: true`. Chrome's ~1/min hidden-tab
    throttling stays *under* the slack (so a background tab is not marked
    missed); a suspended/closed tab, a cold reload hours later, or any
    absence beyond the slack lands there. Live ticks never do.
    A **date** task has no sub-day lateness: its `missed` flag means the
    target is already ≥1 day overdue when the occurrence surfaces.
  - **Cap**: more than 1 000 missed loop steps anchor `nextAt` from `now`
    (O(1)) with a warn-once; an unschedulable rule clears `nextAt` instead
    of storming (the due occurrence still surfaces exactly once).
  - **Date occurrences** emit once per page session (module set keyed
    `id + targetDate`); `counter` never emits — spec shows it as elapsed
    display, notifications are T5's call. Re-emission across reloads is
    T5's `lastNotifiedAt` to dedupe.
- Review round 1 (independent `arggon-reviewer` on PR #9 →
  `request-changes`): **B1** (blocker) — a huge-but-integer `every` in
  `hours` (the form's number input is unbounded) could yield a
  finite-but-unrepresentable instant whose `toISOString()` threw
  `RangeError`, crashing `tick` and blanking the list. Fixed at the single
  choke point: `nextAfter` bounds the hours step to `MAX_TIME_MS` and every
  persisted instant now goes through `toIsoOrNull` (belt-and-braces).
  Also applied: **S1** distinct warn-once keys (`unschedulable:`/`cap:`),
  **S2** the tick loop branch consumes `evaluateTask` (one due truth, not a
  re-implementation), **S3** the render gate reports the concrete reason
  (`renderProblem`: unknown kind / invalid IANA zone / missing payload),
  **N2** session set keyed `id + targetDate`, **N3** loop-badge
  reachability comment; **N6** and the T5/T6 items above absorbed from the
  review. Re-verified: engine smoke extended with B1 probes (sections 3 +
  6h), T3 regression 11/11, reviewer's one-liner probe prints
  `no throw, nextAt: null`.
- For T5: occurrence shape is `{ taskId, kind: "loop"|"date", at, missed }`
  where `at` is the consumed loop `nextAt` (ISO) or the date's `targetDate`
  (date-only string) — dedupe key = `taskId + at`. `tick()` returns them;
  `js/main.js` marks the consumption seam in `runEngine()`. Writing
  `lastNotifiedAt` remains T5's. Pitfalls to design around:
  - Occurrences are **per-tab observations** — a second open tab sees the
    same crossing, so cross-tab dedupe must be storage-backed
    (`lastNotifiedAt` + `storage` events), not the session set.
  - **Background throttling stays under the 2-min slack** — T5 must not
    treat `missed: false` as "fired exactly on time", nor assume lateness
    implies `missed: true`.
  - Editing a `date` task currently **drops `lastNotifiedAt`** (`createTask`
    only carries it for loops) — T5 must extend the carry-over or pick a
    different carrier, or an edited target re-notifies after reload.
  - In-app loop indicators should be driven by the **occurrence stream**,
    not `taskStatus`'s `Due now` badge (the badge is normally unreachable —
    every render path ticks first; see `js/format.js`).
- For T6: engine `warnOnce` diagnostics (unschedulable rule, step-cap
  anchor) are banner candidates alongside the load/save warnings; banners
  keyed by task id must **map id → title** for display (warn messages only
  carry ids to avoid leaking untrusted titles into every console). The
  interval's `document.hidden` gating stays open (spec Synopsis's "on a
  timer while open" — no acceptance row covers it).

### 2026-10-05 @SebaRomeroX
## Review verdict (PR #9): **approve** (round 2) — after request-changes (round 1)

Independent `arggon-reviewer`, both rounds against the engineering bar.

**Round 1 → request-changes** — one blocker, three should-fixes, nits:

- **B1 (blocker)**: a huge-but-integer `every` in `hours` (the form's
  number input is unbounded) produced a finite-but-unrepresentable
  instant; `toISOString()` threw `RangeError`, crashing `tick` and
  blanking the list. Reachable from plain UI input — violated the
  "never throw / never blank" bar.
- S1 warn-once key collision; S2 tick's loop branch re-implemented due
  truth instead of calling `evaluateTask`; S3 the skip warning blamed
  "kind payload" for invalid-zone tasks; N2–N6 (session-set keying,
  loop-badge comment, PR citation, warn ids, missed-slack wording).

**Fixes (e0d7549)**: `nextAfter` bounds the hours step to `MAX_TIME_MS`
and every persisted instant goes through the guarded `toIsoOrNull`
writer; distinct warn keys `unschedulable:`/`cap:`; loop branch consumes
`evaluateTask`; `renderProblem` reports the concrete reason; session set
keyed `id + targetDate`; N3/N4/N6 done; N5 dispositioned (ids in logs,
id→title mapping recorded as T6 requirement); T5 pitfalls recorded on
this item (cross-tab storage dedupe, throttled-but-not-missed, date
`lastNotifiedAt` dropped on edit, stream-driven loop indicators).

**Round 2 → approve** (verified by execution on e0d7549):

- B1 probes A–E all `no throw` (advance, init, days-unit, 1e300 hours);
  boundary probe confirms normal rules unaffected (`every:1` hours →
  exact +1 h). `toIsoOrNull` is the only `toISOString()` writer in the
  engine.
- Engine smoke extended with discriminating B1 cases (rule guards +
  6h init/advance) — **7/7 ALL PASS**; these fail against the pre-fix
  head 70eeb34. T3 regression smoke **11/11**. `arggon validate` ok,
  `node --check` ×9, CI `tasks-validate` green on e0d7549 (run
  37262957175), head SHA matches local.
- Behavior of the S2 change proven identical: smoke 6a–6g expected
  values pass unmodified.
- Evidence rows 4/5/6 re-confirmed as holding (stepping math, format,
  refresh wiring untouched by the fix commit).

MVP testing exception applies (`task-mvp-testing-policy`): smokes are
scratch-only in `/tmp/opencode/t4/`, evidence recorded on the item and
in the PR body.
