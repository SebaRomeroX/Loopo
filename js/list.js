/**
 * Task list: one card per task with its engine-computed due status and
 * always-visible Edit/Delete actions — nothing is revealed on hover. Every
 * text node is set through `textContent`.
 */
import { kindLabel } from "./kinds.js";
import { taskDetail, taskStatus } from "./format.js";

function actionButton(doc, { text, ariaLabel, className, onClick }) {
  const button = doc.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", onClick);
  return button;
}

function taskElement(doc, task, { onEdit, onDelete, readOnly }) {
  const status = taskStatus(task, Date.now());

  const item = doc.createElement("li");
  item.className = status && status.due ? "task task--due" : "task";

  const body = doc.createElement("div");
  body.className = "task__body";

  const kind = doc.createElement("span");
  kind.className = "task__kind";
  kind.textContent = kindLabel(task.kind);

  const title = doc.createElement("span");
  title.className = "task__title";
  title.textContent = task.title;

  const detail = doc.createElement("span");
  detail.className = "task__detail";
  detail.textContent = taskDetail(task);

  body.appendChild(kind);
  body.appendChild(title);
  body.appendChild(detail);
  if (status) {
    const line = doc.createElement("span");
    line.className = status.due ? "task__status task__status--due" : "task__status";
    line.textContent = status.text;
    body.appendChild(line);
  }

  const actions = doc.createElement("div");
  actions.className = "task__actions";
  const editButton = actionButton(doc, {
    text: "Edit",
    ariaLabel: `Edit ${task.title}`,
    className: "btn btn--ghost",
    onClick: () => onEdit(task.id),
  });
  const deleteButton = actionButton(doc, {
    text: "Delete",
    ariaLabel: `Delete ${task.title}`,
    className: "btn btn--ghost btn--danger",
    onClick: () => onDelete(task.id),
  });
  if (readOnly) {
    // Blocked-storage session (T6): nothing can persist, so the row actions
    // are disabled rather than pretending to work.
    editButton.disabled = true;
    deleteButton.disabled = true;
  }
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  item.appendChild(body);
  item.appendChild(actions);
  return item;
}

export function renderList(doc, tasks, { onEdit, onDelete, readOnly = false }) {
  const section = doc.createElement("section");
  section.className = "task-list";
  section.setAttribute("aria-labelledby", "task-list-title");

  const heading = doc.createElement("h2");
  heading.className = "task-list__title";
  heading.id = "task-list-title";
  heading.textContent = "Reminders";

  const list = doc.createElement("ul");
  list.className = "tasks";
  for (const task of tasks) {
    list.appendChild(taskElement(doc, task, { onEdit, onDelete, readOnly }));
  }

  section.appendChild(heading);
  section.appendChild(list);
  return section;
}
