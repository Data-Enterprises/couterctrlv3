// Interfaces
import type { buildScoreMetrics } from "../utils";
import type { CashierGrade } from "../../interfaces";

// Components
import StripCell from "./StripCell";
import AvgBadge from "./AvgBadge";

interface CashierScoreStripProps {
  selectedGrade: CashierGrade;
  scoreMetrics: NonNullable<ReturnType<typeof buildScoreMetrics>>;
  isNoDollar: boolean;
}

/** The open cashier's breakdown against their peers. */
const CashierScoreStrip = ({ selectedGrade, scoreMetrics, isNoDollar }: CashierScoreStripProps) => {
  return (
    <>
        <div className="flex-shrink-0 px-3.5 py-1.5 border-b border-line_hair bg-fill_muted">
          <div className="text-[12px] font-semibold text-content">
            {selectedGrade.cashier_name}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wide text-content/95">
            Cashier breakdown
          </div>
        </div>
        <div
          className={`flex-shrink-0 grid divide-x divide-line_hair border-b border-line_hair bg-fill_soft ${isNoDollar ? "grid-cols-2" : "grid-cols-4"}`}
        >
          {scoreMetrics.map((m) => (
            <StripCell
              key={m.label}
              label={m.label}
              value={m.value}
              baselineValue={m.baselineStr}
              badge={<AvgBadge pct={m.pct} avg={m.avg} textSize="text-[10px]" />}
              className="py-2.5 text-center"
              valueClassName="text-[13px] font-bold text-content"
            />
          ))}
        </div>
    </>
  );
};

export default CashierScoreStrip;
