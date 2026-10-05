---
type: task
status: in_progress
id: task-mvp-t5-in-tab-notifications
title: "MVP T5: in-tab notifications - permission, dedupe, missed marker"
assignee: SebaRomeroX
branch: feat/task-mvp-t5-in-tab-notifications
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-05"
claimed_at: "2026-10-05T13:49:05.412Z"
depends_on: [task-mvp-t4-reminder-engine]
worktree_path: /home/sebarmx/Documents/GitHub/Loopo-task-mvp-t5-in-tab-notifications
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t5-in-tab-notifications.md
  Leaves live only under a story. id is the filename stem: task-mvp-t5-in-tab-notifications.
  CLI `arggon create task mvp-t5-in-tab-notifications` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T5: in-tab notifications - permission, dedupe, missed marker

## Context

Wave 3 (plan §T5): surfacing due reminders in-tab from the T4 occurrence
stream — Notification permission requested only from a user gesture, graceful
degrade to in-app due indicators when denied/unsupported, dedupe key = task id
+ occurrence instant, and a single `missed` marker for occurrences that
elapsed while the tab was closed.

## Acceptance

- [x] Permission is requested only from a user gesture; denial or missing
      support degrades to in-app due indicators (no dead ends).
- [x] Each occurrence notifies at most once; returning after a missed
      occurrence shows it once with a `missed` marker.

## Notes

- Web Push is out of scope here (post-MVP item
  `task-deliver-reminders-while-the-tab-is-closed-web-push`).
- Evidence (manual smoke, per `task-mvp-testing-policy`):
  - node scratch smoke `/tmp/opencode/t5/smoke.mjs` — 9 sections ALL PASS:
    (1) model anchors — `date`/`loop` carry `lastNotifiedAt`, `counter`
    does not; (2) permission row — zero requests on creation, exactly one
    request from the click, granted hides the row, denied swaps the button
    for the honest hint (no re-prompt), rejected prompt keeps the button,
    unsupported shows nothing and a forced click cannot throw; (3) granted
    path — one system notification, `tag = id@instant`, body
    `Loop: every 1 day`, next occurrence fires, `Missed —` prefix on
    `missed`, literal title, **no** in-app notice (spec's "instead");
    (4) denied path — in-app notices, `<script>` title literal, zero
    `innerHTML` in the tree, one missed chip, date anchored on its
    `targetDate`; (5) notice cap 8, constructor refusal falls back to
    in-app, ghost task skipped; (6) corrupt payload — no throw, anchor
    still recorded, warned once; (7) cross-tab — a synced anchor
    suppresses the duplicate (no second notification); (8) form —
    date/loop edits carry `lastNotifiedAt`, loop edit restarts `nextAt`
    at null, empty-title validation intact; (9) list regression — 3 cards,
    XSS literal, no `innerHTML`, status lines present. T4 engine smoke
    re-run against this tree: **7/7 ALL PASS**.
  - browser smoke (playwright chromium, 320×568, real page):
    - **gesture-only**: after load `Notification.permission` stayed
      `default` with 0 recorded requests; instrumenting
      `requestPermission` then a real click gave **exactly 1** call →
      headless Chrome resolved `denied` → button hid and the hint
      "Notifications are blocked — due reminders stay visible in the
      list." appeared (no dead end).
    - **once + missed marker**: seeded one live loop, one loop 10 min
      overdue and one due-today date (all anchors `null`) → reload showed
      **3 notices**, the overdue one with the red `missed` chip +
      `notice--missed` card, anchors persisted (`id@instant` values);
      a second reload showed **0 notices** (the date re-emits from the
      engine's per-session set but the persisted anchor suppresses it).
    - **granted path**: with `Notification.permission` forced to
      `granted` via a spy subclass around the real API, creating a
      due-today task through the form fired **1** real system
      notification — title `Ship it` (literal), body
      `Date: Mon, Oct 5, 2026`, tag `t_dd938fd2@2026-10-05` — and **0**
      in-app notices; anchor written.
    - **XSS in notices**: title `<img src=x onerror=pwned>` rendered
      literal — 0 `img` elements inside `.notices`.
    - layout: `scrollWidth: 320`, 0 overflowing elements, 0 `:hover`
      rules; console **0 errors / 0 warnings** across the session.
      Screenshots (header hint + notices with missed chip) reviewed;
      `.playwright-cli/` removed before commit.
- Design decisions (plan §T5 leaves these open):
  - **Presentation split**: granted → system notification *only*;
    denied/unsupported/constructor-throw → in-app notice card
    (spec Synopsis "due reminders surface in-app *instead*"). The anchor
    is written **before** presenting, so a failed presentation still
    counts as shown — at-most-once outranks showing (no storm).
  - **Dedupe key** = task id + occurrence instant, stored in
    `lastNotifiedAt` (loop: the consumed `nextAt`; date: the
    `targetDate`). `date` tasks gained the field in `createTask`;
    `counter` never gets one (it never notifies — no dead field). Form
    edits carry the anchor for every kind.
  - **Cross-tab**: a narrow `storage` listener copies only
    `lastNotifiedAt` anchors from the other tab (spec row 15); full
    last-write-wins task convergence is T6's. Best-effort against the
    simultaneous-tick race; the window is documented.
  - **Permission row** (page header): `default` → gesture button,
    `granted` → hidden, `denied` → muted hint with no button (never
    re-prompts), unsupported → hidden entirely (no dead-end control).
    `requestPermission()` exists only inside the click handler.
  - **Notices**: session-only list, one add per occurrence, capped at
    the newest 8; `missed` marker = red chip + red card border in-app,
    `Missed —` body prefix + unique OS `tag` for the system path (never
    color-only).
- For T6: the `storage` listener in `js/main.js` is anchor-only dedupe —
  fold it into your full convergence handler. Banner candidates: the
  engine `warnOnce` sites plus the notice-failure warning (ids only —
  map id → title for display). `document.hidden` gating of the 30 s
  interval remains open (spec Synopsis wording).
