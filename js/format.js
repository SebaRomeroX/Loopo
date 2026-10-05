/**
 * Display formatting shared by the empty state and the task list — one place
 * where a task becomes a one-line human detail. Pure data → string; no DOM
 * (rendering stays with the caller, through `textContent`).
 *
 * Due state comes from the engine (`evaluateTask`) so the badge and the
 * occurrence stream can never disagree (plan §T4).
 */
import { evaluateTask } from "./engine.js";

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

/** Elapsed time as days/hours/minutes (spec row 6 — refreshes while open). */
function elapsedText(elapsedMs) {
  const totalMinutes = Math.floor(elapsedMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h elapsed`;
  if (hours > 0) return `${hours}h ${minutes}m elapsed`;
  return `${minutes}m elapsed`;
}

/**
 * The one-line due status of a task at `now`, or null when there is
 * nothing worth a line (upcoming loop, unusable data). A date task counts
 * *down* to its target and switches to due/overdue — a negative day count
 * is never rendered (spec row 5).
 * @returns {null | { text: string, due: boolean }}
 */
export function taskStatus(task, now) {
  const evaluation = evaluateTask(task, now);
  if (!evaluation) return null;

  switch (task.kind) {
    case "loop":
      return evaluation.due ? { text: "Due now", due: true } : null;
    case "date": {
      if (evaluation.daysLeft === null) return null;
      if (evaluation.daysLeft > 0) {
        const text = `in ${evaluation.daysLeft} ${evaluation.daysLeft === 1 ? "day" : "days"}`;
        return { text, due: false };
      }
      if (evaluation.daysLeft === 0) return { text: "Due today", due: true };
      return { text: "Overdue", due: true }; // never a negative count
    }
    case "counter":
      if (evaluation.elapsedMs === null) return null;
      return { text: elapsedText(evaluation.elapsedMs), due: false };
    default:
      return null;
  }
}
