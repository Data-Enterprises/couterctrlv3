// Interfaces
import type { TicketTech } from "../../../../../../api/tickets";

/** How a tech code is written: TECH- and three digits, padded. */
export const TECH_CODE_PREFIX = "TECH-";

/**
 * The next tech code, by the server's `_next_tech_code` rule: the highest
 * digits in any code (stood-down techs too) plus one, as `TECH-###`. A
 * preview only; the server assigns the real code at insert.
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
