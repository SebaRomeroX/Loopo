/**
 * Entry module: wires the T2 store to the T3 UI — the add/edit form above the
 * list (or the first-run empty state when no task exists). Every change goes
 * through `saveTasks`; load/save failures are reported on the console until
 * T6 lands the banner/message UI.
 */
import { loadTasks, saveTasks } from "./store.js";
import { KINDS } from "./kinds.js";
import { renderEmptyState } from "./empty-state.js";
import { renderList } from "./list.js";
import { createForm } from "./form.js";

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

/** Add (fresh id) or replace (same id), then persist and re-render. */
function commit(task) {
  const index = tasks.findIndex((candidate) => candidate.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
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

render();
