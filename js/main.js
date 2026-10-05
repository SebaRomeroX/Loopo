/**
 * Entry module: wires the T2 store to the T3 UI — the add/edit form above the
 * list (or the first-run empty state when no task exists). Every change goes
 * through `saveTasks`; load/save failures are reported on the console until
 * T6 lands the banner/message UI.
 *
 * The reminder engine (T4) runs on load, on a 30 s timer while the page is
 * open, on `visibilitychange` (back to visible) and on `focus` (spec
 * Synopsis): it initializes/advances loop `nextAt` (persisting only when it
 * actually advanced) and collects occurrences — the stream T5's in-tab
 * notifications will consume.
 */
import { loadTasks, saveTasks } from "./store.js";
import { KINDS } from "./kinds.js";
import { renderEmptyState } from "./empty-state.js";
import { renderList } from "./list.js";
import { createForm } from "./form.js";
import { tick } from "./engine.js";

const app = document.getElementById("app");

const loaded = loadTasks();
if (loaded.failure) {
  console.warn(`Loopo: ${loaded.failure.message}`);
}
let tasks = loaded.tasks;

const form = createForm(document, { onSubmit: commit });
const listSlot = document.createElement("div");
app.appendChild(form.element);
app.appendChild(listSlot);

const warnedUnrenderable = new Set();

/**
 * Display gate for untrusted stored entries: a task missing its kind's
 * fields must not blank the whole list (`taskDetail` throws loudly by
 * design). Skipped entries stay in `tasks` and are persisted untouched —
 * only the view skips them (T6 turns the warning into a banner).
 */
function isRenderable(task) {
  if (!task || typeof task !== "object" || typeof task.title !== "string") {
    return false;
  }
  if (!KINDS.some((kind) => kind.id === task.kind)) return false;
  // The model promises a valid IANA zone (createTask); hand-edited storage
  // may break that and `Intl` would throw on the render path (counter
  // detail, engine scheduling). The engine guards itself as well.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: task.zone });
  } catch {
    return false;
  }
  if (task.kind === "loop") {
    return (
      !!task.rule &&
      Number.isFinite(task.rule.every) &&
      typeof task.rule.unit === "string"
    );
  }
  if (task.kind === "date") {
    return (
      typeof task.targetDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(task.targetDate)
    );
  }
  return typeof task.startedAt === "string" && !Number.isNaN(Date.parse(task.startedAt));
}

function forDisplay(list) {
  return list.filter((task) => {
    if (isRenderable(task)) return true;
    if (!warnedUnrenderable.has(task)) {
      warnedUnrenderable.add(task);
      console.warn(
        `Loopo: skipping a stored task without a valid kind payload (${task?.id ?? "no id"}).`
      );
    }
    return false;
  });
}

function persist() {
  const saved = saveTasks(tasks);
  if (!saved.ok) {
    console.warn(`Loopo: ${saved.error.message}`);
  }
}

/**
 * Run the engine once; persist only when it advanced state (a fresh loop's
 * first `nextAt`, or a crossing moved past `now`).
 * @param {{ persistChanges?: boolean }} options — `commit` passes false to
 *   fold its own write and the engine's into a single atomic `setItem`.
 */
function runEngine({ persistChanges = true } = {}) {
  const { changed } = tick(tasks, Date.now());
  // tick() also yields `occurrences` — the stream T5's notifications consume.
  if (changed && persistChanges) persist();
}

function refresh() {
  runEngine();
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

function render() {
  const displayable = forDisplay(tasks);
  listSlot.replaceChildren(
    displayable.length > 0
      ? renderList(document, displayable, {
          onEdit(id) {
            const task = tasks.find((candidate) => candidate.id === id);
            if (task) form.edit(task);
          },
          onDelete(id) {
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
