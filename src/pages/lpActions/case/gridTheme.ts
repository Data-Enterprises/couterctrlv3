/**
 * The class strings the two case grids share.
 *
 * They sit side by side, so any drift between them is visible as a misaligned
 * row — which is exactly what happened when each carried its own copy. One
 * definition, imported twice, is the only way the two stay level.
 *
 * `min-h` rather than padding alone: a cell containing a badge is taller than
 * a cell containing text, because an arbitrary font size inherits the parent's
 * line height rather than setting its own.
 */
export const GRID_HEAD =
  "grid gap-2 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85";

export const GRID_ROW =
  "grid gap-2 px-3 py-1.5 min-h-[38px] items-center border-b border-gray-100";

export const GRID_NOTE =
  "px-3 py-2 border-b border-gray-100 text-[11.5px] text-content/85";

export const GRID_CELL = "text-[12px] text-content truncate";

export const GRID_NUM = "text-[12px] text-right tabular-nums text-content";
