/**
 * Reminder engine (plan §T4, ADR 0001): due computation over the stored IANA
 * zone with `Date` + `Intl.DateTimeFormat` — no `Temporal`, no dependencies.
 *
 * Recurrence semantics per unit (spec invariant 4 — "wall-clock times survive
 * DST transitions", e.g. 09:00 stays 09:00):
 *  - `days`/`weeks`/`months` step by *wall-clock* field arithmetic in the
 *    task's zone, so a daily 09:00 rule crosses a DST transition at 09:00
 *    even though that day lasts 23/25 real hours;
 *  - `hours` steps by real elapsed time (a 2-hour cadence is elapsed time,
 *    not a wall-clock appointment).
 *
 * `tick(tasks, now)` advances state and produces the occurrence stream T5
 * dedupes: at most one occurrence per due loop crossing and one per date
 * task per page session (dedupe key: task id + occurrence instant). Loop
 * occurrences observed later than `MISSED_SLACK_MS` carry `missed: true`.
 *
 * Everything guards against untrusted stored data: an invalid zone, rule or
 * instant degrades to "cannot schedule" (nextAt cleared + warn-once) instead
 * of throwing — a corrupt entry must never blank the list.
 */

const MS_MINUTE = 60_000;
const MS_DAY = 86_400_000;
/** Loop steps beyond this many missed occurrences anchor from `now` (O(1)). */
const STEP_CAP = 1_000;
/** A crossing observed later than this was not seen live → `missed`. */
const MISSED_SLACK_MS = 2 * MS_MINUTE;

const formatters = new Map();
const warned = new Set();

function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function partsFormatter(zone) {
  if (formatters.has(zone)) return formatters.get(zone);
  let formatter = null;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
  } catch {
    formatter = null; // invalid zone name — callers degrade, never throw
  }
  formatters.set(zone, formatter);
  return formatter;
}

/** Wall-clock fields of `ms` in `zone`, or null when the zone is invalid. */
function zoneParts(ms, zone) {
  const formatter = partsFormatter(zone);
  if (!formatter) return null;
  const found = {};
  for (const part of formatter.formatToParts(new Date(ms))) {
    if (part.type !== "literal") found[part.type] = Number(part.value);
  }
  const { year, month, day, hour, minute, second } = found;
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  return { year, month, day, hour, minute, second: Number.isFinite(second) ? second : 0 };
}

function zoneOffsetMs(ms, zone) {
  const parts = zoneParts(ms, zone);
  if (!parts) return 0;
  const asIfUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asIfUtc - Math.floor(ms / 1000) * 1000;
}

function sameWallClock(ms, wall, zone) {
  const parts = zoneParts(ms, zone);
  return (
    parts !== null &&
    parts.year === wall.year &&
    parts.month === wall.month &&
    parts.day === wall.day &&
    parts.hour === wall.hour &&
    parts.minute === wall.minute
  );
}

/**
 * Wall-clock fields in `zone` → the instant carrying them (two-pass offset
 * resolution; no Temporal). Nonexistent wall times in a spring-forward gap
 * resolve to the post-transition instant; ambiguous fall-back times resolve
 * deterministically to one of the two candidates.
 * @returns {number | null}
 */
function wallToInstant(wall, zone) {
  const utcGuess = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second ?? 0
  );
  if (!Number.isFinite(utcGuess)) return null;
  const first = utcGuess - zoneOffsetMs(utcGuess, zone);
  const second = utcGuess - zoneOffsetMs(first, zone);
  if (!Number.isFinite(second)) return Number.isFinite(first) ? first : null;
  if (sameWallClock(second, wall, zone)) return second;
  if (sameWallClock(first, wall, zone)) return first;
  return second;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * One recurrence step after `fromMs`, per the task's zone.
 * @returns {number | null} null when the rule/zone cannot be scheduled
 *   (unknown unit, non-integer or unbounded `every`, invalid zone).
 */
export function nextAfter(fromMs, rule, zone) {
  if (
    !rule ||
    !Number.isInteger(rule.every) ||
    rule.every <= 0 ||
    !Number.isFinite(fromMs)
  ) {
    return null;
  }

  if (rule.unit === "hours") {
    const stepped = fromMs + rule.every * 3_600_000;
    return Number.isFinite(stepped) ? stepped : null;
  }

  const from = zoneParts(fromMs, zone);
  if (!from) return null;

  if (rule.unit === "days" || rule.unit === "weeks") {
    const dayDelta = rule.unit === "weeks" ? rule.every * 7 : rule.every;
    const wallUtc = Date.UTC(
      from.year,
      from.month - 1,
      from.day + dayDelta,
      from.hour,
      from.minute,
      from.second
    );
    if (!Number.isFinite(wallUtc)) return null;
    const stepped = new Date(wallUtc);
    return wallToInstant(
      {
        year: stepped.getUTCFullYear(),
        month: stepped.getUTCMonth() + 1,
        day: stepped.getUTCDate(),
        hour: stepped.getUTCHours(),
        minute: stepped.getUTCMinutes(),
        second: stepped.getUTCSeconds(),
      },
      zone
    );
  }

  if (rule.unit === "months") {
    const total = from.year * 12 + (from.month - 1) + rule.every;
    const year = Math.floor(total / 12);
    const month = total - year * 12 + 1;
    return wallToInstant(
      {
        year,
        month,
        day: Math.min(from.day, daysInMonth(year, month)),
        hour: from.hour,
        minute: from.minute,
        second: from.second,
      },
      zone
    );
  }

  return null;
}

