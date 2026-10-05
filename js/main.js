/**
 * Entry module: wires the T2 store to the T3 UI — the add/edit form above the
 * list (or the first-run empty state when no task exists). Every change goes
 * through `saveTasks`; load/save failures are reported on the console until
 * T6 lands the banner/message UI.
 */
import { loadTasks, saveTasks } from "./store.js";
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
listSlot.className = "list-slot";
app.appendChild(form.element);
app.appendChild(listSlot);

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
  listSlot.replaceChildren(
    tasks.length > 0
      ? renderList(document, tasks, {
          onEdit(id) {
            const task = tasks.find((candidate) => candidate.id === id);
            if (task) form.edit(task);
          },
          onDelete(id) {
            tasks = tasks.filter((candidate) => candidate.id !== id);
            persist();
            render();
          },
        })
      : renderEmptyState(document)
  );
}

render();
