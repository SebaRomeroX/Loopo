---
exploration_id: loopo-mvp-001
title: Loopo MVP — scope, surface and stack
status: settled
created: 2026-10-03
---

# Project exploration: Loopo MVP — scope, surface and stack (loopo-mvp-001)

Greenfield record (the six-phase protocol,
`.agents/skills/arggon-cli/references/exploration.md` — ADR 0017). Produced by
task `task-write-greenfield-exploration-and-mvp-spec` under story
`define-loopo-mvp-scope`. The cross-cutting decision it settles lands in an ADR
(`ArggonManager/docs/adr/0001-static-webapp-localstorage.md`, filed as a tracked
follow-up) — linked under Decision. Edge cases leave this doc as spec acceptance
criteria, explicit non-goals, or spike items — nothing stays "unknown".

## Classification

**Greenfield.** Loopo has no existing flow to read: the repository is a fresh
`arggon init` scaffold (no `src/`, no specs, no ADRs, no playbooks;
`ARCHITECTURE.md` still reads `TODO: problem statement`), and the MVP defines a
new product surface — a reminder app others will depend on. Ratchet is one-way:
nothing found here downgrades it. Route = this protocol in full, with the ADR
0017 hard gate: **no implementation task may be claimed before a spec exists and
`arggon spec analyze` reports no NEW findings.**

## Frontier-rounds log

Rounds run in dependency order (outcome/users → scope → constraints → data →
interfaces → failure/edge → ops/security → rollout). Every question settled by
interview; no answer was guessed.

