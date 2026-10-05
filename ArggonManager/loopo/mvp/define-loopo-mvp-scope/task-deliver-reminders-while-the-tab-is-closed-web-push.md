---
type: task
status: todo
id: task-deliver-reminders-while-the-tab-is-closed-web-push
title: Deliver reminders while the tab is closed (Web Push)
parent: define-loopo-mvp-scope
labels: [post-mvp]
priority: p2
created: "2026-10-03"
updated: "2026-10-03"
depends_on: [task-mvp-t6-failure-paths-smoke-deploy]
---
<!--
  Placement (v0): ArggonManager/loopo/mvp/define-loopo-mvp-scope/task-deliver-reminders-while-the-tab-is-closed-web-push.md
  Leaves live only under a story. id is the filename stem: task-deliver-reminders-while-the-tab-is-closed-web-push.
  CLI `arggon create task deliver-reminders-while-the-tab-is-closed-web-push` adds the task- prefix (do not pass it twice).
  parent MUST be the story id. Omit assignee when unassigned. Omit blocked_reason unless status is blocked.
-->

# Deliver reminders while the tab is closed (Web Push)

## Context

Post-MVP follow-up, explicitly deferred by spec `loopo-mvp-001` (the MVP
delivers reminders **in tab only** — see `task-mvp-t5-in-tab-notifications`).
Web Push means a service worker + push subscription delivering `loop`/`date`/
`counter` occurrences while the tab is closed, with the permission and dedupe
model shared with the in-tab path.

Gated `depends_on` T6 (MVP complete) — post-MVP by definition. ADR 0017
applies: write the follow-up spec first and get it analyzed clean before
claiming implementation work.

## Acceptance

- [ ] Follow-up spec written (delivery model, permission UX, offline/queued
      payload semantics, GH Pages service-worker scope caveats) and
      `arggon spec analyze` reports no NEW findings before implementation is
      claimed.
- [ ] Due occurrences are delivered while the tab is closed for all three
      reminder kinds.
- [ ] At-most-once across channels: the dedupe key (task id + occurrence
      instant) is shared with the in-tab path, so a reminder never fires both
      in-tab and via push for the same occurrence.
- [ ] Denied/unsupported permission degrades to the MVP in-tab behavior —
      no dead ends (same rule as T5).
- [ ] Zero-dependency invariant preserved (ADR 0001): service worker and
      Push APIs only, no libraries, no build step.

## Notes

- Supersession of the MVP's "Web Push deferred" non-goal happens HERE, via
  spec, not silently in an implementation PR.

### handoff 2026-10-05 @ses_efd5fb7b9ffeQRYizJKKwA6ggv (session: ses_efd5fb7b9ffeQRYizJKKwA6ggv) — next: Claim it and start with research: Web Push under the MVP's 0-dependency/zero-backend constraints (service worker + VAPID keys + a sender) before any code — ADR/spec decision first.
- branch: main
- open questions: Who originates pushes with no backend (serverless sender / third-party / self-hosted)? Does enabling a service worker change the deploy story (GitHub Pages)? How does push interact with localStorage-…
