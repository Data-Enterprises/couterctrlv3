import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import Modal from "../../components/Modal";
import { setCalcNow, setNewRowPriceValue } from "../../features/forecastSlice";
import { formatCurrency2 } from "../../utils";
import { fitLinearDemand, predictQty } from "./utils";
import { forecastUnits } from "../priceSimulator/calc";

const CalcModal = () => {
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { selectedRow, forecastResults } = useAppSelector(
    (state) => state.forecast,
  );
  const [params, setParams] = useState<{ slope: number; intercept: number }>({
    slope: 0,
    intercept: 0,
  });
  const [priceText, setPriceText] = useState<string>("");
  const [newPrice, setNewPrice] = useState("");
  const [costText, setCostText] = useState<string>("");
  const [newCost, setNewCost] = useState("");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [prices, setPrices] = useState<number[][]>([]);
  const [overallUnits, setOverallUnits] = useState<number>(0);

  useEffect(() => {
    if (selectedRow) {
      setNewPrice(selectedRow.fcstPrice.toString());
      setPriceText(selectedRow.fcstPrice.toString());
      setNewCost("12.90");
      setCostText("12.90");
      const prices = forecastResults.find(
        (r) => r.upc === selectedRow.upc,
      )?.price_history;

      const upcPrices = prices?.map((p) => [parseFloat(p.price), p.qty]);
      const overallUnits = forecastResults.find(
        (r) => r.upc === selectedRow.upc,
      )?.qty;
      setOverallUnits(overallUnits!);
      setPrices(upcPrices!);
      setParams(fitLinearDemand(upcPrices!));
      setOpen(true);
    }
  }, [selectedRow]);

  useEffect(() => {
    setIsReady(open && selectedRow !== null);
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    if (selectedRow) {
      dispatch(setCalcNow({ upc: selectedRow.upc, calcNow: 0 }));
    }
  };

  const calcNewMetrics = () => {
    setNewPrice(priceText);
    setNewCost(costText);

    dispatch(
      setNewRowPriceValue({
        upc: selectedRow!.upc,
        newPrice: parseFloat(priceText),
      }),
    );
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

  const showRevenue = () => {
    const units = forecastUnits(
      parseFloat(newPrice),
      overallUnits,
      predictQty(parseFloat(newPrice), params, prices),
      selectedRow!.daysActive,
      90,
      selectedRow!.daysAtPrice,
      7,
      prices,
    );
    return parseFloat(newPrice) * units;
  };

  const showQty = () => {
    return forecastUnits(
      parseFloat(newPrice),
      overallUnits,
      predictQty(parseFloat(newPrice), params, prices),
      selectedRow!.daysActive,
      90,
      selectedRow!.daysAtPrice,
      7,
      prices,
    );
  };

  const showProfit = () => {
    const qty = forecastUnits(
      parseFloat(newPrice),
      overallUnits,
      predictQty(parseFloat(newPrice), params, prices),
      selectedRow!.daysActive,
      90,
      selectedRow!.daysAtPrice,
      7,
      prices,
    );

    const revenue = parseFloat(newPrice) * qty;
    const cost = parseFloat(newCost) * qty;
    return revenue - cost;
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      modalClassName="bg-bkg p-2 w-[29%] -translate-x-[115%]"
    >
      {selectedRow && isReady ? (
        <div className="bg-custom-white rounded-lg shadow-lg">
          <div className="font-medium px-4 bg-blue-500 text-custom-white rounded-t-lg py-1 flex justify-between">
            <div>{selectedRow.description}</div>
            <div>{selectedRow.upc}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-2">
            <div>
              <div>
                <label className="font-medium underline text-xs pl-0.5">
                  Price:
                </label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  data-testid="calc-modal-price-input"
                  value={priceText}
                  onChange={(e) => handleTextChange(e.target.value)}
                />
                <label className="font-medium underline text-xs pl-0.5">
                  Cost:
                </label>
                <input
                  className="basic-input focus:border bg-custom-white"
                  data-testid="calc-modal-cost-input"
                  value={costText}
                  onChange={(e) => handleCostChange(e.target.value)}
                />
              </div>
              <div className="w-full mt-4 space-y-2">
                <button
                  className="btn-themeBlue w-full py-1.5"
                  onClick={() => calcNewMetrics()}
                  data-testid="calc-modal-calculate-button"
                >
                  Calculate
                </button>
                <button
                  data-testid="calc-modal-close-button"
                  className="btn-themeOrange w-full py-1.5"
                  onClick={handleClose}
                >
                  Close
                </button>
              </div>
            </div>
            <div>
              <div className="font-medium underline text-sm">Prices/Qty</div>
              <div className="min-h-28 max-h-28 overflow-hidden overflow-y-auto">
                {prices.map((p, i) => {
                  return (
                    <div key={i} className="text-sm grid grid-cols-2">
                      <div>Price: {formatCurrency2(p[0])}</div>
                      <div>Qty: {p[1]}</div>
                    </div>
                  );
                })}
              </div>
              <div className="border-2 p-2 mt-1 border-emerald-500 rounded-lg bg-emerald-100 text-sm">
                <div className="font-medium underline">Predicted Metrics</div>
                <div className="text-sm">
                  <span>Qty:</span>
                  <span
                    data-testid="calc-modal-qty"
                    className="font-medium pl-1"
                  >
                    {showQty()}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Revenue:</span>
                  <span
                    data-testid="calc-modal-revenue"
                    className="font-medium pl-1"
                  >
                    {formatCurrency2(showRevenue())}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Profit:</span>
                  <span
                    data-testid="calc-modal-profit"
                    className="font-medium pl-1"
                  >
                    {formatCurrency2(showProfit())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CalcModal;
