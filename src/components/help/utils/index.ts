/** Kept in step with `duration-200` on the aside below. */
export const SLIDE_MS = 200;

/** Whether any of the texts contains the search, ignoring case; an empty search matches all. */
export const matches = (needle: string, ...hay: string[]) =>
  needle.trim() === "" ||
  hay.some((h) => h.toLowerCase().includes(needle.trim().toLowerCase()));
