---
spec_id: loopo-mvp-001
title: "Loopo MVP — reminder/to-do web app"
status: proposed
created: 2026-10-03
---

# Spec: Loopo MVP — reminder/to-do web app (loopo-mvp-001)

This spec is the ADR 0017 gate for the Loopo MVP: no implementation task may
be claimed before `arggon spec analyze` reports no NEW findings against it. Its
acceptance criteria are derived from the edge-case rows hunted in
`ArggonManager/docs/explorations/exploration-loopo-mvp-001.md` — each row maps
to an acceptance row below, to a Synopsis invariant, or is explicitly
superseded (the exploration's Resolution column records which); the
cross-cutting stack decision is `ArggonManager/docs/adr/0001-static-webapp-localstorage.md`.

## Purpose

Loopo is a personal reminder/to-do app. A user creates a to-do task and picks
exactly one **reminder kind**:

- **`loop`** — recurring ("drink water every 2 hours", "wash the dog every month"),
- **`date`** — countdown to a fixed date ("math exam in 15 days"),
- **`counter`** — elapsed time since a start instant ("called mom since 9 days").

Invariants that must always hold:

1. **Stored tasks are never destroyed on read.** Every load path either
   migrates the stored envelope forward or backs the raw value up before
   anything else runs; an unreadable envelope is a reported failure, never a
   silent wipe.
2. **Zero dependencies.** The shipped app is plain HTML, CSS and ES-module
   JavaScript with no build step, no bundler and no `package.json`.
3. **No backend and no auth.** All state lives in the browser's
   `localStorage`; GitHub Pages only serves the static files.
4. **Recurrence is zone-correct.** A `loop` rule is evaluated in the IANA time
   zone stored with the task, so wall-clock times survive DST transitions.

Explicit non-goals (recorded, not assumed): sync/backup/export, accounts,
notifications while the app tab is closed (Web Push is a post-MVP item),
automated test harness (manual smoke only, see `task-mvp-testing-policy`), and
loading from `file://` URLs — only an HTTPS origin (GitHub Pages) or
`localhost` is supported.

## Synopsis

Storage: one `localStorage` key, `loopo.tasks`, holding a versioned envelope:

```json
{
  "schemaVersion": 1,
  "tasks": [
    {
      "id": "t_8f2a",
      "title": "Drink water",
      "kind": "loop",
      "zone": "Europe/Berlin",
      "rule": { "every": 2, "unit": "hours" },
      "nextAt": "2026-10-03T18:00:00+02:00",
      "lastNotifiedAt": null
    },
    {
      "id": "t_1b7c",
      "title": "Math exam",
      "kind": "date",
      "zone": "America/Santiago",
      "targetDate": "2026-10-18"
    },
    {
      "id": "t_5d3e",
      "title": "Called mom",
      "kind": "counter",
      "zone": "Europe/Berlin",
      "startedAt": "2026-09-24T10:00:00+02:00"
    }
  ]
}
```

UI: a single-column list with one add/edit form. The kind picker (`loop` /
`date` / `counter`) is a first-class control that swaps the form's second field
(every-N + unit, target date, or start instant). Due computation runs on load,
on a timer while open, and on `visibilitychange`/focus.

Failure paths: `SecurityError` (storage blocked) → session-local read-only
mode with a banner; `QuotaExceededError` (save rejected) → message, stored list
unchanged; unparseable/unknown-`schemaVersion` envelope → raw value copied to
`loopo.tasks.backup` and an error banner, then an empty list. Notifications
require a user-gesture permission request; when denied or unsupported, due
reminders surface in-app instead. Two tabs converge through the `storage`
event with last-write-wins.

## Acceptance

- [ ] The app runs from static files with no build step: `index.html` +
      `styles.css` + ES-module `.js` files, no `package.json`, no bundled
      third-party code.
- [ ] First run shows an empty state listing one example per reminder kind.
- [ ] A task can be created, edited and deleted with exactly one kind
      (`loop`/`date`/`counter`); all three kinds survive a reload.
- [ ] A `loop` rule fires at the same wall-clock time after a DST transition
      in the task's stored IANA zone (e.g. 09:00 stays 09:00).
- [ ] A `date` task shows days remaining and reaches a due state on the target
      date without rendering negative day counts.
- [ ] A `counter` task shows elapsed days/hours since `startedAt` and refreshes
      while the app is open.
- [ ] The storage envelope carries `schemaVersion`; an older envelope migrates
      forward, and an unknown/newer envelope is copied to
      `loopo.tasks.backup` and never overwritten (see failure paths).
- [ ] Unparseable JSON in `loopo.tasks` backs up the raw value, shows an error
      banner, and never crashes the load path.
- [ ] When storage is blocked (`SecurityError`), the app runs session-local
      read-only with a visible banner; create/edit is disabled with an
      explanatory message instead of throwing.
- [ ] A save rejected by quota (`QuotaExceededError`) shows a message and
      leaves the previously stored list byte-identical.
- [ ] Titles render via `textContent` only; a title containing `<script>` or
      HTML markup displays as literal text and never executes.
- [ ] A change in one tab appears in the other after the `storage` event;
      conflicting writes resolve last-write-wins.
- [ ] Notification permission is requested only from a user gesture (a
      button click); denial degrades to in-app due indicators.
- [ ] Each occurrence notifies at most once (dedupe key: task id + occurrence
      instant); returning after a missed occurrence shows it once with a
      `missed` marker — no notification storm.
- [ ] The layout is usable at a 320 px viewport: single column, every action
      reachable by tap, no hover-only affordances.
- [ ] With no network after first load, the app still opens and computes due
      state (offline/local-first).
- [ ] Manual smoke passes: load the page, create one task of each kind,
      reload, verify all three persist and compute correctly, and record
      expected-vs-observed evidence on the PR.
