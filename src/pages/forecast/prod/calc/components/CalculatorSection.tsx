// Utils
import { formatCurrency2 } from "../../../../../utils";
import { FIELD_LABEL, SECTION, SECTION_HEAD, onlyNumeric } from "../utils";

interface CalculatorSectionProps {
  priceText: string;
  setPriceText: (v: string) => void;
  costText: string;
  setCostText: (v: string) => void;
  /** Commits what is typed, so typing doesn't churn the figures. */
  onCalculate: () => void;
  /** The committed price, and what it forecasts over 7 days. */
  activePrice: number;
  qty: number;
  revenue: number;
  profit: number;
}

/** The what-if calculator: a price and a cost, Calculate, and the quantity,
 *  revenue and profit they forecast. It writes nothing back to the grid. */
const CalculatorSection = ({
  priceText,
  setPriceText,
  costText,
  setCostText,
  onCalculate,
  activePrice,
  qty,
  revenue,
  profit,
}: CalculatorSectionProps) => (
  <div className={SECTION}>
    <div className={SECTION_HEAD}>Calculator</div>
    <div className="p-3 flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={FIELD_LABEL}>Price</label>
          <input
            className="basic-input bg-custom-white w-full py-1.5 px-2 text-[13px] mt-1"
            style={{ outline: "none", boxShadow: "none" }}
            data-testid="calc-modal-price-input"
            value={priceText}
            onChange={(e) => onlyNumeric(e.target.value, setPriceText)}
          />
        </div>
        <div>
          <label className={FIELD_LABEL}>Cost</label>
          <input
            className="basic-input bg-custom-white w-full py-1.5 px-2 text-[13px] mt-1"
            style={{ outline: "none", boxShadow: "none" }}
            data-testid="calc-modal-cost-input"
            value={costText}
            onChange={(e) => onlyNumeric(e.target.value, setCostText)}
          />
        </div>
      </div>

      <button
        data-testid="calc-modal-calculate-button"
        onClick={onCalculate}
        className="w-full py-1.5 text-[12px] font-semibold text-custom-white rounded-lg bg-brand_navy hover:bg-brand_navy_hover transition-colors"
      >
        Calculate
      </button>

      {/* The calculator's answer stays in its own section: it writes
          nothing back. */}
      <div className="border-t border-line_hair pt-2 flex flex-col gap-1">
        <div className="text-[10.5px] font-medium text-content/95">
          At {formatCurrency2(activePrice)} over 7 days
        </div>
        {(
          [
            ["Quantity", String(qty), "calc-modal-qty"],
            ["Revenue", formatCurrency2(revenue), "calc-modal-revenue"],
            ["Profit", formatCurrency2(profit), "calc-modal-profit"],
          ] as const
        ).map(([label, value, testid]) => (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-[12px] font-medium text-content/95">
              {label}
            </span>
            <span
              data-testid={testid}
              className="text-[13px] font-bold tabular-nums text-content"
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CalculatorSection;
