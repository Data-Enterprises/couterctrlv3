// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";

// Redux
import {
  setSelectedUpc,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setItemNotes,
} from "../../../../features/dev/devForecastDevSlice";

// Utils
import { formatCurrency2 } from "../../../../utils";
import { fitLinearDemand, predictQty } from "../../../../utils/forecastCalc";
import { forecastUnits } from "../../../../utils/priceSimCalc";
import { FIELD_LABEL, SECTION, SECTION_HEAD } from "./utils";

// Components
import { XMarkIcon } from "@heroicons/react/24/outline";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ForecastScenarios from "./components/ForecastScenarios";

/**
 * The per-item popup, opened by double-clicking a row. Scenarios (which price
 * to run; they write back to the grid) on the left, the calculator (a what-if;
 * writes nothing) on the right. Price and Hist qty in the scenarios are the
 * price history. The maths is legacy's, unchanged (`fitLinearDemand`,
 * `predictQty`, `forecastUnits`, shared `buildScenarioRows`).
 */
const ForecastCalcModal = () => {
  const dispatch = useAppDispatch();
  const { selectedUpc, forecastResults, rowData } = useAppSelector(
    (s) => s.dev.forecastDev,
  );

  const row = useMemo(
    () => rowData.find((r) => r.upc === selectedUpc) ?? null,
    [rowData, selectedUpc],
  );
  const result = useMemo(
    () => forecastResults.find((r) => r.upc === selectedUpc) ?? null,
    [forecastResults, selectedUpc],
  );

  /** The price/cost the calculator is reporting on — committed by its button,
   *  so typing doesn't churn the figures. */
  const [priceText, setPriceText] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [costText, setCostText] = useState("0.00");
  const [newCost, setNewCost] = useState("0.00");
  const [customPrices, setCustomPrices] = useState<number[]>([]);
  const [noteText, setNoteText] = useState("");
  const lastUpcRef = useRef<string | null>(null);

  const history = result?.price_history ?? [];
  const prices = useMemo(
    () => history.map((p) => [parseFloat(p.price), p.qty]),
    [history],
  );
  const params = useMemo(() => fitLinearDemand(prices), [prices]);
  const overallUnits = result?.qty ?? 0;

  useEffect(() => {
    if (!row) return;
    if (lastUpcRef.current !== row.upc) {
      // Seed as a custom price only when the forecast price isn't already a
      // real history entry — AD-list items have theirs injected into history.
      const inHistory = history.some(
        (p) => parseFloat(p.price) === row.fcstPrice,
      );
      setCustomPrices(inHistory ? [] : [row.fcstPrice]);
      lastUpcRef.current = row.upc;
    }
    setPriceText(row.fcstPrice.toString());
    setNewPrice(row.fcstPrice.toString());
    setCostText("0.00");
    setNewCost("0.00");
    setNoteText(row.notes ?? "");
  }, [row?.upc]);

  if (!row || !result) return null;

  const handleClose = () => dispatch(setSelectedUpc(""));

  /**
   * The row's own price stands in until the state is seeded, and whenever the
   * field is empty. Load-bearing: a NaN price makes `predictQty`'s lookup miss
   * and throw, and the component renders once before its effect runs.
   */
  const priced = parseFloat(newPrice);
  const activePrice = isFinite(priced) ? priced : row.fcstPrice;
  const costed = parseFloat(newCost);
  const activeCost = isFinite(costed) ? costed : 0;

  const qty = forecastUnits(
    activePrice,
    overallUnits,
    predictQty(activePrice, params, prices),
    row.daysActive,
    90,
    row.daysAtPrice,
    7,
    prices,
  );
  const revenue = activePrice * qty;
  const profit = revenue - activeCost * qty;

  const numeric = (v: string, set: (s: string) => void) => {
    if (/^\d*\.?\d*$/.test(v)) set(v);
  };

  const ad = row.adListData;

  return (
    <ResizableModalShell
      onClose={handleClose}
      storageKey="forecast-dev:calc"
      defaultWidth={1120}
      defaultHeight={720}
    >
      {/* Title bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 bg-brand_navy flex-shrink-0">
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
          {row.description}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center tabular-nums">
          {row.upc}
        </span>
        <button
          onClick={handleClose}
          className="justify-self-end w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/60 hover:text-custom-white hover:border-custom-white/40 transition-colors"
          title="Close"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Item facts the fit stands on: Reg retail is the baseline every
          Markdown figure is measured against; price points is how many prices
          the demand curve is fitted through. */}
      <div className="grid grid-cols-4 divide-x divide-brand_navy/15 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        {(
          [
            ["Reg retail", formatCurrency2(result.regular_retail_price)],
            ["90-day qty", overallUnits.toLocaleString()],
            ["Days active", `${row.daysActive} / 90`],
            ["Price points", String(history.length)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              {label}
            </div>
            <div className="text-[13px] font-bold text-content truncate tabular-nums">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.7fr_1fr] gap-3 p-3 flex-1 min-h-0">
        {/* ── Left: the scenarios, and nothing else ── */}
        <ForecastScenarios
          pricesWithQty={prices}
          priceHistory={history}
          regularRetail={result.regular_retail_price}
          selectedRow={row}
          overallUnits={overallUnits}
          liveAdDays={row.adDays}
          liveFcstPrice={row.fcstPrice}
          customPrices={customPrices}
          onApply={(price) =>
            dispatch(setNewRowPriceValue({ upc: row.upc, newPrice: price }))
          }
          onAddCustomPrice={(p) => setCustomPrices((prev) => [...prev, p])}
          onSetAdDays={(days) =>
            dispatch(setNewRowAdDaysValue({ upc: row.upc, newAdDays: days }))
          }
        />

        {/* ── Right: sectioned ── */}
        <div className="flex flex-col gap-3 min-w-0 overflow-y-auto thin-scrollbar">
          {/* Calculator */}
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
                    onChange={(e) => numeric(e.target.value, setPriceText)}
                  />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Cost</label>
                  <input
                    className="basic-input bg-custom-white w-full py-1.5 px-2 text-[13px] mt-1"
                    style={{ outline: "none", boxShadow: "none" }}
                    data-testid="calc-modal-cost-input"
                    value={costText}
                    onChange={(e) => numeric(e.target.value, setCostText)}
                  />
                </div>
              </div>

              <button
                data-testid="calc-modal-calculate-button"
                onClick={() => {
                  setNewPrice(priceText);
                  setNewCost(costText);
                }}
                className="w-full py-1.5 text-[12px] font-semibold text-custom-white rounded-lg bg-brand_navy hover:bg-brand_navy_hover transition-colors"
              >
                Calculate
              </button>

              {/* The calculator's answer stays in its own section: it writes
                  nothing back. */}
              <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
                <div className="text-[10.5px] font-medium text-content/85">
                  At {formatCurrency2(activePrice)} over 7 days
                </div>
                {(
                  [
                    ["Quantity", String(qty), "calc-modal-qty"],
                    ["Revenue", formatCurrency2(revenue), "calc-modal-revenue"],
                    ["Profit", formatCurrency2(profit), "calc-modal-profit"],
                  ] as const
                ).map(([label, value, testid]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-[12px] font-medium text-content/85">
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

          {/* Note */}
          <div className={SECTION}>
            <div className="flex items-stretch bg-gray-50 border-b border-gray-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-content/80 flex-1">
                Note
              </div>
              {noteText !== (row.notes ?? "") && (
                <button
                  onClick={() =>
                    dispatch(setItemNotes({ upc: row.upc, notes: noteText }))
                  }
                  className="px-3 text-[11px] font-medium text-brand_navy hover:underline"
                >
                  Save
                </button>
              )}
            </div>
            <div className="p-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Labor day end cap"
                rows={2}
                className="basic-input bg-custom-white w-full py-1.5 px-2 text-[12px] resize-none"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>
          </div>

          {/* AD list */}
          {ad && (
            <div className={SECTION}>
              <div className={SECTION_HEAD}>Ad list</div>
              <div className="p-3 flex flex-col gap-1.5 text-[12px]">
                {ad.featureDescription && (
                  <div className="font-medium text-content">
                    {ad.featureDescription}
                    {ad.pageName && (
                      <span className="ml-1.5 text-content/85 font-normal">
                        ({ad.pageName})
                      </span>
                    )}
                  </div>
                )}
                {(
                  [
                    [
                      "Ad retail",
                      ad.adCount > 1
                        ? `${ad.adCount}/${formatCurrency2(ad.adRetail)} (${formatCurrency2(ad.unitAdRetail)}/ea)`
                        : formatCurrency2(ad.adRetail),
                    ],
                    ["Reg retail", formatCurrency2(ad.regularRetail)],
                    ["Net unit cost", formatCurrency2(ad.netUnitCost)],
                    ["Pack / size", `${ad.pack} / ${ad.size}`],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between"
                  >
                    <span className="font-medium text-content/85">{label}</span>
                    <span className="font-medium tabular-nums text-content">
                      {value}
                    </span>
                  </div>
                ))}
                {ad.featureNotes && (
                  <div className="border-t border-gray-100 pt-1.5 text-[11px] font-medium text-content/85">
                    {ad.featureNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ResizableModalShell>
  );
};

export default ForecastCalcModal;
