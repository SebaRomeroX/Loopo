/**
 * Task model — the canonical shape of a task inside the `loopo.tasks`
 * envelope (spec Synopsis). This module creates and checks tasks; the form
 * that gathers them is T3, due-time computation is T4, persistence is
 * `js/store.js`.
 */
import { KINDS } from "./kinds.js";

function newTaskId() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return `t_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function defaultZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Build a spec-shaped task. Throws loudly on a missing or malformed required
 * field — a task that cannot satisfy its kind has no business reaching
 * storage.
 */
export function createTask({
  title,
  kind,
  zone = defaultZone(),
  rule,
  targetDate,
  startedAt,
}) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new Error("createTask: a non-empty title is required");
  }
  if (!KINDS.some((entry) => entry.id === kind)) {
    throw new Error(`createTask: unknown kind "${kind}"`);
  }
  if (typeof zone !== "string" || zone === "") {
    throw new Error("createTask: zone is required");
  }

  const task = { id: newTaskId(), title: title.trim(), kind, zone };

  switch (kind) {
    case "loop": {
      if (
        !rule ||
        !Number.isFinite(rule.every) ||
        rule.every <= 0 ||
        typeof rule.unit !== "string" ||
        rule.unit === ""
      ) {
        throw new Error("createTask: loop needs rule { every > 0, unit }");
      }
      task.rule = { every: rule.every, unit: rule.unit };
      task.nextAt = null; // computed by the reminder engine (T4)
      task.lastNotifiedAt = null;
      break;
    }
    case "date": {
      if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        throw new Error("createTask: date needs targetDate as YYYY-MM-DD");
      }
      task.targetDate = targetDate;
      task.lastNotifiedAt = null; // notification dedupe anchor (T5)
      break;
    }
    case "counter": {
      if (typeof startedAt !== "string" || Number.isNaN(Date.parse(startedAt))) {
        throw new Error("createTask: counter needs a parseable startedAt instant");
      }
      task.startedAt = startedAt;
      break;
    }
  }

  return task;
}
