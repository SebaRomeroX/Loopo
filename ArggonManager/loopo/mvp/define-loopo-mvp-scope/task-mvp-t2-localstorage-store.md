---
type: task
status: todo
id: task-mvp-t2-localstorage-store
title: "MVP T2: task model + localStorage store"
parent: define-loopo-mvp-scope
labels: [implementation]
priority: p1
created: "2026-10-03"
updated: "2026-10-03"
depends_on: [task-mvp-t1-shell-empty-state]
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-mvp-t2-localstorage-store.md
  Leaves live only under a story. id is the filename stem: task-mvp-t2-localstorage-store.
  CLI `arggon create task mvp-t2-localstorage-store` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# MVP T2: task model + localStorage store

## Context

Wave 1 (plan §T2): the persistence core — task model and the `loopo.tasks`
versioned envelope with atomic save, forward migration, backup of
unparseable/unknown-`schemaVersion` input, and quota-safe writes. Spec
invariant 1 ("stored tasks are never destroyed on read") is implemented here.

## Acceptance

- [ ] `schemaVersion` envelope: an older envelope migrates forward; an
      unknown/newer envelope is copied to `loopo.tasks.backup` before the
      store ever resets to empty.
- [ ] Unparseable JSON backs up the raw value and never crashes the load
      path (empty list + reported failure, never a silent wipe).
- [ ] A save rejected by quota leaves the stored list byte-identical.

## Notes

- Depends on T1 (entry-module wiring); T3 and T4 both branch from here.
