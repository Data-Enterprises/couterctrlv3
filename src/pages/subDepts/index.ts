import { sameWeekDayLastYear } from "../../utils";
import type { MarginTier, SubDeptGrade, GradingMetric } from "../../features/subMarginSlice";

export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

// Last-year date for a given "YYYY-MM-DD", holiday- and leap-year-aware
// (see sameWeekDayLastYear) — use this instead of setDates(date, 364).
export const getLYDate = (date: string): string => sameWeekDayLastYear(date).date;

export const getTier = (grade: SubDeptGrade, threshold: number, metric: GradingMetric): MarginTier => {
  const hasLY = grade.lySales > 0 || grade.lyMarginPct > 0;
  const vsLY = metric === "margin" ? grade.ptsDelta : grade.vsLYSalesPct;
  const vsLW = metric === "margin" ? grade.lwPtsDelta : grade.vsLWSalesPct;
  const delta = hasLY ? vsLY : vsLW;
  if (delta >= 0) return "healthy";
  if (delta < -threshold) return "critical";
  return "watch";
};

export const calculateCogs = (
  netCost: number,
  cost: number,
  caseSize: number,
  qty: number,
  weight: number,
) => {

  const baseCost = netCost > 0 ? netCost : cost;
  const baseLine = weight > 0 ? weight : qty;

  if (caseSize === 0) return 0;

  const unitCost = (baseCost / caseSize).toString();
  return parseFloat(unitCost) * baseLine;

  // When using calculated cost, cost fees, qty
  // if (qty === 0) return 0;

  // if (costFees) {
  //   const feePct = costFees / 100;
  //   const feeAmount = parseFloat((calculatedCost * feePct).toString());
  //   return (calculatedCost + feeAmount) * qty;
  // }

  // // no cost fees
  // return calculatedCost * qty;
};
