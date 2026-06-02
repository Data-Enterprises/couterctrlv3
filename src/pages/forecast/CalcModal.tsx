import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import Modal from "../../components/Modal";
import {
  setCalcNow,
  setItemNotes,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
} from "../../features/forecastSlice";
import { formatCurrency2 } from "../../utils";
import { fitLinearDemand, predictQty } from "./utils";
import { forecastUnits } from "../priceSimulator/calc";
import type { PriceHistory } from "../../interfaces";
import ScenarioTable from "./ScenarioTable";

const CalcModal = () => {
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { selectedRow, forecastResults, rowData } = useAppSelector(
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
  const [noteText, setNoteText] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false);
  const [prices, setPrices] = useState<number[][]>([]);
  const [overallUnits, setOverallUnits] = useState<number>(0);
  const [priceHistoryRaw, setPriceHistoryRaw] = useState<PriceHistory[]>([]);
  const [regularRetail, setRegularRetail] = useState<number>(0);
  const [customPrices, setCustomPrices] = useState<number[]>([]);
  const lastUpcRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedRow) {
      if (lastUpcRef.current !== selectedRow.upc) {
        setCustomPrices([]);
        lastUpcRef.current = selectedRow.upc;
      }
      setNewPrice(selectedRow.fcstPrice.toString());
      setPriceText(selectedRow.fcstPrice.toString());
      setNewCost("0.00");
      setCostText("0.00");
      setNoteText(selectedRow.notes ?? "");

      const result = forecastResults.find((r) => r.upc === selectedRow.upc);
      const history = result?.price_history ?? [];
      const upcPrices = history.map((p) => [parseFloat(p.price), p.qty]);
      const units = result?.qty ?? 0;

      setPriceHistoryRaw(history);
      setRegularRetail(result?.regular_retail_price ?? 0);
      setOverallUnits(units);
      setPrices(upcPrices);
      setParams(fitLinearDemand(upcPrices));
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
  };

  const handleApply = (price: number) => {
    dispatch(setNewRowPriceValue({ upc: selectedRow!.upc, newPrice: price }));
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

  const handleSetAdDays = (days: number) => {
    dispatch(setNewRowAdDaysValue({ upc: selectedRow!.upc, newAdDays: days }));
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

  const liveAdDays =
    rowData.find((r) => r.upc === selectedRow?.upc)?.adDays ??
    selectedRow?.adDays ??
    0;

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      modalClassName="bg-custom-white p-2 w-[62%]"
    >
      {selectedRow && isReady ? (
        <div className="bg-custom-white rounded-lg shadow-lg">
          <div className="font-medium px-2 bg-blue-500 text-[13px] text-custom-white rounded-t-lg py-1 flex justify-between items-center">
            <div>
              {selectedRow.description} - {selectedRow.upc}
            </div>
            <div
              className="cursor-pointer shadow-md hover:shadow-inner bg-red-600 hover:bg-red-700 transition-all duration-200 px-1 rounded-xl text-center w-5 h-5 leading-tight"
              onClick={handleClose}
            >
              x
            </div>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-4 p-2">
            <div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="font-medium underline text-xs pl-0.5">
                    Event Note:
                  </label>
                  <button
                    className="text-[11px] btn-themeBlue px-2 py-0.5"
                    onClick={() =>
                      dispatch(
                        setItemNotes({
                          upc: selectedRow!.upc,
                          notes: noteText,
                        }),
                      )
                    }
                  >
                    Update
                  </button>
                </div>
                <textarea
                  className="basic-input focus:border bg-custom-white w-full resize-none text-xs"
                  rows={2}
                  placeholder="e.g. Mother's Day 5/10/26…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              <div className="border-2 rounded-lg shadow-md bg-bkg p-1">
                <div className="border-2 p-2 mt-1 border-emerald-500 rounded-lg bg-emerald-100 text-[13px] grid grid-cols-3 gap-2">
                  <div className="font-medium underline col-span-3 leading-tight">
                    Predicted Metrics
                  </div>
                  <div className="text-[12px] bg-custom-white rounded-md shadow p-1 text-center">
                    <div>Quantity</div>
                    <div
                      data-testid="calc-modal-qty"
                      className="font-medium pl-1"
                    >
                      {showQty()}
                    </div>
                  </div>
                  <div className="text-[12px] bg-custom-white rounded-md shadow p-1 text-center">
                    <div>Revenue</div>
                    <div
                      data-testid="calc-modal-revenue"
                      className="font-medium pl-1"
                    >
                      {formatCurrency2(showRevenue())}
                    </div>
                  </div>
                  <div className="text-[12px] bg-custom-white rounded-md shadow p-1 text-center">
                    <div>Profit</div>
                    <div
                      data-testid="calc-modal-profit"
                      className="font-medium pl-1"
                    >
                      {formatCurrency2(showProfit())}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-medium underline text-xs pl-0.5">
                      Price:
                    </label>
                    <input
                      className="basic-input focus:border bg-custom-white py-1 text-[13px]"
                      data-testid="calc-modal-price-input"
                      value={priceText}
                      onChange={(e) => handleTextChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-medium underline text-xs pl-0.5">
                      Cost:
                    </label>
                    <input
                      className="basic-input focus:border bg-custom-white py-1 text-[13px]"
                      data-testid="calc-modal-cost-input"
                      value={costText}
                      onChange={(e) => handleCostChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full mt-2 grid">
                  <button
                    className="btn-themeBlue w-full py-1 text-[13px]"
                    onClick={() => calcNewMetrics()}
                    data-testid="calc-modal-calculate-button"
                  >
                    Calculate Predicted Metrics
                  </button>
                  {/* <button
                    data-testid="calc-modal-close-button"
                    className="btn-themeOrange w-full py-1 text-[13px]"
                    onClick={handleClose}
                  >
                    Close
                  </button> */}
                </div>
                <div>
                  <div className="font-medium underline text-[13px] mt-2">
                    Prices/Qty
                  </div>
                  <div className="overflow-hidden overflow-y-auto grid grid-cols-3 gap-2">
                    {prices.map((p, i) => {
                      return (
                        <div
                          key={i}
                          className="text-[12.5px] p-1 rounded-md shadow bg-custom-white border border-bkg"
                        >
                          <div className="flex justify-between">
                            <div>Price:</div>
                            <div className="font-medium">
                              {formatCurrency2(p[0])}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div>Qty:</div>
                            <div className="font-medium">{p[1]}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="flex flex-col min-h-0"
              style={{ maxHeight: "70vh" }}
            >
              <ScenarioTable
                pricesWithQty={prices}
                priceHistory={priceHistoryRaw}
                regularRetail={regularRetail}
                selectedRow={selectedRow}
                overallUnits={overallUnits}
                liveAdDays={liveAdDays}
                customPrices={customPrices}
                onApply={handleApply}
                onAddCustomPrice={(p) =>
                  setCustomPrices((prev) => [...prev, p])
                }
                onSetAdDays={handleSetAdDays}
              />
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CalcModal;