**Round 1 — outcome/users, scope, constraints.**
- What is Loopo, and for whom? → *A reminder app*: recurring loops ("drink water
  every 2 hs", "wash the dog every month"), elapsed counters ("called mom since
  9 days"), countdowns to fixed dates ("15 days for math exam"). **Settled.**
- What ships first? → answered "hosted service + GitHub App" — **superseded by
  round 4** after round 3 exposed the contradiction (see below).
- Non-negotiable constraints → files-as-DB, offline/local-first, no new runtime
  deps. The "files as the only DB" reading was **refined in round 2** to
  browser storage, not Git files.

**Round 2 — data, interfaces, time, ops/security.**
- Where do reminder files live? → **`localStorage` (browser)** — the earlier
  "files are the only DB" constraint resolves to client-side storage, not a repo
  or server. **Settled.**
- Which clients? → **web app + notifications**. **Settled.**
- Time representation? → **stored IANA zone + recurrence rule**; counters store
  an instant; display computed per viewer. **Settled.**
- Ops/security must-haves → "GitHub OAuth + minimal scopes" — **superseded by
  round 3** ("skip it for the mvp").

**Round 3 — failure/edge, ops, rollout (reconciliation).**
- What is GitHub OAuth for if data is localStorage? → **skip GitHub entirely
  for the MVP.** **Settled.**
- Delivery while the tab is closed? → **in-tab notifications now, Web Push
  later** (filed as follow-up). **Settled.**
- localStorage can be cleared at any moment → **accept the loss risk**; export/
  import is an explicit non-goal for MVP. **Settled.**
- Rollout → **personal first**, iterate, then open. **Settled.**

**Round 4 — scope contradiction (round 1 vs round 3), terminal.**
- "Hosted service + GitHub App" vs "skip GitHub" → **MVP = static web app
  deployed to GitHub Pages; user tasks in `localStorage`; no backend, no auth.**
  GitHub's only role is hosting the static bundle. Frontier empty: every branch
  visited, nothing silently assumed.

## Edge cases

Adversarial pass over the settled design. Every hunted case resolves into
exactly one of: a **spec acceptance criterion** (→ the spec), an **explicit
non-goal** (→ recorded here), or a **spike item** (→ a tracked task).

| Dimension                       | Hunted case | Resolution |
| ------------------------------- | ----------- | ---------- |
| input validation / hostile input | Reminder text containing `<script>`/HTML rendered by the UI; over-long titles | Spec AC: user content renders via `textContent` (never `innerHTML`); title capped (e.g. 200 chars), interval/recurrence inputs range-checked before persisting. |
| empty/loading/error states      | First run: zero reminders; storage blocked (Safari private mode / cookie policy → `SecurityError`) | Spec AC: first-run empty state with example reminders; when storage throws, run read-only in-session with a visible banner instead of crashing. |
| concurrency / idempotency       | Two tabs open, both write the same key | Spec AC: subscribe to the `storage` event and re-read on write; last-write-wins documented as the conflict rule (single user, no merge). |
| failure/retry/timeout           | Background tab throttles timers; user returns after due time passed | Spec AC: recompute due reminders on `visibilitychange`/focus, not only on timer; overdue reminders fire once on return with a "missed" marker (no notification storm — dedupe by reminder id + occurrence). |
| authn/authz                     | None exists — no accounts in MVP | **Explicit non-goal:** no auth, no multi-user; data is origin-scoped to the deployed URL. |
| limits/quota/perf               | `localStorage` quota (~5 MB) → `QuotaExceededError` on save | Spec AC: bounded reminder count/payload (e.g. ≤ 500 × 1 KB); quota errors surface a message and never drop the existing stored set silently. |
| time/timezones/locale           | DST shift breaks "every 24 h at 09:00"; user travels; `Temporal` not Baseline | Spec AC: recurrence computed in the **stored IANA zone** (DST-aware); counters store instants; date math via `Date` + `Intl.DateTimeFormat({ timeZone })` — no `Temporal` without a polyfill (polyfill = new runtime dep, forbidden by constraint). |
| persistence/migration/rollback  | Schema evolves; a future build reads an old blob and wipes it | Spec AC: versioned schema envelope (`schemaVersion`) + pure migration chain; unknown/newer version **never destroys** the raw blob (back it up to a side key before migrating). |
| observability/debuggability      | No server, therefore no server logs | **Explicit non-goal:** no telemetry in MVP. Errors must surface in-UI (banner/console with a `?debug=1` opt-in); diagnostics are local only. |
| security/threat model           | XSS via stored reminder text; third-party scripts on a public Pages origin | Spec AC: `textContent`-only rendering, no `innerHTML`/`eval`; no third-party runtime scripts; site served over HTTPS only (GitHub Pages default). |
| environment/platform            | Mobile browsers throw `TypeError` on `new Notification()`; permission request must come from a user gesture; `file://` `localStorage` behavior is undefined | Spec AC: permission requested only from a click; feature-detect and prefer `ServiceWorkerRegistration.showNotification()` when `new Notification` is unavailable; supported target = HTTPS origin (GitHub Pages / localhost dev), `file://` explicitly unsupported. |
| upgrade/data-loss               | Deploy replaces the bundle; user clears site data | Deploy: origin-scoped storage survives (AC: migration runs on load, non-destructive — see persistence row). **Explicit non-goal:** no export/import, no backup in MVP (loss risk accepted, round 3); follow-up: Web Push item already filed for delivery, export/import stays out until requested. |

## Approaches considered

Criteria (weighted): (1) honors the **no-new-runtime-deps** constraint, (2)
fit for a 3-view app, (3) long-term maintenance risk, (4) build/deploy
simplicity on GitHub Pages. Versions read from the npm registry on 2026-10-03.

### A — Vanilla TypeScript + Vite (zero runtime deps)
- Build/dev tool only: Vite `8.3.2` (source: https://www.npmjs.com/package/vite, accessed 2026-10-03); shipped bundle has **no runtime dependencies** — the literal reading of the round-1 constraint.
- Views are three (list/create, counter, countdown) with trivial shared state; a framework buys little here (YAGNI).
- Trade-off: hand-rolled DOM updates and no reactive helpers; grows painful if the view count explodes.

### B — Svelte 5 + Vite
- Svelte `5.57.1`, MIT, 15 runtime deps (source: https://www.npmjs.com/package/svelte, accessed 2026-10-03); compiler-based, small emitted runtime, best-in-class ergonomics for reactive lists (source: https://svelte.dev/, accessed 2026-10-03).
- Trade-off: violates the no-new-runtime-deps constraint as written; adds a framework the MVP's size does not need.

### C — Preact 11 + Vite
- Preact `11.0.0`, MIT, **0** direct runtime deps (source: https://www.npmjs.com/package/preact, accessed 2026-10-03); React-shaped mental model, ~small bundle.
- Trade-off: still a runtime library in the bundle; JSX toolchain adds config for a 3-view app.

### Shared findings
- **Storage:** `localStorage` is origin-scoped (HTTP ≠ HTTPS), has no expiry, is cleared for private sessions when the last tab closes, and throws `SecurityError` when the browser blocks persistence (source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage, modified 2026-07-28, accessed 2026-10-03). → drives the empty/error/quota/security rows above.
- **Notifications:** permission must be requested from a user gesture; Chrome/Firefox require a secure context; `new Notification()` throws `TypeError` on most mobile browsers — use `showNotification()` via a service worker there (source: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API, modified 2026-09-02, accessed 2026-10-03).
- **Time:** `Temporal` is **Limited availability** (not Baseline) — unusable without a polyfill, which the constraint forbids (source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal, modified 2025-12-08, accessed 2026-10-03).
- **Hosting:** GitHub Pages serves straight from the repo over HTTPS, one site per account + unlimited project sites (source: https://pages.github.com/, accessed 2026-10-03).

## Decision

**Recommendation: Approach A — vanilla TypeScript + Vite, static bundle on
GitHub Pages, `localStorage` persistence, in-tab Notifications, no backend.**

Trade-offs accepted: hand-rolled DOM state (bounded by three views); no sync or
backup (loss risk explicitly accepted, round 3); no notifications while the tab
is closed (Web Push filed as a post-MVP follow-up). Rejected: B and C on the
no-new-runtime-deps constraint and MVP size.

Cross-cutting (stack + persistence schema + hosting) → ADR
`ArggonManager/docs/adr/0001-static-webapp-localstorage.md` (**Proposed**),
tracked as `task-adr-0001-static-webapp-localstorage`. Artifacts in order: this
doc → ADR → spec with the edge-case rows above as acceptance criteria
(`task-write-mvp-spec`) → plan/tasks with `depends_on`. Delivery-while-closed is
deferred as `task-deliver-reminders-while-the-tab-is-closed-web-push` (label
`post-mvp`).

**Hard gate (ADR 0017):** no implementation task may be claimed before the spec
passes `arggon spec analyze` with no NEW findings.

## Self-review

- Placeholder scan: no `{{}}` or TODO left; all template sections filled.
- Consistency: rounds 1–4 recorded, both supersessions marked (hosted+GitHub →
  static Pages; OAuth → skipped) rather than silently dropped.
- Scope: MVP only — Web Push, export/import and auth are non-goals/follow-ups.
- Ambiguity: every edge-case cell names a resolution owner (spec AC / non-goal).
