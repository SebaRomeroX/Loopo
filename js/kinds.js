/**
 * Reminder kinds — the single registry every screen reads (the empty state
 * here, the create/edit form from T3 on). Data only, no DOM.
 */

export const KINDS = [
  { id: "loop", label: "Loop" },
  { id: "date", label: "Date" },
  { id: "counter", label: "Counter" },
];

export function kindLabel(id) {
  return KINDS.find((kind) => kind.id === id)?.label ?? id;
}
