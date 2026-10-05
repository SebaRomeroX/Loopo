/**
 * The single add/edit form (spec Synopsis: "the kind picker is a first-class
 * control that swaps the form's second field"). Two modes — add (default)
 * and edit (prefilled; Cancel returns to add).
 *
 * Field values become a task through `createTask`, so what reaches the store
 * is validated exactly once; a rejection is rendered in the form's alert
 * region instead of thrown at the page. User-visible text always lands
 * through `textContent` or input `.value` — never markup.
 */
import { KINDS } from "./kinds.js";
import { createTask } from "./tasks.js";

/** Loop units this form offers — T4's engine must evaluate all four. */
export const UNITS = ["hours", "days", "weeks", "months"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** An ISO instant → local `datetime-local` value (`YYYY-MM-DDTHH:mm`).
 *  Always the *browser's* wall clock, never the task zone: the control
 *  round-trips local → instant on save, so a task-zone prefill would
 *  silently shift the stored instant whenever the two zones differ. */
function toLocalInput(iso) {
  const d = new Date(iso);
  return (
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` +
    `T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  );
}

/**
 * @param {Document} doc
 * @param {{ onSubmit: (task: object) => void }} handlers
 *   `onSubmit` receives a fully validated task (same id on edit, fresh id
 *   on add); persisting and re-rendering are the caller's job.
 */
export function createForm(doc, { onSubmit }) {
  const form = doc.createElement("form");
  form.className = "task-form";
  form.setAttribute("aria-labelledby", "task-form-title");
  form.noValidate = true; // one alert region reports every problem

  const heading = doc.createElement("h2");
  heading.className = "task-form__title";
  heading.id = "task-form-title";
  heading.textContent = "Add reminder";

  function labelFor(text, htmlFor) {
    const label = doc.createElement("label");
    label.className = "field__label";
    label.htmlFor = htmlFor;
    label.textContent = text;
    return label;
  }

  function input(id, type) {
    const element = doc.createElement("input");
    element.id = id;
    element.name = id;
    element.type = type;
    return element;
  }

  function field(labelText, control) {
    const wrap = doc.createElement("div");
    wrap.className = "field";
    wrap.appendChild(labelFor(labelText, control.id));
    wrap.appendChild(control);
    return wrap;
  }

  function fieldRow(...fields) {
    const row = doc.createElement("div");
    row.className = "field-row";
    for (const child of fields) row.appendChild(child);
    return row;
  }

  function kindGroup(kind, ...children) {
    const group = doc.createElement("div");
    group.className = "kind-fields";
    group.setAttribute("data-kind", kind);
    group.hidden = true;
    for (const child of children) group.appendChild(child);
    return group;
  }

  // --- title ---------------------------------------------------------------

  const titleInput = input("task-title", "text");
  titleInput.setAttribute("autocomplete", "off");

  // --- kind picker ---------------------------------------------------------

  const picker = doc.createElement("fieldset");
  picker.className = "kind-picker";
  const legend = doc.createElement("legend");
  legend.className = "field__label";
  legend.textContent = "Kind";
  picker.appendChild(legend);

  const options = doc.createElement("div");
  options.className = "kind-options";
  const radios = KINDS.map((kind) => {
    const label = doc.createElement("label");
    label.className = "kind-option";
    const radio = doc.createElement("input");
    radio.type = "radio";
    radio.name = "kind";
    radio.value = kind.id;
    const text = doc.createElement("span");
    text.textContent = kind.label;
    label.appendChild(radio);
    label.appendChild(text);
    options.appendChild(label);
    return radio;
  });
  picker.appendChild(options);

  // --- kind-specific second field -----------------------------------------

  const everyInput = input("task-every", "number");
  everyInput.min = "1";
  everyInput.step = "1";
  everyInput.value = "1";

  const unitSelect = doc.createElement("select");
  unitSelect.id = "task-unit";
  unitSelect.name = "task-unit";
  for (const unit of UNITS) {
    const option = doc.createElement("option");
    option.value = unit;
    option.textContent = unit;
    unitSelect.appendChild(option);
  }
  unitSelect.value = "days";

  const dateInput = input("task-date", "date");
  const startInput = input("task-start", "datetime-local");

  const kindGroups = [
    kindGroup("loop", fieldRow(field("Every", everyInput), field("Unit", unitSelect))),
    kindGroup("date", field("Target date", dateInput)),
    kindGroup("counter", field("Started at", startInput)),
  ];

  // --- alert region --------------------------------------------------------

  const error = doc.createElement("p");
  error.className = "form-error";
  error.setAttribute("role", "alert");
  error.hidden = true;

  function clearError() {
    error.textContent = "";
    error.hidden = true;
  }

  function fail(message, control) {
    error.hidden = false; // unhide first so role="alert" announces the text
    error.textContent = message;
    if (control) control.focus();
    return false;
  }

  // --- actions -------------------------------------------------------------

  const submit = doc.createElement("button");
  submit.type = "submit";
  submit.className = "btn btn--primary";
  submit.textContent = "Add reminder";

  const cancel = doc.createElement("button");
  cancel.type = "button";
  cancel.className = "btn btn--ghost";
  cancel.textContent = "Cancel";
  cancel.hidden = true;

  const actions = doc.createElement("div");
  actions.className = "form-actions";
  actions.appendChild(submit);
  actions.appendChild(cancel);

  form.appendChild(heading);
  form.appendChild(field("Title", titleInput));
  form.appendChild(picker);
  for (const group of kindGroups) form.appendChild(group);
  form.appendChild(error);
  form.appendChild(actions);

  // --- mode + field state --------------------------------------------------

  /** The task being edited, or null in add mode. */
  let editing = null;

  function selectedKind() {
    for (const radio of radios) {
      if (radio.checked) return radio.value;
    }
    return KINDS[0].id;
  }

  /** The one behavior the spec calls out: the picker swaps the second field. */
  function syncKindFields() {
    const kind = selectedKind();
    for (const group of kindGroups) {
      group.hidden = group.getAttribute("data-kind") !== kind;
    }
  }

  for (const radio of radios) {
    radio.addEventListener("change", () => {
      clearError();
      syncKindFields();
    });
  }

  function fill(task) {
    const kind = task ? task.kind : KINDS[0].id;
    titleInput.value = task ? task.title : "";
    for (const radio of radios) radio.checked = radio.value === kind;
    everyInput.value = task && task.kind === "loop" ? String(task.rule.every) : "1";
    unitSelect.value = task && task.kind === "loop" ? task.rule.unit : "days";
    dateInput.value = task && task.kind === "date" ? task.targetDate : "";
    startInput.value =
      task && task.kind === "counter"
        ? toLocalInput(task.startedAt)
        : toLocalInput(new Date().toISOString());
    syncKindFields();
  }

  function setMode(task) {
    editing = task ?? null;
    heading.textContent = editing ? "Edit reminder" : "Add reminder";
    submit.textContent = editing ? "Save changes" : "Add reminder";
    cancel.hidden = !editing;
  }

  // --- submit --------------------------------------------------------------

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();

    const title = titleInput.value.trim();
    if (title === "") {
      return fail("Give the reminder a title.", titleInput);
    }

    const kind = selectedKind();
    const draft = { title, kind };

    if (kind === "loop") {
      const every = Number(everyInput.value);
      if (!Number.isInteger(every) || every < 1) {
        return fail("Repeat every needs a whole number of 1 or more.", everyInput);
      }
      draft.rule = { every, unit: unitSelect.value };
    } else if (kind === "date") {
      if (dateInput.value === "") {
        return fail("Pick the target date.", dateInput);
      }
      draft.targetDate = dateInput.value;
    } else {
      const startedAt = new Date(startInput.value);
      if (Number.isNaN(startedAt.getTime())) {
        return fail("Pick when the counter started.", startInput);
      }
      draft.startedAt = startedAt.toISOString();
    }

    let task;
    try {
      // An edit keeps its zone; the identity fields are carried over below.
      task = createTask(editing ? { ...draft, zone: editing.zone } : draft);
    } catch (cause) {
      const message = cause && cause.message ? cause.message : String(cause);
      return fail(message);
    }

    if (editing) {
      task.id = editing.id;
      // An edit keeps the notification dedupe anchor (T5): occurrence
      // identity is task id + occurrence instant, so a carried anchor stops
      // an already-shown occurrence from firing again. A loop edit still
      // restarts nextAt at null — a rule change invalidates the computed
      // time and the reminder engine (T4) recomputes it.
      if ("lastNotifiedAt" in editing) {
        task.lastNotifiedAt = editing.lastNotifiedAt;
      }
    }

    onSubmit(task);
    fill(null);
    setMode(null);
    titleInput.focus();
    return true;
  });

  cancel.addEventListener("click", () => {
    clearError();
    fill(null);
    setMode(null);
    titleInput.focus();
  });

  fill(null);
  setMode(null);

  return {
    element: form,
    /** Prefill the form for editing `task` and focus it. */
    edit(task) {
      clearError();
      fill(task);
      setMode(task);
      titleInput.select();
    },
    /** Drop edit mode when `taskId` is the task being edited (its row may
     *  disappear — a delete here or a `storage` event from T6). */
    resetIfEditing(taskId) {
      if (editing && editing.id === taskId) {
        clearError();
        fill(null);
        setMode(null);
      }
    },
  };
}
