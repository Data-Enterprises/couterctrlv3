/** The KPI strip's figures for the rows on screen. */
export interface MarkdownTotals {
  /** Different UPCs. */
  items: number;
  /** Markdown per unit times the units, added up. */
  dollars: number;
  /** null when no line has both prices. */
  avgPct: number | null;
  /** The Retail column added up. */
  retail: number;
  /** Every store in the rows, by name, A to Z. */
  stores: string[];
}
