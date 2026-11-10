/** The KPI strip's figures for the rows on screen. */
export interface MarkdownTotals {
  lines: number;
  /** Different UPCs. */
  items: number;
  /** Markdown per unit times the units, added up. */
  dollars: number;
  /** null when no line has both prices. */
  avgPct: number | null;
  /** The markdown dollars on Waste lines. */
  waste: number;
}
