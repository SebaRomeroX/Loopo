---
type: task
status: done
id: task-mvp-t1-shell-empty-state
title: "MVP T1: static shell, mobile-first layout, empty state"
assignee: SebaRomeroX
branch: feat/task-mvp-t1-shell-empty-state
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
depends_on: [task-write-greenfield-exploration-and-mvp-spec, task-adr-0001-static-webapp-localstorage, task-write-mvp-plan, task-mvp-testing-policy]
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t1-shell-empty-state.md
  Leaves live only under a story. id is the filename stem: task-mvp-t1-shell-empty-state.
  CLI `arggon create task mvp-t1-shell-empty-state` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T1: static shell, mobile-first layout, empty state

## Context

Wave 1 of the plan (`ArggonManager/docs/plans/plan-loopo-mvp-001.md` §T1).
Builds the static entry structure every later task hangs off: `index.html`,
`styles.css`, an ES-module entry, single-column mobile-first layout, and the
empty state with one example per reminder kind. Spec:
`ArggonManager/docs/specs/spec-loopo-mvp-001.md`.

First behavior PR: `depends_on` requires the spec, ADR, plan and
testing-policy items to reach terminal status first (one branch per item).

## Acceptance

- [x] `index.html` + `styles.css` + ES-module `.js` files load straight from
      static files with no build step: no `package.json`, no bundling, no
      vendored third-party code.
- [x] First run renders an empty state listing one example task per reminder
      kind (`loop`, `date`, `counter`).
- [x] Usable at a 320 px viewport: single-column layout, no hover-only
      affordances.

## Notes

- Plan waves: T1 → T2 sequential; `task-mvp-testing-policy` must merge before
  this PR passes review (supersession of exploration round 5 recorded in the
  plan).
- Evidence (2026-10-03, author env): five static files, no `package.json`/
  `node_modules`; all five paths serve `200` from a plain
  `python3 -m http.server` (`.js` as `text/javascript`); `node --check` passes
  on all three modules; a scratch DOM-stub run of `js/main.js` (not committed —
  manual smoke is the policy) observes one `section.empty-state` with exactly
  Loop/Date/Counter × Drink water/Math exam/Called mom and non-empty details;
  CSS contains zero `:hover` rules and only `max-width` (inside the
  ≥640 px enhancement query). Visual confirmation at a 320 px viewport
  requested at PR review — no browser in the authoring environment.
- Browser smoke P1 observed (2026-10-03, chromium via `playwright-cli`,
  viewport 320×568, served by `python3 -m http.server`): `innerWidth: 320` and
  `scrollWidth: 320` (no horizontal overflow); `.examples` computed to a single
  `288px` grid track; `:hover` rules in stylesheets = 0; `h2` = "No reminders
  yet"; `aria-labelledby="empty-state-title"` resolves; exactly 3 examples
  (Loop/Drink water/"every 2 hours", Date/Math exam/"Sun, Oct 18, 2026",
  Counter/Called mom/"since Sep 24, 2026"); console zero entries after the
  explicit `data:,` favicon link; screenshot visually checked — matches.
  Probe raised by the reviewer and executed by the coordinator (owner of the
  verdict write).

### 2026-10-03 @SebaRomeroX
Review verdict (arggon-reviewer, session ses_efc3fc34bffegvSIwsEpaV5lCR) — relayed by the coordinator; conditional verdict satisfied.

Verdict at review: NO-MERGE today → MERGE once the real-browser 320 px probe (P1) is green and recorded (P1 was the reviewer's only merge gate).

P1 observed (2026-10-03, chromium via playwright-cli, viewport 320×568, python3 -m http.server):
- innerWidth 320 / scrollWidth 320 → no horizontal overflow
- `.examples` computed grid = single track "288px"
- stylesheet `:hover` rules = 0
- h2 "No reminders yet"; aria-labelledby="empty-state-title" resolves
- exactly 3 examples: Loop/Drink water/"every 2 hours", Date/Math exam/"Sun, Oct 18, 2026", Counter/Called mom/"since Sep 24, 2026"
- console: zero entries after the explicit `data:,` favicon link; screenshot visually checked
→ reviewer's own flip criterion met: verdict = MERGE.

Also applied (reviewer-endorsed): should-fix — ARCHITECTURE.md code map lists the real app tree and drops the phantom `src/` (docs travel with code); nit — `detailFor` throws on an unknown kind (2a1fa69); favicon data: link silences the automatic /favicon.ico 404 (874abc6).

Reviewer independently reproduced first-hand: static-serve 200s with text/javascript, node --check ×3, DOM-stub render byte-for-byte, TZ-stability of date/counter rendering (UTC / Kiritimati / Honolulu / Anchorage), zero-build greps, validate ok, CI green post-pin. Evidence recorded on the item Notes and in the PR body.
