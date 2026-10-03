---
plan_id: loopo-mvp-001
title: Plan for Loopo MVP — reminder/to-do web app
spec: ArggonManager/docs/specs/spec-loopo-mvp-001.md
status: proposed
created: 2026-10-03
---

# Plan: Loopo MVP — reminder/to-do web app (loopo-mvp-001)

Derived from `ArggonManager/docs/specs/spec-loopo-mvp-001.md`. Each task
carries a verifiable acceptance criterion and links back to the spec.

Every `### Tn` below mirrors one tracked item under `define-loopo-mvp-scope`
(the item id is named in its section). The items' `depends_on` edges encode
this ordering; dependencies are advisory — they gate `arggon next --ready`
suggestions, never updates.

**Gates before T1 may be claimed:** the ADR 0017 gate (spec
`arggon spec analyze` with no NEW findings — already clean) and terminal
status of `task-write-greenfield-exploration-and-mvp-spec`,
`task-adr-0001-static-webapp-localstorage`, `task-write-mvp-plan`, and
`task-mvp-testing-policy`. The testing-policy dependency supersedes the
exploration's round-5 phrasing ("resolved in the same PR as the first
behavior change"): one branch per item makes a shared PR impossible, so the
policy reconciliation ships as its own docs PR **before** the first behavior
PR — recorded here rather than swapped silently.

**Waves** (by file overlap): wave 1 is sequential (T1 → T2). Wave 2 runs T3
and T4 in parallel — both branch off T2 and stay file-disjoint except the
entry module; if both touch it, T3 merges first. Wave 3 is T5 (needs T4
occurrences); wave 4 is T6 (needs T3 + T5).

## Tasks

### T1: Static shell, mobile-first layout, empty state
- Item: `task-mvp-t1-shell-empty-state`.
- Create `index.html`, `styles.css` and the ES-module entry structure: a
  single-column page that loads straight from static files, with an empty
  state that lists one example task per reminder kind. No `package.json`, no
  build step, no vendored third-party code.
- **Acceptance:** spec AC "runs from static files with no build step"; spec AC
  "first run shows an empty state listing one example per reminder kind";
  spec AC "usable at a 320 px viewport … no hover-only affordances".

### T2: Task model + `localStorage` store
- Item: `task-mvp-t2-localstorage-store`.
- Implement the task model and the `loopo.tasks` store: versioned envelope
  (`schemaVersion`), atomic save, forward migration of older envelopes, raw
  value copied to `loopo.tasks.backup` for unparseable/unknown-version input,
  and quota-safe writes that never clobber the stored list on failure.
- **Acceptance:** spec AC "`schemaVersion`; an older envelope migrates
  forward, and an unknown/newer envelope is copied to `loopo.tasks.backup`
  and never overwritten"; spec AC "unparseable JSON … backs up the raw value,
  shows an error banner, and never crashes the load path" (the banner UI
  itself lands in T6); spec AC "quota … shows a message and leaves the
  previously stored list byte-identical" (the message UI itself lands in T6).

### T3: Task list + kind-aware create/edit form
- Item: `task-mvp-t3-list-kind-form`.
- Build the list view and the add/edit form whose kind picker
  (`loop`/`date`/`counter`) swaps the second field (every-N + unit, target
  date, start instant); wire create/edit/delete through the T2 store. All
  rendering through `textContent` only.
- **Acceptance:** spec AC "created, edited and deleted with exactly one kind;
  all three kinds survive a reload"; spec AC "titles render via `textContent`
  only … never executes".

### T4: Reminder engine — zone-correct loop / date / counter
- Item: `task-mvp-t4-reminder-engine`.
- Implement due computation over the stored IANA zone: `loop` recurrence that
  keeps wall-clock time across DST transitions, `date` countdown reaching due
  without negative day counts, `counter` elapsed display; run on load, on a
  timer while open, and on `visibilitychange`/focus.
- **Acceptance:** spec AC "`loop` fires at the same wall-clock time after a
  DST transition"; spec AC "`date` … due state … without rendering negative
  day counts"; spec AC "`counter` … refreshes while the app is open".

### T5: In-tab notifications — permission, dedupe, missed marker
- Item: `task-mvp-t5-in-tab-notifications`.
- Surface due reminders in-tab: Notification permission requested only from a
  user gesture, denial/unsupported degrading to in-app due indicators, dedupe
  key = task id + occurrence instant, and a single `missed` marker for
  occurrences that elapsed while the tab was closed.
- **Acceptance:** spec AC "permission … only from a user gesture … denial
  degrades to in-app due indicators"; spec AC "each occurrence notifies at
  most once … returning after a missed occurrence shows it once with a
  `missed` marker".

### T6: Failure paths, multi-tab sync, offline, smoke + deploy
- Item: `task-mvp-t6-failure-paths-smoke-deploy`.
- Wire the failure-path UX (`SecurityError` → session-local read-only banner
  and disabled create/edit; quota message; storage-corruption error banner),
  the `storage`-event convergence between two tabs with last-write-wins, the
  offline-after-first-load behavior, GitHub Pages enablement, and the full
  manual smoke pass with expected-vs-observed evidence recorded on the PR.
- **Acceptance:** spec AC "storage blocked … session-local read-only with a
  visible banner"; spec AC "change in one tab appears in the other …
  last-write-wins"; spec AC "no network after first load … still opens and
  computes due state"; spec AC "manual smoke passes … record
  expected-vs-observed evidence on the PR".

## Deviations and open items

- None from the spec's acceptance list: all 17 spec rows are covered by
  T1–T6 acceptance criteria above (T1: 3, T2: 3, T3: 2, T4: 3, T5: 2, T6: 4).
- Web Push stays out of this plan (post-MVP item
  `task-deliver-reminders-while-the-tab-is-closed-web-push`).
