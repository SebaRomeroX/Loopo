/**
 * Entry module: wires the T2 store to the UI — banners for every failure
 * path (T6), the add/edit form above the list (or the first-run empty
 * state), session-local read-only mode when storage is blocked, and
 * last-write-wins convergence between tabs. Every change goes through
 * `saveTasks`.
 *
 * The reminder engine (T4) runs on load, on a 30 s timer while the page is
 * open, on `visibilitychange` (back to visible) and on `focus` (spec
 * Synopsis): it initializes/advances loop `nextAt` (persisting only when it
 * actually advanced) and collects occurrences — the stream T5's in-tab
 * notifications consume in `runEngine()` (dedupe + present via
 * `js/notify.js`). The permission control lives in the page header and
 * requests only from its button (user gesture).
 */
import { loadTasks, saveTasks, STORAGE_KEY, SCHEMA_VERSION } from "./store.js";
import { KINDS } from "./kinds.js";
import { renderEmptyState } from "./empty-state.js";
import { renderList } from "./list.js";
import { createForm } from "./form.js";
import { tick } from "./engine.js";
import { createBanners } from "./banners.js";
import {
  consumeOccurrences,
  createPermissionRow,
  sanitizeAnchors,
} from "./notify.js";

const app = document.getElementById("app");

// Banners first: a failure that made it to the user must speak above
// everything else in the content area.
const banners = createBanners(document);
app.appendChild(banners.element);

const loaded = loadTasks();
let tasks = loaded.tasks;
/** Storage blocked → session-local read-only (spec's storage-blocked row). */
let readOnly = false;

const form = createForm(document, { onSubmit: commit });
const noticesSlot = document.createElement("div");
noticesSlot.className = "notices";
const listSlot = document.createElement("div");
const permissionRow = createPermissionRow(document, window);
document.querySelector(".app-header").appendChild(permissionRow.element);
app.appendChild(form.element);
app.appendChild(noticesSlot);
app.appendChild(listSlot);

/**
 * Enter session-local read-only mode: a banner that sticks for the session
 * plus disabled create/edit with the explanatory message. Reached on a
 * load-time `SecurityError` *and* on one thrown by a save — "when storage
 * is blocked" has no timing qualifier.
 */
function enterReadOnly() {
  if (readOnly) return;
  readOnly = true;
  form.setReadOnly(true);
  banners.show(
    "read-only",
    "Browser storage is blocked — this session is read-only: create and edit are disabled and changes cannot be saved.",
    { tone: "error", dismissable: false }
  );
}

if (loaded.failure) {
  console.warn(`Loopo: ${loaded.failure.message}`);
  if (loaded.failure.type === "unavailable") {
    enterReadOnly();
  } else {
    banners.show(`load:${loaded.failure.type}`, loaded.failure.message, {
      tone: "error",
    });
  }
}

const warnedUnrenderable = new Set();

/**
 * Display gate for untrusted stored entries: returns *why* the entry cannot
 * be rendered, or null when it can (a task missing its kind's fields must
 * not blank the whole list — `taskDetail` throws loudly by design).
 * Skipped entries stay in `tasks` and are persisted untouched — only the
 * view skips them (T6 turns the warning into a banner).
 * @returns {null | string}
 */
function renderProblem(task) {
  if (!task || typeof task !== "object") return "not an object";
  if (typeof task.title !== "string") return "missing title";
  if (!KINDS.some((kind) => kind.id === task.kind)) {
    return `unknown kind "${task.kind}"`;
  }
  // The model promises a valid IANA zone (createTask); hand-edited storage
  // may break that and `Intl` would throw on the render path (counter
  // detail, engine scheduling). The engine guards itself as well.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: task.zone });
  } catch {
    return "invalid IANA zone";
  }
  if (task.kind === "loop") {
    return !!task.rule &&
      Number.isFinite(task.rule.every) &&
      typeof task.rule.unit === "string"
      ? null
      : "loop missing rule fields";
  }
  if (task.kind === "date") {
    return typeof task.targetDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(task.targetDate)
      ? null
      : "invalid targetDate";
  }
  return typeof task.startedAt === "string" && !Number.isNaN(Date.parse(task.startedAt))
    ? null
    : "invalid startedAt";
}

function forDisplay(list) {
  const displayable = [];
  const skipped = [];
  for (const task of list) {
    const problem = renderProblem(task);
    if (problem === null) {
      displayable.push(task);
      continue;
    }
    if (!warnedUnrenderable.has(task)) {
      warnedUnrenderable.add(task);
      console.warn(
        `Loopo: skipping a stored task — ${problem} (id ${task?.id ?? "unknown"}).`
      );
    }
    skipped.push(task);
  }
  updateSkipBanner(skipped);
  return displayable;
}

/**
 * Surface hidden (invalid) tasks as one warn banner: titles via
 * `textContent`, capped so a badly broken envelope cannot flood the view.
 * Dismissal is final for the session — a re-render must not nag.
 */
function updateSkipBanner(skipped) {
  if (skipped.length === 0) {
    banners.dismiss("skips");
    return;
  }
  const labels = skipped.slice(0, 3).map((task) => {
    const title =
      task && typeof task.title === "string" && task.title !== ""
        ? task.title
        : null;
    return title === null ? `id ${task?.id ?? "unknown"}` : `"${title}"`;
  });
  const more =
    skipped.length > labels.length ? ` +${skipped.length - labels.length} more` : "";
  banners.show(
    "skips",
    `${skipped.length} reminder${skipped.length === 1 ? "" : "s"} cannot be ` +
      `displayed (invalid stored data): ${labels.join(", ")}${more}. ` +
      `The stored value is left untouched.`,
    { tone: "warn" }
  );
}

