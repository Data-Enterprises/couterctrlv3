// Interfaces
import type { ItemSeverity } from "../../../../../../utils/itemMargins";

export type SevFilter = "all" | ItemSeverity;

/** A TY / LW / LY column-header sort, or null for the View preset's order. */
export type ColSort = { col: "ty" | "lw" | "ly"; dir: "desc" | "asc" } | null;

/** One metric row in the item report: the figure, and both comparisons. */
export interface ReportRow {
  key: "margin" | "contribution" | "sales" | "qty";
  label: string;
  ty: string;
  lw: number | null;
  ly: number | null;
  lwDisplay: string | null;
  lyDisplay: string | null;
  isPts: boolean;
  lwPartial: boolean;
  lyPartial: boolean;
}
