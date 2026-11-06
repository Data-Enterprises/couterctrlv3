import type { TicketTech } from "@/api/tickets";

/** What the sheet is doing. Three states rather than booleans, because they
 *  are mutually exclusive and a pair of flags lets them overlap. */
type Mode =
  | { kind: "list" }
  | { kind: "adding" }
  | { kind: "standing-down"; tech: TicketTech };

export type { Mode };
