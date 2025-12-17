import { useEffect, useState } from "react";
import {
  fitLinearDemand,
  predictCtrlQty,
  estimateCtrlRevenue,
  estimateCtrlProfit,
} from "./utils";
import { formatCurrency2 } from "../../utils";
import type { ForecastQtyData } from "../../interfaces";
import { useAppSelector } from "../../hooks";

interface Result {
  price: number;
  qty: number;
  revenue: number;
  profit: number;
}

// Think of this as profit = (how much made per unit) * (how many sold at that price)
const CounterCtrlProfit = () => {
  const state = useAppSelector((state) => state.forecast);
  const [costText, setCostText] = useState<string>(""); // for the input
  const [newCost, setNewCost] = useState<string>(""); // for the calc
  const [prices, setPrices] = useState<number[]>([]);
  const [best, setBest] = useState<Result | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [item, setItem] = useState<ForecastQtyData<any> | null>(null);
  const [params, setParams] = useState<{ slope: number; intercept: number }>({
    slope: 0,
    intercept: 0,
  });

  useEffect(() => {
    if (state.selectedUpc && state.qty.length > 0) {
      const item = state.qty.find((i) => i.upc === state.selectedUpc);

      if (item) {
        const itemPrices = Object.keys(item?.metrics.prices).map(Number);
        const itemQuantities = Object.values(item?.metrics.prices).map(Number);
        const itemParams = fitLinearDemand(itemPrices, itemQuantities);

        setNewCost("12.90");
        setItem(item);
        setPrices(itemPrices);
        setParams(itemParams);
      }
    }
  }, [state.selectedUpc]);

  useEffect(() => {
    if (item) {
      const explorePrices = (
        params: { slope: number; intercept: number },
        unitCost: number
      ) => {
        // Using the +-50% rule of historical prices to set candidate price range
        const candidatePrices = [];
        const minPrice = 0.5 * Math.min(...prices);
        const maxPrice = 1.5 * Math.max(...prices); 
        for (let p = minPrice; p <= maxPrice; p += 0.25) {
          candidatePrices.push(p);
        }

        // Quantify the results at each price point
        const results = candidatePrices.map((p) => {
          const qty = predictCtrlQty(p, params, item?.metrics);
          const revenue = estimateCtrlRevenue(p, params, item?.metrics);
          const profit = estimateCtrlProfit(p, params, unitCost, item?.metrics);
          return { price: p, qty, revenue, profit };
        });

        // Find the price with maximum profit
        const best = results.reduce((best, cur) =>
          cur.profit > best.profit ? cur : best
        );

        return { best, results };
      };
      const cost = parseFloat(newCost);
      const { best, results } = explorePrices(params, cost);
      setBest(best);
      setResults(results);
    }
  }, [newCost, params, item]);

  const handleCalc = () => {
    setNewCost(costText);
  };

  const handlePriceTextChange = (e: string) => {
    if (!isNaN(Number(e))) {
      setCostText(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === "Enter") {
      handleCalc();
    }
  };

  return (
    <>
      {item ? (
        <div className="bg-custom-white rounded-lg shadow-lg p-2">
          <div className="font-medium border-b border-content/70">
            Profit Optimization (CounterCtrl)
          </div>
          <div className="grid grid-cols-2 my-2 gap-4">
            <div className="-mt-2">
              <label className="font-medium pl-0.5 text-xs">Unit Cost:</label>
              <input
                className="basic-input focus:border bg-custom-white"
                type="text"
                value={costText}
                onChange={(e) => handlePriceTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="btn-themeBlue w-full py-1.5 mt-2"
                onClick={handleCalc}
              >
                Calculate
              </button>
            </div>
            {best && (
              <div className="px-3 py-4 bg-emerald-100 border-2 border-emerald-500 rounded-lg">
                <div className="font-medium">
                  Best Price: {formatCurrency2(best.price)}
                </div>
                <div className="">
                  <span className="font-medium text-emerald-700">
                    Max Profit: {formatCurrency2(best.profit)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Qty: {best.qty.toFixed(0)} | Rev:{" "}
                  {formatCurrency2(best.revenue)}
                </div>
              </div>
            )}
          </div>

          {/* Top 5 price points */}
          <div className="mb-2">
            <div className="font-medium underline">Top 5 Prices by Profit:</div>
            {results
              .sort((a, b) => b.profit - a.profit)
              .slice(0, 5)
              .map((r) => (
                <div key={r.price} className="text-sm">
                  {formatCurrency2(r.price)} → Qty: {r.qty.toLocaleString()} |
                  Rev:
                  {formatCurrency2(r.revenue)} |{" "}
                  <span className="font-medium">
                    Profit: {formatCurrency2(r.profit)}
                  </span>
                </div>
              ))}
          </div>

          {/* Quick price range summary */}
          <div className="text-xs text-gray-500">
            Tested {results.length} prices from{" "}
            {formatCurrency2(Math.min(...results.map((r) => r.price)))} to{" "}
            {formatCurrency2(Math.max(...results.map((r) => r.price)))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CounterCtrlProfit;
