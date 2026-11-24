// Hooks
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useForecastCtx } from "../hooks";

// Redux
import {
  setSelectedUpc,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setItemNotes,
} from "../../../../features/forecastDevSlice";

// Utils
import { fitLinearDemand, predictQty } from "../../../../utils/forecastCalc";
import { forecastUnits } from "../../../../utils/priceSimCalc";

// Components
import { XMarkIcon } from "@heroicons/react/24/outline";
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import ForecastScenarios from "./components/ForecastScenarios";
import ItemFacts from "./components/ItemFacts";
import CalculatorSection from "./components/CalculatorSection";
import NoteSection from "./components/NoteSection";
import AdListSection from "./components/AdListSection";

/**
 * The per-item popup, opened by double-clicking a row. Scenarios (which price
 * to run; they write back to the grid) on the left, the calculator (a what-if;
 * writes nothing) on the right. Price and Hist qty in the scenarios are the
 * price history. The maths is legacy's, unchanged (`fitLinearDemand`,
 * `predictQty`, `forecastUnits`, shared `buildScenarioRows`).
 */
const ForecastCalcModal = () => {
  const dispatch = useAppDispatch();
  const { selectedUpc, forecastResults, rowData } = useForecastCtx();

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
  const [priceText, setPriceText] = useState<string>("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [costText, setCostText] = useState<string>("0.00");
  const [newCost, setNewCost] = useState<string>("0.00");
  const [customPrices, setCustomPrices] = useState<number[]>([]);
  const [noteText, setNoteText] = useState<string>("");
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

  const ad = row.adListData;

  return (
    <ResizableModalShell
      onClose={handleClose}
      storageKey="forecast-dev:calc"
      defaultWidth={1120}
      defaultHeight={720}
    >
      {/* Title bar */}
      <div className="cc-phone-header gap-2 flex-shrink-0">
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start truncate">
          {row.description}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center tabular-nums">
          {row.upc}
        </span>
        <button
          onClick={handleClose}
          className="justify-self-end w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 cc-navy-link hover:border-custom-white/40"
          title="Close"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <ItemFacts
        regularRetail={result.regular_retail_price}
        overallUnits={overallUnits}
        daysActive={row.daysActive}
        pricePoints={history.length}
      />

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
          <CalculatorSection
            priceText={priceText}
            setPriceText={setPriceText}
            costText={costText}
            setCostText={setCostText}
            onCalculate={() => {
              setNewPrice(priceText);
              setNewCost(costText);
            }}
            activePrice={activePrice}
            qty={qty}
            revenue={revenue}
            profit={profit}
          />

          <NoteSection
            noteText={noteText}
            setNoteText={setNoteText}
            changed={noteText !== (row.notes ?? "")}
            onSave={() =>
              dispatch(setItemNotes({ upc: row.upc, notes: noteText }))
            }
          />

          {ad && <AdListSection ad={ad} />}
        </div>
      </div>
    </ResizableModalShell>
  );
};

export default ForecastCalcModal;