function persist() {
  if (readOnly) {
    // Blocked storage: every write would fail with the message the
    // persistent read-only banner already carries — no per-write nag.
    return;
  }
  const saved = saveTasks(tasks);
  if (saved.ok) {
    banners.dismiss("save:quota");
    return;
  }
  console.warn(`Loopo: ${saved.error.message}`);
  if (saved.error.type === "unavailable") {
    // Storage blocked mid-session (spec: "when storage is blocked") —
    // flip to session-local read-only instead of nagging on every write.
    enterReadOnly();
    return;
  }
  // A save that fails *again* must speak again after a dismissal (quota).
  banners.show(`save:${saved.error.type}`, saved.error.message, {
    tone: "error",
    reshow: true,
  });
}

/**
 * Run the engine once and surface what it found; persist only when
 * something advanced (a fresh loop's first `nextAt`, a crossing moved past
 * `now`, or a newly deduped notification anchor).
 * @param {{ persistChanges?: boolean }} options — `commit` passes false to
 *   fold its own write and the engine's/notification anchors into a single
 *   atomic `setItem`.
 */
function runEngine({ persistChanges = true } = {}) {
  const { changed, occurrences } = tick(tasks, Date.now());
  const surfaced = consumeOccurrences({
    doc: document,
    win: window,
    tasks,
    occurrences,
    notices: noticesSlot,
  }).changed;
  if ((changed || surfaced) && persistChanges) persist();
}

function refresh() {
  runEngine();
  // The permission can change outside the app (browser settings) — re-read
  // it on every pass so the header row never shows a stale control.
  permissionRow.refresh();
  render();
}

/** Add (fresh id) or replace (same id), then persist and re-render. */
function commit(task) {
  const index = tasks.findIndex((candidate) => candidate.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  runEngine({ persistChanges: false }); // a fresh loop gets its nextAt now
  persist();
  render();
}

/**
 * Drop one-shot notices whose task no longer exists (deleted here, or
 * adopted away by a `storage` event) — badges vanish with the task, so a
 * notice must not outlive it (T5 handoff).
 */
function purgeNotices() {
  const known = new Set(tasks.map((task) => task && task.id));
  for (const notice of noticesSlot.querySelectorAll(".notice")) {
    const id = notice.getAttribute("data-task-id");
    if (id !== null && !known.has(id)) notice.remove();
  }
}

function render() {
  purgeNotices();
  const displayable = forDisplay(tasks);
  listSlot.replaceChildren(
    displayable.length > 0
      ? renderList(document, displayable, {
          readOnly,
          onEdit(id) {
            if (readOnly) return; // belt: the buttons are disabled
            const task = tasks.find((candidate) => candidate.id === id);
            if (task) form.edit(task);
          },
          onDelete(id) {
            if (readOnly) return; // belt: the buttons are disabled
            tasks = tasks.filter((candidate) => candidate.id !== id);
            // Deleting the task being edited must not leave a form whose
            // "Save changes" would resurrect it (review SF-1).
            form.resetIfEditing(id);
            persist();
            render();
          },
        })
      : renderEmptyState(document)
  );
}

// Engine + paint: on load, on a timer while open, on becoming visible again
// and on focus (spec Synopsis: "on load, on a timer while open, and on
// visibilitychange/focus").
refresh();
setInterval(refresh, 30_000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refresh();
});
window.addEventListener("focus", refresh);

// Last-write-wins convergence (spec row 120): the event carries the value
// that WON storage, so this tab adopts it wholesale — tasks, schedule state
// and notification anchors together (subsumes T5's anchor-only sync; the
// guards travel: envelope schemaVersion/shape here, anchor types in
// `sanitizeAnchors`). An unreadable or foreign-version update is ignored —
// never adopt data we cannot trust. A cleared key (newValue null)
// converges to an empty list: that write won too.
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  let next;
  if (event.newValue === null) {
    next = [];
  } else {
    try {
      const parsed = JSON.parse(event.newValue);
      if (
        !(
          parsed &&
          parsed.schemaVersion === SCHEMA_VERSION &&
          Array.isArray(parsed.tasks)
        )
      ) {
        console.warn("Loopo: ignoring a storage update with an unknown shape.");
        return;
      }
      next = parsed.tasks;
    } catch {
      console.warn("Loopo: ignoring an unreadable storage update.");
      return;
    }
  }

  const previousIds = new Set(tasks.map((task) => task && task.id));
  tasks = next;
  sanitizeAnchors(tasks);
  for (const task of tasks) {
    if (task && typeof task === "object") {
      // An open edit keeps the adopted dedupe anchor, so saving after
      // another tab's notification cannot resurrect a stale one.
      form.syncAnchor(task.id, task);
    }
  }
  for (const id of previousIds) {
    if (id !== null && !tasks.some((task) => task && task.id === id)) {
      form.resetIfEditing(id); // the task being edited just disappeared
    }
  }
  refresh(); // engine + permission row + render (purges stale notices)
});
