/**
 * Persistence for the `loopo.tasks` envelope (spec Synopsis + failure paths).
 *
 * Invariant 1 — stored tasks are never destroyed on read:
 *  - an older envelope migrates forward (and is re-stored as the current
 *    version, best-effort);
 *  - an unreadable or too-new envelope is copied to `loopo.tasks.backup`
 *    first (write-once: a later failure never clobbers an earlier backup)
 *    and the primary key is left byte-identical — never cleared, never
 *    overwritten;
 *  - any read failure returns an empty list *and* a reported failure —
 *    the load path never throws. Banner/message UI lands in T6.
 *
 * Save is a single atomic `setItem`; when it is rejected (quota, blocked
 * storage) the stored value is platform-guaranteed untouched and the caller
 * gets `{ ok: false, error }` to surface.
 */

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = "loopo.tasks";
export const BACKUP_KEY = "loopo.tasks.backup";

/**
 * Forward migrations, keyed by the version they upgrade *from*.
 * v0 → v1: pre-versioned envelopes were plain objects without `schemaVersion`.
 */
const MIGRATIONS = {
  0: (envelope) => ({ schemaVersion: 1, tasks: envelope.tasks }),
};

function defaultStorage() {
  return globalThis.localStorage;
}

function isEnvelope(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray(value.tasks)
  );
}

/** Copy the raw value to the backup key, never overwriting an existing one. */
function backUp(storage, raw) {
  try {
    if (storage.getItem(BACKUP_KEY) === null) {
      storage.setItem(BACKUP_KEY, raw);
    }
  } catch {
    // A failing backup write must not stop the load path: the raw value
    // still sits untouched in STORAGE_KEY (load never clears it).
  }
}

/**
 * Read every task from storage.
 * @returns {{ tasks: Array<object>, failure: null | { type: string, message: string } }}
 *   failure.type: "unparseable" | "unknown-version" | "unavailable"
 */
export function loadTasks(storage) {
  let raw;
  try {
    // Resolved inside the try: with blocked storage the *getter* itself
    // throws SecurityError, which must surface as `unavailable`, not escape.
    storage = storage ?? defaultStorage();
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return {
      tasks: [],
      failure: {
        type: "unavailable",
        message: "Browser storage is unavailable — running without persistence.",
      },
    };
  }

  if (raw === null) {
    return { tasks: [], failure: null };
  }

  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    backUp(storage, raw);
    return {
      tasks: [],
      failure: {
        type: "unparseable",
        message: "Stored reminders could not be read — the stored value is left untouched; a backup copy is kept when possible.",
      },
    };
  }

  const version =
    envelope !== null && typeof envelope === "object" && !Array.isArray(envelope)
      ? envelope.schemaVersion
      : undefined;

  // A newer schema than we know: keep the primary value exactly as it is
  // (it may be a future format we must not destroy) and report it.
  if (typeof version === "number" && version > SCHEMA_VERSION) {
    backUp(storage, raw);
    return {
      tasks: [],
      failure: {
        type: "unknown-version",
        message:
          "Stored reminders come from a newer version of Loopo — the stored value is left untouched; a backup copy is kept when possible.",
      },
    };
  }

  if (version === SCHEMA_VERSION && isEnvelope(envelope)) {
    return { tasks: envelope.tasks, failure: null };
  }

  // Older (or pre-versioned) envelope: migrate forward through every step.
  const from = version === undefined ? 0 : version;
  if (!Number.isInteger(from) || from < 0 || !isEnvelope(envelope)) {
    backUp(storage, raw);
    return {
      tasks: [],
      failure: {
        type: "unparseable",
        message: "Stored reminders could not be read — the stored value is left untouched; a backup copy is kept when possible.",
      },
    };
  }

  let migrated = envelope;
  for (let step = from; step < SCHEMA_VERSION; step += 1) {
    const upgrade = MIGRATIONS[step];
    if (!upgrade) {
      backUp(storage, raw);
      return {
        tasks: [],
        failure: {
          type: "unparseable",
          message: "Stored reminders could not be read — the stored value is left untouched; a backup copy is kept when possible.",
        },
      };
    }
    migrated = upgrade(migrated);
  }

  // Persist the migrated form best-effort; if the write is rejected the
  // in-memory result is still correct and the next load migrates again.
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  } catch {
    // no-op: migration succeeded as a read, storage stays as it was
  }

  return { tasks: migrated.tasks, failure: null };
}

/**
 * Persist every task as the current envelope in one atomic write.
 * @returns {{ ok: boolean, error: null | { type: string, message: string } }}
 *   error.type: "quota" | "unavailable" | "invalid-tasks"
 */
export function saveTasks(tasks, storage) {
  if (!Array.isArray(tasks)) {
    return {
      ok: false,
      error: { type: "invalid-tasks", message: "Refusing to store a non-list value." },
    };
  }

  // Programmer errors (cyclic/BigInt payloads) surface loudly here;
  // storage failures are classified inside the try.
  const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, tasks });

  try {
    storage = storage ?? defaultStorage();
    storage.setItem(STORAGE_KEY, payload);
    return { ok: true, error: null };
  } catch (cause) {
    const quota =
      (cause && cause.name === "QuotaExceededError") || (cause && cause.code === 22);
    return {
      ok: false,
      error: quota
        ? {
            type: "quota",
            message:
              "Storage is full — the save was rejected and your stored list is unchanged; this change stays on screen only until storage is freed.",
          }
        : {
            type: "unavailable",
            message: "Browser storage is unavailable — this change will not persist.",
          },
    };
  }
}