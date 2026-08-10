import { useState } from "react";
import { formatCurrency2 } from "../../../utils";
import { buildScenarioRows } from "../scenarioRows";
import type { PriceHistory } from "../../../interfaces";
import type { ForecastOutlierRow } from "../../../features/forecastSlice";

/**
 * Price scenarios for the open item.
 *
 * Same figures as legacy's `ScenarioTable` — both call `buildScenarioRows` —
 * rendered on the CSS-grid convention the main grid uses, and carrying the same
 * column names it does (Ad fcst, Total) so a row means the same thing in both
 * places. The item's own price history isn't listed separately: Price and Hist
 * qty here are that history.
 */

const COLS = "1fr 60px 44px 60px 84px 84px 56px";

const HEAD =
  "grid gap-1.5 px-2 py-1.5 border-b border-[#1e2a4a]/15 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-shrink-0";

interface Props {
  pricesWithQty: number[][];
  priceHistory: PriceHistory[];
  regularRetail: number;
  selectedRow: ForecastOutlierRow;
  overallUnits: number;
  liveAdDays: number;
  liveFcstPrice: number;
  customPrices: number[];
  onApply: (price: number) => void;
  onAddCustomPrice: (price: number) => void;
  onSetAdDays: (days: number) => void;
}

const ForecastScenarios = ({
  pricesWithQty,
  priceHistory,
  regularRetail,
  selectedRow,
  overallUnits,
  liveAdDays,
  liveFcstPrice,
  customPrices,
  onApply,
  onAddCustomPrice,
  onSetAdDays,
}: Props) => {
  const [customInput, setCustomInput] = useState("");
  const [adDaysInput, setAdDaysInput] = useState(
    liveAdDays > 0 ? liveAdDays.toString() : "",
  );

  const rows = buildScenarioRows({
    pricesWithQty,
    priceHistory,
    regularRetail,
    selectedRow,
    overallUnits,
    liveAdDays,
    customPrices,
  });

  const handleAdd = () => {
    const val = parseFloat(customInput);
    if (isNaN(val) || val <= 0) return;
    const exists = [
      ...pricesWithQty.map((pq) => pq[0]),
      ...customPrices,
    ].some((p) => Math.abs(p - val) < 0.001);
    if (!exists) onAddCustomPrice(val);
    setCustomInput("");
  };

  const handleSetAdDays = () => {
    const val = parseInt(adDaysInput);
    if (isNaN(val) || val <= 0) return;
    onSetAdDays(val);
  };

  return (
    <div className="flex flex-col min-h-0 overflow-hidden border border-gray-200 rounded-lg">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-content/80">
          Price scenarios
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <input
            value={adDaysInput}
            onChange={(e) => setAdDaysInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetAdDays()}
            placeholder="Ad days"
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <button
            onClick={handleSetAdDays}
            className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 text-content hover:bg-gray-100 transition-colors"
          >
            Set
          </button>
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add price"
            className="text-[11px] rounded px-2 py-1 border border-gray-200 bg-custom-white w-20"
            style={{ outline: "none", boxShadow: "none" }}
          />
          <button
            onClick={handleAdd}
            className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 text-content hover:bg-gray-100 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className={HEAD} style={{ gridTemplateColumns: COLS }}>
        <span>Price</span>
        <span className="text-right">Hist qty</span>
        <span className="text-right">Days</span>
        <span className="text-right">Ad fcst</span>
        <span className="text-right">Total</span>
        <span className="text-right">Markdown</span>
        <span />
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0">
        {rows.map((row) => {
          const isActive = Math.abs(row.price - liveFcstPrice) < 0.001;
          return (
            <div
              key={row.price}
              className={`grid gap-1.5 items-center px-2 py-[7px] border-b border-[#1e2a4a]/15 last:border-b-0 ${
                isActive ? "bg-blue-50" : "even:bg-row_stripe hover:bg-gray-50"
              }`}
              style={{ gridTemplateColumns: COLS }}
            >
              <span
                className={`text-[12.5px] tabular-nums text-content ${
                  isActive ? "font-semibold" : "font-medium"
                }`}
              >
                {formatCurrency2(row.price)}
                {row.isCustom && (
                  <span className="ml-1 text-[9px] bg-gray-200 text-content rounded px-0.5 font-medium">
                    new
                  </span>
                )}
              </span>
              <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                {row.histQty ?? "—"}
              </span>
              {/* A typed price was never on the shelf, so it has no days at
                  price to report. The forecast still needs one and uses
                  `estimateDaysActive`, but that's an assumption of ours — it
                  doesn't belong in a column of observed history. */}
              <span className="text-right text-[12px] font-medium tabular-nums text-content/85">
                {row.isCustom ? "—" : row.daysAtPrice}
              </span>
              <span className="text-right text-[12px] font-medium tabular-nums text-content">
                {row.adFcst.toLocaleString()}
              </span>
              <span className="text-right text-[13px] font-bold tabular-nums text-content">
                {formatCurrency2(row.revenue)}
              </span>
              <span className="text-right text-[12px] font-medium tabular-nums text-content">
                {formatCurrency2(Math.max(0, row.markdown))}
              </span>
              {isActive ? (
                <span className="text-right text-[11px] font-medium text-content/85">
                  applied
                </span>
              ) : (
                <button
                  onClick={() => onApply(row.price)}
                  className="text-right text-[11px] font-medium text-[#1e2a4a] hover:underline"
                >
                  apply
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ForecastScenarios;
