// Interfaces
import type { TicketTech } from "@/api/tickets";

/** What the sheet is doing. Three states rather than booleans, because they
 *  are mutually exclusive and a pair of flags lets them overlap. */
export type Mode =
  | { kind: "list" }
  | { kind: "adding" }
  | { kind: "standing-down"; tech: TicketTech };

export interface TicketOrigin {
  /** The page's own name, as the nav calls it. */
  page: string | null;
  /** The nav section it sits under — Performance, Analytics, Data, Config. */
  area: string | null;
  /** The matching ticket category's name, or null where there is no honest
   *  match. Resolved to an id against the lookups at the point of use. */
  category: string | null;
  href: string;
}

export type DateShape = "range" | "single" | "week" | "none";

export type PickedStore = {
  storeid: number;
  store_number: string;
  store_name: string;
};
