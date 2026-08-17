import type { SubDept } from "../../../../interfaces";
import type { SubDeptGrade } from "../../../../features/subMarginSlice";
import {
  buildItemRows,
  getItemSeverity,
  type ItemGradingMetric,
  type ItemMarginRow,
} from "../../../../utils/itemMargins";

/**
 * Which graded items a department contributes, and in what order.
 *
 * Extracted from the export modal because the "view critical report" button
 * needs exactly the same selection. Two implementations would eventually
 * disagree about which items are critical, and the export and the report would
 * quietly stop matching — with nothing on screen to say which one was right.
 */

export type ItemSev = "critical" | "watch" | "healthy";

/** One graded item, with the department it came from. The full export and the
 *  UPC-only export share this so the two can never disagree about which items
 *  are in scope — the second is the first with the columns taken away. */
export interface GradedItem {
  dept: string;
  row: ItemMarginRow;
  sev: ItemSev;
}

export const collectGradedItems = (
  subDepts: SubDept[],
  grades: Record<number, SubDeptGrade>,
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<ItemSev>,
): GradedItem[] => {
  const sevRank: Record<ItemSev, number> = {
    critical: 0,
    watch: 1,
    healthy: 2,
  };
  const out: GradedItem[] = [];

  // Department order is the left panel's, so the file reads down the page.
  for (const sd of subDepts) {
    const grade = grades[sd.id];
    if (!grade) continue;
    const items = buildItemRows(
      grade.tyWeekOneMargins,
      grade.lwWeekOneMargins,
      grade.lyWeekOneMargins,
    );
    const kept: GradedItem[] = [];
    for (const row of items) {
      const sev = getItemSeverity(row, threshold, gradingMetric);
      if (sev === "ungraded" || !sevs.has(sev)) continue;
      kept.push({ dept: sd.desc, row, sev });
    }
    // Worst first inside a department, then biggest sellers — the order someone
    // works a list in.
    kept.sort(
      (a, b) =>
        sevRank[a.sev] - sevRank[b.sev] || b.row.netSales - a.row.netSales,
    );
    out.push(...kept);
  }
  return out;
};
