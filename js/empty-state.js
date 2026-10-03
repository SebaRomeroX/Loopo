/**
 * First-run empty state: one example per reminder kind, shaped like the task
 * objects from the spec's Synopsis. All text renders through `textContent` —
 * titles are data, never markup.
 */
import { kindLabel } from "./kinds.js";

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

/** Recurrence rule: plain data, no clock involved yet (due logic is T4). */
function loopDetail(rule) {
  return `every ${rule.every} ${rule.unit}`;
}

/** A `targetDate` is a calendar date: format in UTC so the day never shifts. */
function dateDetail(targetDate) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(targetDate));
}

/** An instant is formatted in the task's stored IANA zone (ADR 0001). */
function counterDetail(startedAt, zone) {
  return `since ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: zone,
  }).format(new Date(startedAt))}`;
}

function detailFor(example) {
  switch (example.kind) {
    case "loop":
      return loopDetail(example.rule);
    case "date":
      return dateDetail(example.targetDate);
    case "counter":
      return counterDetail(example.startedAt, example.zone);
  }
}

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
  detail.textContent = detailFor(example);

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
