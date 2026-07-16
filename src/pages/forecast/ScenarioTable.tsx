import { useState } from "react";
import type { PriceHistory } from "../../interfaces";
import type { ForecastOutlierRow } from "../../features/forecastSlice";
import { formatCurrency2 } from "../../utils";
import { calcFcstQty, estimateDaysActive, forecastUnits } from "./utils";

interface ScenarioRow {
  price: number;
  histQty: number | null;
  daysAtPrice: number;
  adFcst: number;
  revenue: number;
  markdown: number;
  isCustom: boolean;
}

interface ScenarioTableProps {
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

const ScenarioTable = ({
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
}: ScenarioTableProps) => {
  const [customInput, setCustomInput] = useState("");
  const [adDaysInput, setAdDaysInput] = useState(
    liveAdDays > 0 ? liveAdDays.toString() : "",
  );

  const buildRow = (price: number, isCustom: boolean): ScenarioRow => {
    const histEntry = priceHistory.find((ph) => parseFloat(ph.price) === price);
    const histQty = histEntry ? histEntry.qty : null;
    const daysAtPrice = histEntry
      ? histEntry.days_active
      : estimateDaysActive(priceHistory, price);

    const fcstQty = calcFcstQty(pricesWithQty, price);
    const adFcst = forecastUnits(
      price,
      overallUnits,
      fcstQty,
      selectedRow.daysActive,
      90,
      daysAtPrice,
      selectedRow.forecastWindow,
      pricesWithQty,
      liveAdDays > 0 ? liveAdDays : undefined,
    );
    const revenue = price * adFcst;
    const markdown = (regularRetail - price) * adFcst;

    return { price, histQty, daysAtPrice, adFcst, revenue, markdown, isCustom };
  };

  const historicalPrices = pricesWithQty.map((pq) => pq[0]);
  const allPrices = [
    ...historicalPrices
      .filter((p) => !customPrices.some((cp) => Math.abs(cp - p) < 0.001))
      .map((p) => buildRow(p, false)),
    ...customPrices.map((p) => buildRow(p, true)),
  ].sort((a, b) => a.price - b.price);

  const handleAdd = () => {
    const val = parseFloat(customInput);
    if (isNaN(val) || val <= 0) return;
    const alreadyExists = [...historicalPrices, ...customPrices].some(
      (p) => Math.abs(p - val) < 0.001,
    );
    if (!alreadyExists) {
      onAddCustomPrice(val);
    }
    setCustomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const handleSetAdDays = () => {
    const val = parseInt(adDaysInput);
    if (isNaN(val) || val <= 0) return;
    onSetAdDays(val);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="font-medium underline text-sm mb-1">Price Scenarios</div>
      <div className="overflow-y-auto flex-1 min-h-0">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-blue-500 text-custom-white sticky top-0">
              <th className="text-left px-1.5 py-1 font-medium">Price</th>
              <th className="text-right px-1.5 py-1 font-medium">Hist Qty</th>
              <th className="text-right px-1.5 py-1 font-medium">
                Fcst Units{" "}
                {Number(adDaysInput) > 0 ? `(${adDaysInput}d)` : "(7d)"}
              </th>
              <th className="text-right px-1.5 py-1 font-medium">Revenue</th>
              <th className="text-right px-1.5 py-1 font-medium">Markdown $</th>
              <th className="px-1.5 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {allPrices.map((row) => {
              const isActive = Math.abs(row.price - liveFcstPrice) < 0.001;
              return (
                <tr
                  key={row.price}
                  className={
                    isActive
                      ? "bg-blue-200"
                      : row.isCustom
                        ? "bg-custom-white border-b border-gray-100"
                        : "bg-blue-50 border-b border-blue-100"
                  }
                >
                  <td className="px-1.5 py-0.5 font-medium">
                    {formatCurrency2(row.price)}
                    {row.isCustom && (
                      <span className="ml-1 text-gray-400 text-[10px]">
                        custom
                      </span>
                    )}
                  </td>
                  <td className="px-1.5 py-0.5 text-right text-gray-600">
                    {row.histQty ?? "—"}
                  </td>
                  <td className="px-1.5 py-0.5 text-right font-medium">
                    {row.adFcst}
                  </td>
                  <td className="px-1.5 py-0.5 text-right">
                    {formatCurrency2(row.revenue)}
                  </td>
                  <td className="px-1.5 py-0.5 text-right">
                    {formatCurrency2(Math.max(0, row.markdown))}
                  </td>
                  <td className="px-1.5 py-0.5 text-center">
                    <button
                      className={`text-[11px] px-2 py-0.5 rounded ${
                        isActive
                          ? "bg-green-500 text-custom-white"
                          : "bg-blue-500 text-custom-white hover:bg-blue-600"
                      }`}
                      onClick={() => onApply(row.price)}
                    >
                      {isActive ? "Active" : "Apply"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 leading-snug gap-2 border-t">
        <div className="leading-tight">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
            Add price:
          </label>
          <div className="flex gap-2">
            <input
              className="basic-input focus:border bg-custom-white text-xs flex-1 py-1"
              placeholder="e.g. 4.49"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn-themeBlue text-xs px-3 py-1 whitespace-nowrap"
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </div>
        <div className="leading-tight">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
            Ad Days:
          </label>
          <div className="flex gap-2">
            <input
              className="basic-input focus:border bg-custom-white text-xs flex-1 py-1"
              placeholder="e.g. 7"
              value={adDaysInput}
              onChange={(e) => setAdDaysInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSetAdDays();
              }}
            />
            <button
              className="btn-themeBlue text-xs px-[15px] py-1 whitespace-nowrap"
              onClick={handleSetAdDays}
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioTable;
