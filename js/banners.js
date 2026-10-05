/**
 * Session banners (plan §T6): the visible half of the failure paths the T2
 * store reports and the T4/T5 diagnostics warn about. A banner is keyed —
 * showing the same failure twice never stacks — and every message lands via
 * `textContent` (messages can embed task titles, which are data).
 *
 * Tones: "error" (red — data was rejected or cannot be trusted) and "warn"
 * (amber — a view-level problem; the data itself is intact). Dismissable
 * banners return only when `reshow` is set (e.g. a save that fails again
 * must speak up); by default a dismissal is final for the session.
 */

export function createBanners(doc) {
  const slot = doc.createElement("div");
  slot.className = "banners";

  /** key -> { banner, body, message } — currently mounted banners. */
  const live = new Map();
  /** keys the user dismissed and that do not re-show (no `reshow`). */
  const dismissed = new Set();

  function show(key, message, { tone = "error", dismissable = true, reshow = false } = {}) {
    const existing = live.get(key);
    if (existing) {
      if (existing.message === message) return; // same failure: never stack
      existing.message = message;
      existing.body.textContent = message;
      return;
    }
    if (dismissed.has(key) && !reshow) return;

    const banner = doc.createElement("div");
    banner.className = `banner banner--${tone}`;
    banner.setAttribute("role", "alert");

    const body = doc.createElement("p");
    body.className = "banner__text";
    body.textContent = message;
    banner.appendChild(body);

    if (dismissable) {
      const close = doc.createElement("button");
      close.type = "button";
      close.className = "btn btn--ghost banner__close";
      close.textContent = "Dismiss";
      close.setAttribute("aria-label", "Dismiss message");
      close.addEventListener("click", () => {
        live.delete(key);
        dismissed.add(key);
        banner.remove();
      });
      banner.appendChild(close);
    }

    slot.appendChild(banner);
    live.set(key, { banner, body, message });
  }

  function dismiss(key) {
    const existing = live.get(key);
    if (!existing) return;
    live.delete(key);
    existing.banner.remove();
  }

  return { element: slot, show, dismiss };
}
