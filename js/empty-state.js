/**
 * First-run empty state: one example per reminder kind, shaped like the task
 * objects from the spec's Synopsis. All text renders through `textContent` —
 * titles are data, never markup.
 */
import { kindLabel } from "./kinds.js";
import { taskDetail } from "./format.js";

const EXAMPLES = [
  { kind: "loop", title: "Drink water", rule: { every: 2, unit: "hours" } },
  { kind: "date", title: "Math exam", targetDate: "2026-10-18" },
  {
    kind: "counter",
    title: "Called mom",
    startedAt: "2026-09-24T10:00:00+02:00",
    zone: "Europe/Berlin",
  },
];

function exampleElement(doc, example) {
  const item = doc.createElement("li");
  item.className = "example";

  const kind = doc.createElement("span");
  kind.className = "example__kind";
  kind.textContent = kindLabel(example.kind);

  const title = doc.createElement("span");
  title.className = "example__title";
  title.textContent = example.title;

  const detail = doc.createElement("span");
  detail.className = "example__detail";
  detail.textContent = taskDetail(example);

  item.appendChild(kind);
  item.appendChild(title);
  item.appendChild(detail);
  return item;
}

export function renderEmptyState(doc) {
  const section = doc.createElement("section");
  section.className = "empty-state";
  section.setAttribute("aria-labelledby", "empty-state-title");

  const title = doc.createElement("h2");
  title.className = "empty-state__title";
  title.id = "empty-state-title";
  title.textContent = "No reminders yet";

  const hint = doc.createElement("p");
  hint.className = "empty-state__hint";
  hint.textContent = "Loopo keeps track of three kinds of reminders:";

  const list = doc.createElement("ul");
  list.className = "examples";
  for (const example of EXAMPLES) {
    list.appendChild(exampleElement(doc, example));
  }

  section.appendChild(title);
  section.appendChild(hint);
  section.appendChild(list);
  return section;
}
