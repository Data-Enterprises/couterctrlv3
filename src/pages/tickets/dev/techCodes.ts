import type { TicketTech } from "../../../api/tickets";

/** How a tech code is written: TECH- and three digits, padded. */
export const TECH_CODE_PREFIX = "TECH-";

/**
 * The next tech code, worked out from the codes already on the desk.
 *
 * This mirrors `_next_tech_code` on the server, which is what actually writes
 * the row: strip the digits out of every existing code, take the highest, add
 * one, and write it as `TECH-` and three digits. Reading the digits out rather
 * than matching a format is what lets a desk that was numbered by hand — the
 * three live rows were typed, and read `1`, `2`, `7` — carry on from where it
 * got to instead of starting again at one.
 *
 * The modal holds every tech, active and stood down, before it can offer to
 * add one, so the number is knowable here and the field can show it instead of
 * the words "the next one". A stood-down tech keeps its code, so they are
 * counted too: skipping them is how two rows end up on 7.
 *
 * It is a **preview**, not the decision. The server generates the code at
 * insert, so if somebody else adds a tech between this being shown and the
 * press, theirs is the number that gets used. Showing the likely one is still
 * worth more than showing nothing, which is what the field used to do the
 * moment a code stopped being purely numeric.
 *
 * An empty desk gives `TECH-001`, the same as the server's `(highest or 0) + 1`.
 */
export const nextTechCode = (techs: TicketTech[]): string => {
  const highest = techs.reduce((max, t) => {
    const digits = (t.tech_code ?? "").replace(/\D/g, "");
    if (!digits) return max;
    const n = Number(digits);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  return formatTechCode(highest + 1);
};

/** A number as the desk writes it. */
export const formatTechCode = (n: number): string =>
  `${TECH_CODE_PREFIX}${String(n).padStart(3, "0")}`;
