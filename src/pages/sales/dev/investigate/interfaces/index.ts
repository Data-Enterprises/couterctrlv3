import type { ReactNode } from "react";

export type Col =
  | "mine"
  | "theirs"
  | "gap"
  | "mineLw"
  | "theirsLw"
  | "mineLy"
  | "theirsLy"
  | "mineUnits"
  | "theirsUnits"
  | "mineCost"
  | "theirsCost"
  | "costPenalty"
  | "marginDiff"
  | "price"
  | "sellThrough"
  | "ordered"
  | "received";

export type FilterKind = "item" | "upc" | "vendor" | "cause";

export interface Slide {
  label: string;
  /** Printed in the tab. A zero is worth saying — an empty deliveries list
   *  is the finding, not a missing section. */
  count?: number;
  body: ReactNode;
}

/**
 * One order or invoice, and the department's lines on it.
 *
 * The lines are the ones this department owns: the orders wave is filtered
 * to the sub-department before it is ever stored, so "89 lines" is 89 Meat
 * lines and not the size of the order. The heading says so, because a buyer
 * reading it will otherwise take it for the whole document.
 */
export interface DocLine {
  code: string;
  description: string;
  units: number;
  cost: number;
}

/** The four steps along the top of the investigation. */
export type InvestigationTab = "holds" | "items" | "supply" | "act";
