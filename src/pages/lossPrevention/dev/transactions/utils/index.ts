// Utils
import { formatCurrency2 } from "../../../../../utils";

// Interfaces
import type { CSSProperties } from "react";
import type { CashierDetails, ThresholdValue } from "../../../../../interfaces";
import type { CashierGrade, CashierSeverity } from "../../interfaces";

// Cashier list uses a plain dot (list-level), matching Sales' store/sub-dept
// rows — the icon+badge treatment is reserved for item-level drill-down.
export const CASHIER_DOT_CLASS: Record<CashierSeverity, string> = {
  critical: "bg-red-500",
  watch: "bg-amber-400",
  ok: "bg-emerald-500",
  ungraded: "bg-gray-300",
};

export const fmtDate = (iso: string) => {
  const d = iso.split("T")[0].split("-");
  return `${d[1]}/${d[2]}/${d[0]}`;
};

export const fmtThreshold = (t: ThresholdValue | null, prefix = ""): string => {
  if (!t) return "";
  const sym = t.op === "gt" ? ">" : t.op === "lt" ? "<" : "=";
  return `${sym} ${prefix}${t.amount}`;
};

/** The column-filter boxes' input look. */
export const colInputStyle: CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgb(var(--color-brand-navy) / 0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgb(var(--color-brand-navy) / 0.03)",
};

/** The store's four figures against its baseline (avg per week over the prior
 *  two weeks). */
export const buildKpiMetrics = (
  detail: CashierDetails | null,
  baselineDetail: CashierDetails | null,
  isNoDollar: boolean,
) => {
  const bTrans = baselineDetail ? baselineDetail.transaction_count / 2 : null;
  const bItems = baselineDetail ? baselineDetail.total_items / 2 : null;
  const bAmount = baselineDetail ? baselineDetail.amount / 2 : null;
  const bAvg = baselineDetail ? baselineDetail.average_dollars : null;

  const kpiMetrics = detail
    ? [
        {
          label: "Transactions",
          value: String(detail.transaction_count),
          baselineStr: bTrans !== null ? String(Math.round(bTrans)) : undefined,
          current: detail.transaction_count,
          trendVal: bTrans ?? 0,
          useAbs: false,
        },
        {
          label: "Qty",
          value: String(detail.total_items),
          baselineStr: bItems !== null ? String(Math.round(bItems)) : undefined,
          current: detail.total_items,
          trendVal: bItems ?? 0,
          useAbs: false,
        },
        {
          label: "Total",
          value: formatCurrency2(detail.amount),
          baselineStr: bAmount !== null ? formatCurrency2(bAmount) : undefined,
          current: detail.amount,
          trendVal: bAmount ?? 0,
          useAbs: !isNoDollar,
        },
        {
          label: "Avg ticket",
          value: formatCurrency2(detail.average_dollars),
          baselineStr: bAvg !== null ? formatCurrency2(bAvg) : undefined,
          current: detail.average_dollars,
          trendVal: bAvg ?? 0,
          useAbs: !isNoDollar,
        },
      ]
    : null;
  return kpiMetrics;
};

/** The open cashier's figures against their peers' average. Total and Avg
 *  ticket only where the sale type carries dollars. */
export const buildScoreMetrics = (selectedGrade: CashierGrade | null, isNoDollar: boolean) => {
  const scoreMetrics = selectedGrade
    ? [
        {
          label: "Transactions",
          value: String(selectedGrade.trans.value),
          baselineStr:
            selectedGrade.trans.avg > 0
              ? String(Math.round(selectedGrade.trans.avg))
              : undefined,
          pct: selectedGrade.trans.pct,
          avg: selectedGrade.trans.avg,
        },
        {
          label: "Qty",
          value: String(selectedGrade.qty.value),
          baselineStr:
            selectedGrade.qty.avg > 0
              ? String(Math.round(selectedGrade.qty.avg))
              : undefined,
          pct: selectedGrade.qty.pct,
          avg: selectedGrade.qty.avg,
        },
        ...(!isNoDollar
          ? [
              {
                label: "Total",
                value: formatCurrency2(selectedGrade.sales.value),
                baselineStr:
                  selectedGrade.sales.avg !== 0
                    ? formatCurrency2(selectedGrade.sales.avg)
                    : undefined,
                pct: selectedGrade.sales.pct,
                avg: selectedGrade.sales.avg,
              },
              {
                label: "Avg ticket",
                value: formatCurrency2(selectedGrade.avgTicket.value),
                baselineStr:
                  selectedGrade.avgTicket.avg !== 0
                    ? formatCurrency2(selectedGrade.avgTicket.avg)
                    : undefined,
                pct: selectedGrade.avgTicket.pct,
                avg: selectedGrade.avgTicket.avg,
              },
            ]
          : []),
      ]
    : null;
  return scoreMetrics;
};
