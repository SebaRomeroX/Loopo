/**
 * In-tab notifications (plan §T5): consume the T4 occurrence stream and
 * surface each occurrence exactly once, either as a system notification
 * (permission granted) or as an in-app notice card (denied/unsupported —
 * spec Synopsis: "due reminders surface in-app instead").
 *
 * Hard rules from the spec:
 *  - permission is requested ONLY from a user gesture — the button this
 *    module renders; nothing on the load path may call `requestPermission()`;
 *  - dedupe key = task id + occurrence instant, persisted in the task's
 *    `lastNotifiedAt` so a reload or a second tab sees it as already shown
 *    ("at most once", no notification storm);
 *  - `missed` occurrences (elapsed while the tab was closed) carry a
 *    visible missed marker in either presentation, still exactly once.
 *
 * Presentation is failure-tolerant: a corrupt task can produce an
 * occurrence the engine could not advance — the anchor is recorded first,
 * and a presentation that throws degrades to a console warning instead of
 * breaking the refresh loop.
 */
import { kindLabel } from "./kinds.js";
import { taskDetail } from "./format.js";

/** Newest in-app notices kept (session state; older ones drop off). */
const NOTICE_LIMIT = 8;

function notificationBody(task, missed) {
  const detail = `${kindLabel(task.kind)}: ${taskDetail(task)}`;
  return missed ? `Missed — ${detail}` : detail;
}

/**
 * The permission control for the page header. It always renders from the
 * current `Notification.permission` value: `default` offers the gesture
 * button, `granted` hides itself, `denied` shows an honest hint (no
 * repeated prompt), unsupported shows nothing — no dead-end controls.
 * @returns {{ element: HTMLElement, refresh: () => void }}
 */
export function createPermissionRow(doc, win) {
  const row = doc.createElement("div");
  row.className = "perm";

  const button = doc.createElement("button");
  button.type = "button";
  button.className = "btn btn--ghost perm__btn";
  button.textContent = "Enable notifications";

  const hint = doc.createElement("p");
  hint.className = "perm__hint";
  hint.textContent =
    "Notifications are blocked — due reminders stay visible in the list.";

  function refresh() {
    const supported = typeof win.Notification === "function";
    const permission = supported ? win.Notification.permission : "unsupported";
    button.hidden = permission !== "default";
    hint.hidden = permission !== "denied";
    row.hidden = !supported || permission === "granted";
  }

  button.addEventListener("click", () => {
    // The one and only place requestPermission() is called (spec row 14):
    // this handler runs inside the click, i.e. a user gesture.
    try {
      Promise.resolve(win.Notification.requestPermission()).then(refresh, refresh);
    } catch {
      refresh(); // gesture attempted; fall back to the observable state
    }
  });

  row.appendChild(button);
  row.appendChild(hint);
  refresh();
  return { element: row, refresh };
}

/**
 * Show the occurrence as a system notification.
 * @returns {boolean} true when the OS accepted it.
 */
function presentSystem(win, task, occurrence) {
  try {
    new win.Notification(task.title, {
      body: notificationBody(task, occurrence.missed),
      // Unique per occurrence: identical tags would collapse distinct
      // occurrences at the OS level, distinct tags never collide.
      tag: `${task.id}@${occurrence.at}`,
    });
    return true;
  } catch {
    return false; // construction refused → caller degrades in-app
  }
}

/**
 * Append the occurrence as an in-app notice card; all text via
 * `textContent` (titles are data, never markup).
 */
function presentInApp(doc, notices, task, occurrence) {
  const notice = doc.createElement("div");
  notice.className = occurrence.missed ? "notice notice--missed" : "notice";

  const body = doc.createElement("div");
  body.className = "notice__body";

  const kind = doc.createElement("span");
  kind.className = "notice__kind";
  kind.textContent = kindLabel(task.kind);

  const title = doc.createElement("span");
  title.className = "notice__title";
  title.textContent = task.title;

  const detail = doc.createElement("span");
  detail.className = "notice__detail";
  try {
    detail.textContent = taskDetail(task);
  } catch (cause) {
    // Corrupt payload detail: kind + title still carry the message — a
    // broken detail must not swallow the whole notice (review N5).
    const message = cause && cause.message ? cause.message : String(cause);
    console.warn(`Loopo: no detail for "${task.id}" — ${message}`);
  }

  body.appendChild(kind);
  body.appendChild(title);
  body.appendChild(detail);
  notice.appendChild(body);

  if (occurrence.missed) {
    const chip = doc.createElement("span");
    chip.className = "notice__missed";
    chip.textContent = "missed";
    notice.appendChild(chip);
  }

  notices.appendChild(notice);
  while (notices.children.length > NOTICE_LIMIT) {
    notices.firstElementChild.remove();
  }
}

/**
 * Consume one batch of engine occurrences: dedupe on task id + occurrence
 * instant, persist the anchor, present once (system when granted, in-app
 * otherwise — including when the constructor throws).
 * `tasks` come from a single localStorage envelope — small by construction,
 * so the id lookup stays a linear scan (a Map would be speculative).
 * @param {{ doc: Document, win: Window, tasks: Array, occurrences: Array, notices: HTMLElement }} opts
 * @returns {{ changed: boolean }} whether any anchor was written (persist me)
 */
export function consumeOccurrences({ doc, win, tasks, occurrences, notices }) {
  let changed = false;
  for (const occurrence of occurrences) {
    const task = tasks.find(
      (candidate) => candidate && candidate.id === occurrence.taskId
    );
    if (!task) continue; // deleted since the tick — nothing to show
    if (task.lastNotifiedAt === occurrence.at) continue; // already shown

    try {
      // Anchor first: even a presentation failure must not re-fire this
      // occurrence on the next tick or reload ("at most once").
      task.lastNotifiedAt = occurrence.at;
      changed = true;

      const granted =
        typeof win.Notification === "function" &&
        win.Notification.permission === "granted";
      if (granted && presentSystem(win, task, occurrence)) continue;
      presentInApp(doc, notices, task, occurrence);
    } catch (cause) {
      // Corrupt task payload (e.g. a loop whose rule vanished): the anchor
      // recorded above stays, so the broken occurrence cannot nag forever.
      const message = cause && cause.message ? cause.message : String(cause);
      console.warn(`Loopo: occurrence for "${task.id}" could not be shown — ${message}`);
    }
  }
  return { changed };
}

/**
 * Narrow cross-tab dedupe: copy the other tab's persisted `lastNotifiedAt`
 * anchors onto the in-memory tasks so this tab does not re-show an
 * occurrence the other tab already showed (best-effort — the simultaneous-
 * tick window stays open until T6's full convergence). Only the anchor
 * travels here; the envelope's `schemaVersion` is checked by the caller and
 * the anchor's type here, so a cross-version or hand-edited value can never
 * poison the dedupe equality.
 * `tasks` come from a single localStorage envelope — small by construction,
 * so the id lookup stays a linear scan (a Map would be speculative).
 */
export function syncLastNotified(tasks, incoming) {
  for (const candidate of incoming) {
    if (!candidate || typeof candidate.id !== "string") continue;
    const anchor = candidate.lastNotifiedAt;
    if (anchor !== null && typeof anchor !== "string") continue; // untyped garbage
    const task = tasks.find((entry) => entry && entry.id === candidate.id);
    if (task) {
      task.lastNotifiedAt = anchor;
    }
  }
}
