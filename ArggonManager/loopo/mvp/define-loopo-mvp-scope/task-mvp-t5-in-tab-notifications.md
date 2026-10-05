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

- [ ] Permission is requested only from a user gesture; denial or missing
      support degrades to in-app due indicators (no dead ends).
- [ ] Each occurrence notifies at most once; returning after a missed
      occurrence shows it once with a `missed` marker.

## Notes

- Web Push is out of scope here (post-MVP item
  `task-deliver-reminders-while-the-tab-is-closed-web-push`).
