// Utils
import { formatCurrency2, formatBigNumber } from "../../../../../utils";
import { pctVs } from "../utils";

// Interfaces
import type { totalsFor } from "../../utils";

// Components
import Kpi from "./Kpi";

interface DetailKpiStripProps {
  totals: ReturnType<typeof totalsFor>;
  baselineTotals: {
    amount: number;
    lines: number;
    transactions: number;
    avgAmount: number;
  } | null;
}

/** The store's four figures for the week or day, each against its baseline
 *  (totals halved to a comparable week; the average is already per coupon). */
const DetailKpiStrip = ({ totals, baselineTotals }: DetailKpiStripProps) => {
  return (
    <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
      <Kpi
        label="Amount"
        value={formatCurrency2(totals.amount)}
        baselineValue={
          baselineTotals ? formatCurrency2(baselineTotals.amount) : undefined
        }
        trendPct={pctVs(totals.amount, baselineTotals?.amount)}
      />
      <Kpi
        label="Coupons"
        value={formatBigNumber(totals.lines, 0)}
        baselineValue={
          baselineTotals ? formatBigNumber(baselineTotals.lines, 0) : undefined
        }
        trendPct={pctVs(totals.lines, baselineTotals?.lines)}
      />
      <Kpi
        label="Avg coupon"
        value={formatCurrency2(totals.avgAmount)}
        baselineValue={
          baselineTotals ? formatCurrency2(baselineTotals.avgAmount) : undefined
        }
        trendPct={pctVs(totals.avgAmount, baselineTotals?.avgAmount)}
      />
      <Kpi
        label="Trans"
        value={formatBigNumber(totals.transactions, 0)}
        baselineValue={
          baselineTotals
            ? formatBigNumber(baselineTotals.transactions, 0)
            : undefined
        }
        trendPct={pctVs(totals.transactions, baselineTotals?.transactions)}
      />
    </div>
  );
};

export default DetailKpiStrip;
