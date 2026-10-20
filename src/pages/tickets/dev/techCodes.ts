import type { TicketTech } from "../../../api/tickets";

/**
 * The next tech code, worked out from the codes already on the desk.
 *
 * The modal holds every tech — active and stood down — before it can offer to
 * add one, so the next number is knowable here and the field can carry it
 * instead of the words "the next one". A stood-down tech keeps its code, so
 * they are counted too: skipping them is how two rows end up on 7.
 *
 * Only purely numeric codes are read. A desk that letters its codes has a
 * scheme this cannot guess at, and guessing would put a wrong number in a
 * field somebody is about to accept — so it returns null and the field goes
 * back to saying nothing.
 *
 * The width comes from the widest code in use, so a desk on 01..09 gets 10
 * and a desk on 1..9 gets 10 as well.
 */
export const nextTechCode = (techs: TicketTech[]): string | null => {
  const numeric = techs
    .map((t) => t.tech_code)
    .filter((c): c is string => typeof c === "string" && /^\d+$/.test(c.trim()))
    .map((c) => c.trim());

  if (numeric.length === 0) return null;

  const highest = numeric.reduce((n, c) => Math.max(n, Number(c)), 0);
  const width = numeric.reduce((w, c) => Math.max(w, c.length), 0);
  return String(highest + 1).padStart(width, "0");
};
