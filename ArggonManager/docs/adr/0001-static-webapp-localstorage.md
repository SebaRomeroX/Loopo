# ADR 0001: Static webapp + localStorage for the Loopo MVP

- **Status:** Accepted
- **Date:** 2026-10-03
- **Deciders:** SebaRomeroX (product owner); Loopo MVP scope exploration, rounds 1–5

## Context

Loopo's MVP is a mobile-first reminder/to-do web app. A task carries exactly
one reminder kind — `loop` (recurring), `date` (countdown to a fixed instant),
or `counter` (elapsed since a start instant) — each computed in the task's
stored IANA zone. The scope was settled by the greenfield exploration
[`exploration-loopo-mvp-001.md`](../explorations/exploration-loopo-mvp-001.md);
the edge-case rows of that exploration are the acceptance criteria of the spec
[`spec-loopo-mvp-001.md`](../specs/spec-loopo-mvp-001.md).

The binding constraints, recorded in exploration rounds 3–5:

- **Zero dependencies, including tooling.** "0 if it's possible" applies to
  build tooling too: no `package.json`, no bundler, no install step.
- **No backend, no auth, no sync or backup in the MVP.** The loss risk of
  device-only data is explicitly accepted (round 3).
- **GitHub Pages hosting** — static files over HTTPS, no server runtime.
- **Notifications in-tab only** for the MVP; delivery while the tab is closed
  is deferred (tracked as
  `task-deliver-reminders-while-the-tab-is-closed-web-push`, label `post-mvp`).
- **Manual smoke testing only** for the MVP (see `task-mvp-testing-policy`,
  which tracks the resolution of the conflict with the review bar in
  `ArggonManager/docs/engineering.md`).

This ADR records the cross-cutting stack decision (stack + persistence +
hosting) that those constraints force. Reminder semantics, failure paths and
acceptance criteria stay in the spec; they are deliberately not restated here.

## Decision

1. **Static, zero-build frontend.** `index.html`, `styles.css` and native
   ES-module `.js` files, served as-is. No `package.json`, no bundler, no
   transpiler, no runtime or development dependencies.
2. **Hosting on GitHub Pages** directly from the repository over HTTPS; the
   deploy unit is a git push.
3. **Persistence in `localStorage`**, exactly one data key `loopo.tasks`
   holding a versioned envelope, plus `loopo.tasks.backup` as the write-ahead
   copy when a stored payload cannot be parsed. Schema, quota, and
   blocked-storage failure paths are specified in
   [`spec-loopo-mvp-001.md`](../specs/spec-loopo-mvp-001.md) — a save that is
   rejected never destroys the previously stored list.
4. **In-tab notifications** through the Notification API, permission requested
   from a user gesture in the secure context Pages provides. Delivery while
   closed (Web Push) is out of scope for this ADR's MVP and tracked post-MVP.
5. **Time handling on `Date` + `Intl.DateTimeFormat`** over the task's stored
   IANA zone. `Temporal` is not used: it is not Baseline (Limited
   availability), and the polyfill its use would require would break the
   zero-dependency constraint.

## Consequences

**Accepted gains**

- The dependency tree is empty: review diffs are source diffs, `git clone` plus
  a static file server is the whole setup, and there is no build step to drift
  out of sync with the source.
- Deployment and rollback are git operations on GitHub Pages; no hosting
  account or secrets beyond the repository.
- Task data never leaves the device: there is no account, no server, and no
  sync surface to secure or to fail.

**Accepted costs and risks (all bounded by the spec's acceptance list)**

- No cross-device sync or backup: clearing site data, private-session expiry,
  or a browser profile change loses the task list. Accepted for the MVP
  (round 3); a manual export/import remains a possible follow-up, not a
  commitment of this ADR.
- No reminder delivery while the tab is closed — the reason Web Push is filed
  as a post-MVP item rather than cut silently.
- `localStorage` limits apply: synchronous API shared across tabs (two-tab
  changes converge via the `storage` event, last-write-wins), browser-dependent
  quota, `SecurityError` when storage is blocked, origin scoping (HTTP ≠
  HTTPS). Each has a specified empty/error path in the exploration's
  edge-case table, as adopted by the spec's acceptance criteria.
- No type-checking and no automated test harness in the MVP; correctness rests
  on the spec's acceptance criteria plus the manual smoke gate, which is why
  the spec's edge-case rows are written as checkbox acceptance items.

## Alternatives considered

- **Server-backed app with GitHub OAuth sync** (superseded exploration rounds
  3→4): a backend plus identity provider for sync and backup. Rejected as MVP
  scope: it adds hosting, auth, and a runtime dependency surface the
  constraints exclude; the OAuth step was dropped in favor of no accounts at
  all. Revisit only as a post-MVP ADR if sync demand appears.
- **Vanilla TypeScript + Vite** (approach B, rejected in round 5): type
  safety and minification at the cost of `node_modules`, a lockfile, and a
  build step. The round-5 constraint — zero dependencies including tooling —
  makes the cost binding, not optional. The supersession is recorded in the
  exploration's rounds log rather than silently swapped.
- **Framework UI — Svelte 5 or Preact** (approach C, rejected in round 5):
  reactive list ergonomics for a form with three reminder kinds. A runtime
  dependency and a build step for a bounded view set the MVP does not need.
- **`Temporal` for recurrence and countdown math** (rejected): not Baseline;
  polyfilling violates the zero-dependency constraint, so the stored-zone +
  `Intl` approach above stands until `Temporal` reaches Baseline.
