/**
 * Display formatting shared by the empty state and the task list — one place
 * where a task becomes a one-line human detail. Pure data → string; no DOM
 * (rendering stays with the caller, through `textContent`).
 */

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
function instantDetail(iso, zone) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: zone,
  }).format(new Date(iso));
}

export function taskDetail(task) {
  switch (task.kind) {
    case "loop": {
      const unit =
        task.rule.every === 1 ? task.rule.unit.replace(/s$/, "") : task.rule.unit;
      return `every ${task.rule.every} ${unit}`;
    }
    case "date":
      return dateDetail(task.targetDate);
    case "counter":
      return `since ${instantDetail(task.startedAt, task.zone)}`;
    default:
      throw new Error(`taskDetail: unknown reminder kind "${task.kind}"`);
  }
}
