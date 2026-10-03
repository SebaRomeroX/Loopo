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

**Round 4 — scope contradiction (round 1 vs round 3).**
- "Hosted service + GitHub App" vs "skip GitHub" → **MVP = static web app
  deployed to GitHub Pages; user tasks in `localStorage`; no backend, no auth.**
  GitHub's only role is hosting the static files.

**Round 5 — user clarification before implementation (stack, UX, domain, QA).**
- Language/tooling → **plain HTML + CSS + vanilla JavaScript, zero-build** (no
  bundler, no `package.json`); dependencies **0 if possible**. Supersedes
  candidate A's "TypeScript + Vite" framing — recorded, not silently swapped.
- Domain model → users create **to-do tasks**, each choosing a **reminder kind:
  `loop` | `date` | `counter`** — formalizes round 1's three examples into the
  spec's type enum.
- UX → **mobile-first** UI (new constraint; previously unrecorded).
- Testing → **manual smoke only** in the MVP. Conflicts with the review bar in
  `ArggonManager/docs/engineering.md` ("tests cover the behavior change") →
  filed as `task-mvp-testing-policy` to resolve the doc in the same PR that
  lands the first behavior change; never fork silently.
- Round 4 + 5 terminal: frontier empty, nothing silently assumed.

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
| mobile-first UX (round 5)       | Primary target is a small viewport: thumb-reachable actions, form keyboards, no hover-only affordances, reminder-kind picker (`loop`/`date`/`counter`) cramped on narrow screens | Spec AC: single-column layout valid at 320 px width; all actions tappable without hover; the kind picker is a first-class control, not a nested menu; desktop is progressive enhancement only. |
| upgrade/data-loss               | Deploy replaces the bundle; user clears site data | Deploy: origin-scoped storage survives (AC: migration runs on load, non-destructive — see persistence row). **Explicit non-goal:** no export/import, no backup in MVP (loss risk accepted, round 3); follow-up: Web Push item already filed for delivery, export/import stays out until requested. |

## Approaches considered

Criteria (weighted): (1) dependency count — **0 is the target** (round 5), (2)
fit for a mobile-first, 3-task-type app, (3) long-term maintenance risk,
(4) build/deploy simplicity on GitHub Pages. Versions read from the npm
registry on 2026-10-03.

### A — Zero-build vanilla HTML + CSS + ES-module JS (0 dependencies)
- No bundler, no `package.json`, no transpiler: `index.html` + `styles.css` +
  plain `.js` modules served as-is by GitHub Pages. **Zero dependencies** — the literal reading of the round-5 constraint.
- Native ES modules (`<script type="module">`) give file organization without tooling; DOM updates are hand-rolled via `textContent`.
- Trade-off: no type-checking, no reactive helpers, no minification; growth beyond a handful of views gets painful — accepted, MVP is bounded (list + create form + three reminder kinds).

### B — Vanilla TypeScript + Vite (zero *runtime* deps)
- Vite `8.3.2`, dev-only (source: https://www.npmjs.com/package/vite, accessed 2026-10-03); shipped bundle has no runtime deps, but `node_modules` + a build step exist.
- Trade-off: type safety and minification at the cost of a dependency tree — **rejected in round 5** ("0 if it's possible" applies to build tooling too).

### C — Framework UI (Svelte 5 / Preact 11)
- Svelte `5.57.1` (MIT, 15 runtime deps, source: https://www.npmjs.com/package/svelte, accessed 2026-10-03); Preact `11.0.0` (MIT, 0 direct deps, source: https://www.npmjs.com/package/preact, accessed 2026-10-03).
- Trade-off: reactive ergonomics for lists; rejected on both the 0-dependency target and a mobile-first 3-kind form needing no framework.

### Shared findings
- **Storage:** `localStorage` is origin-scoped (HTTP ≠ HTTPS), has no expiry, is cleared for private sessions when the last tab closes, and throws `SecurityError` when the browser blocks persistence (source: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage, modified 2026-07-28, accessed 2026-10-03). → drives the empty/error/quota/security rows above.
- **Notifications:** permission must be requested from a user gesture; Chrome/Firefox require a secure context; `new Notification()` throws `TypeError` on most mobile browsers — use `showNotification()` via a service worker there (source: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API, modified 2026-09-02, accessed 2026-10-03).
- **Time:** `Temporal` is **Limited availability** (not Baseline) — unusable without a polyfill, which the constraint forbids (source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal, modified 2025-12-08, accessed 2026-10-03).
- **Hosting:** GitHub Pages serves straight from the repo over HTTPS, one site per account + unlimited project sites (source: https://pages.github.com/, accessed 2026-10-03).

## Decision

**Recommendation: Approach A — zero-build vanilla HTML + CSS + ES-module
JavaScript, served as-is from GitHub Pages, `localStorage` persistence,
in-tab Notifications, no backend, no `package.json`.**

Domain shape (round 5): a **to-do task** carries exactly one **reminder kind** —
`loop` (recurring, e.g. "every 2 hs" / "every month"), `date` (countdown to a
fixed date), or `counter` (elapsed since a start instant) — each computed in
its stored IANA zone. **UI is mobile-first** (small viewport is the primary
target; desktop is the enhancement).

Trade-offs accepted: hand-rolled DOM state (bounded by three reminder kinds);
no type-checking/minification (0-dep target, round 5); manual smoke only instead
of automated tests (round 5 — conflicts with `docs/engineering.md`'s review bar,
resolved by `task-mvp-testing-policy` in the same PR as the first behavior
change); no sync or backup (loss risk explicitly accepted, round 3); no
notifications while the tab is closed (Web Push filed as post-MVP). Rejected: B
(bundle tooling for a 0-dep target) and C (framework the MVP does not need).

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
- Consistency: rounds 1–5 recorded, all three supersessions marked (hosted+GitHub →
  static Pages; OAuth → skipped; TS+Vite → zero-build) rather than silently dropped.
- Scope: MVP only — Web Push, export/import, auth and automated tests are
  non-goals/follow-ups.
- Ambiguity: every edge-case cell names a resolution owner (spec AC / non-goal).
