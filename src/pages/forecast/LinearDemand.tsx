import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks";
import {
  predictCtrlQty,
  estimateCtrlRevenue,
  estimateCtrlProfit,
  fitLinearDemand,
} from "./utils";
import { formatCurrency2 } from "../../utils";
import type { ForecastQtyData } from "../../interfaces";

const LinearDemand = () => {
  const state = useAppSelector((state) => state.forecast);
  const [prices, setPrices] = useState<number[]>([]);
  const [quantities, setQuantities] = useState<number[]>([]);
  const [params, setParams] = useState<{ slope: number; intercept: number }>({
    slope: 0,
    intercept: 0,
  });
  const [priceText, setPriceText] = useState<string>("");
  const [newPrice, setNewPrice] = useState("");
  const [costText, setCostText] = useState<string>("");
  const [newCost, setNewCost] = useState("");
  const [item, setItem] = useState<ForecastQtyData<any> | null>(null);

  useEffect(() => {
    if (state.selectedUpc && state.qty.length > 0) {
      const item = state.qty.find((i) => i.upc === state.selectedUpc);

      if (item) {
        const itemPrices = Object.keys(item?.metrics.prices).map(Number);
        const itemQuantities = Object.values(item?.metrics.prices).map(Number);
        const itemParams = fitLinearDemand(itemPrices, itemQuantities);

        // set the variables now
        setPrices(itemPrices);
        setQuantities(itemQuantities);
        setParams(itemParams);
        setItem(item);
        setPriceText(itemPrices[itemPrices.length - 1].toString());
        setCostText("12.90");
        setNewPrice(itemPrices[itemPrices.length - 1].toString());
        setNewCost("12.90");
      }
    }
  }, [state.selectedUpc]);

  const calcNewMetrics = () => {
    setNewPrice(priceText);
    setNewCost(costText);
  };

  const handleTextChange = (e: string) => {
    if (!isNaN(Number(e))) {
      setPriceText(e);
    }
  };

  const handleCostChange = (e: string) => {
    if (!isNaN(Number(e))) {
      setCostText(e);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setNewPrice(priceText);
    }
  };

  return (
    <>
      {item ? (
        <div className="bg-custom-white rounded-lg shadow-lg">
          <div className="font-medium px-4 bg-blue-500 text-custom-white rounded-t-lg py-1 flex justify-between">
            <div>Linear Demand Curve</div>
            <div>{state.selectedUpc}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-2">
            <div>
              <div>
                <label className="font-medium underline text-xs pl-0.5">
                  Price:
                </label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  value={priceText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <label className="font-medium underline text-xs pl-0.5">
                  Cost:
                </label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  value={costText}
                  onChange={(e) => handleCostChange(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button
                  className="btn-themeBlue w-full mt-2 py-1.5"
                  onClick={calcNewMetrics}
                >
                  Calculate
                </button>
                <div className="text-xs mt-2 space-y-0.5 text-content/70">
                  <div className="">Q = Intercept + (Slope * Price)</div>
                  <div className="">
                    Q = {params.intercept.toFixed(2)} + (
                    {params.slope.toFixed(2)} *{" "}
                    {formatCurrency2(parseFloat(newPrice))})
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="font-medium underline text-sm">Prices/Qty</div>
              {prices.map((p, i) => {
                return (
                  <div key={p} className="text-sm grid grid-cols-2">
                    <div>Price: {formatCurrency2(p)}</div>
                    <div>Qty: {quantities[i]}</div>
                  </div>
                );
              })}
              <div className="border-2 p-3 mt-2 border-emerald-500 rounded-lg bg-emerald-100 text-sm">
                <div className="font-medium underline">Predicted Metrics</div>
                <div className="text-sm">
                  <span>Qty:</span>
                  <span className="font-medium pl-1">
                    {predictCtrlQty(
                      parseFloat(newPrice),
                      params,
                      item?.metrics
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Revenue:</span>
                  <span className="font-medium pl-1">
                    {formatCurrency2(
                      estimateCtrlRevenue(
                        parseFloat(newPrice),
                        params,
                        item?.metrics
                      )
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Profit:</span>
                  <span className="font-medium pl-1">
                    {formatCurrency2(
                      estimateCtrlProfit(
                        parseFloat(newPrice),
                        params,
                        parseFloat(newCost),
                        item?.metrics
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default LinearDemand;
