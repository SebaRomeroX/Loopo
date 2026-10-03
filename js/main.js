/**
 * Entry module: mounts the dynamic region of the static shell. The task list,
 * the add/edit form and the due logic arrive with T3/T4 — until then the page
 * always shows the empty state.
 */
import { renderEmptyState } from "./empty-state.js";

document.getElementById("app").appendChild(renderEmptyState(document));