/** The task's "today" as a UTC-anchored day number, or null. */
function todayMs(now, zone) {
  const parts = zoneParts(now, zone);
  if (!parts) return null;
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/**
 * Due state of one task at instant `now` — pure, single source of truth for
 * both the display badges (via `format.js`) and the occurrence stream.
 * @returns {null | { due: boolean, nextAt?: string | null, daysLeft?: number | null, elapsedMs?: number | null }}
 */
export function evaluateTask(task, now) {
  if (!task || typeof task !== "object") return null;

  switch (task.kind) {
    case "loop": {
      const at = typeof task.nextAt === "string" ? Date.parse(task.nextAt) : NaN;
      if (!Number.isFinite(at)) return { due: false, nextAt: null };
      return { due: now >= at, nextAt: task.nextAt, at };
    }
    case "date": {
      const target = Date.parse(`${task.targetDate}T00:00:00.000Z`);
      const today = todayMs(now, task.zone);
      if (!Number.isFinite(target) || today === null) {
        return { due: false, daysLeft: null };
      }
      const daysLeft = Math.round((target - today) / MS_DAY);
      return { due: daysLeft <= 0, daysLeft };
    }
    case "counter": {
      const started = Date.parse(task.startedAt);
      if (!Number.isFinite(started)) return { due: false, elapsedMs: null };
      return { due: false, elapsedMs: Math.max(0, now - started) };
    }
    default:
      return null;
  }
}

/**
 * Advance a due loop's `nextAt` strictly past `now` (wall-clock steps in the
 * task's zone). Too many missed steps anchor from `now`; an unschedulable
 * step clears `nextAt` so the task stops firing instead of storming.
 */
function advancePast(fromMs, now, rule, zone) {
  let step = fromMs;
  for (let i = 0; i < STEP_CAP; i += 1) {
    const next = nextAfter(step, rule, zone);
    if (next === null) return { next: null, reason: "unschedulable" };
    if (next > now) return { next, reason: null };
    step = next;
  }
  const jump = nextAfter(now, rule, zone);
  if (jump === null) return { next: null, reason: "unschedulable" };
  return { next: jump, reason: "anchored-from-now" };
}

/** Date tasks that already emitted their occurrence this page session. */
const dateEmitted = new Set();

/**
 * Run the engine over the list: initialize/advance loop `nextAt`, collect
 * due occurrences. Mutates `nextAt` in place; `changed` says a persist is
 * due. Pure with respect to `now` — callers pass `Date.now()`.
 * @returns {{ changed: boolean, occurrences: Array<{ taskId: string, kind: string, at: string, missed: boolean }> }}
 */
export function tick(tasks, now) {
  let changed = false;
  const occurrences = [];

  for (const task of tasks) {
    if (!task || typeof task !== "object") continue;

    if (task.kind === "loop") {
      if (task.nextAt === null || task.nextAt === undefined) {
        // Fresh or reset (create/edit) loop: first occurrence one full rule
        // from "first computed" — persisted immediately so reloads keep it.
        const first = nextAfter(now, task.rule, task.zone);
        if (first === null) {
          warnOnce(
            `sched:${task.id}`,
            `Loopo: cannot schedule "${task.id}" — rule or zone unusable.`
          );
        } else {
          task.nextAt = new Date(first).toISOString();
          changed = true;
        }
        continue;
      }

      const at = Date.parse(task.nextAt);
      if (!Number.isFinite(at)) {
        task.nextAt = null; // corrupt instant: re-initialize next tick
        changed = true;
        continue;
      }
      if (now < at) continue;

      occurrences.push({
        taskId: task.id,
        kind: "loop",
        at: task.nextAt,
        missed: now - at > MISSED_SLACK_MS,
      });

      const advanced = advancePast(at, now, task.rule, task.zone);
      if (advanced.next === null) {
        warnOnce(
          `sched:${task.id}`,
          `Loopo: cannot schedule "${task.id}" — rule or zone unusable.`
        );
        task.nextAt = null;
      } else {
        if (advanced.reason) {
          warnOnce(
            `sched:${task.id}`,
            `Loopo: "${task.id}" missed more than ${STEP_CAP} occurrences — anchored from now.`
          );
        }
        task.nextAt = new Date(advanced.next).toISOString();
      }
      changed = true;
      continue;
    }

    if (task.kind === "date") {
      const evaluation = evaluateTask(task, now);
      if (!evaluation?.due || evaluation.daysLeft === null) continue;
      if (dateEmitted.has(task.id)) continue;
      dateEmitted.add(task.id);
      occurrences.push({
        taskId: task.id,
        kind: "date",
        at: task.targetDate,
        missed: evaluation.daysLeft < 0,
      });
      continue;
    }

    // counter: display-only, never an occurrence (T4 scope; spec shows it
    // as elapsed time, notifications are T5's call).
  }

  return { changed, occurrences };
}
