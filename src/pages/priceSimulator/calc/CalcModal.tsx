import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import Modal from "../../../components/Modal";
import { setCalcNow } from "../../../features/priceSimSlice";
import { formatCurrency2 } from "../../../utils";
import { fitLinearDemand, predictProfit, predictQty, predictRevenue } from ".";

const CalcModal = () => {
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  const { selectedRow } = useAppSelector((state) => state.priceSim);
  const [params, setParams] = useState<{ slope: number; intercept: number }>({
    slope: 0,
    intercept: 0,
  });
  const [priceText, setPriceText] = useState<string>("");
  const [newPrice, setNewPrice] = useState("");
  const [costText, setCostText] = useState<string>("");
  const [newCost, setNewCost] = useState("");
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (selectedRow) {
      setNewPrice(selectedRow.fcstPrice.toString());
      setPriceText(selectedRow.fcstPrice.toString());
      setNewCost("12.90");
      setCostText("12.90");
      setParams(fitLinearDemand(selectedRow.prices));
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
    <Modal isOpen={open} onClose={handleClose} modalClassName="bg-bkg p-2 w-[22%]">
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
              </div>
            </div>
            <div>
              <div className="border-2 p-3 mt-5 border-emerald-500 rounded-lg bg-emerald-100 text-sm">
                <div className="font-medium underline">Predicted Metrics</div>
                <div className="text-sm">
                  <span>Qty:</span>
                  <span className="font-medium pl-1">
                    {Math.ceil(
                      predictQty(
                        parseFloat(newPrice),
                        params,
                        selectedRow.prices
                      )
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Revenue:</span>
                  <span className="font-medium pl-1">
                    {formatCurrency2(
                      predictRevenue(
                        parseFloat(newPrice),
                        params,
                        selectedRow.prices
                      )
                    )}
                  </span>
                </div>
                <div className="text-sm">
                  <span>Profit:</span>
                  <span className="font-medium pl-1">
                    {formatCurrency2(
                      predictProfit(
                        parseFloat(newPrice),
                        params,
                        parseFloat(newCost),
                        selectedRow.prices
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex gap-4 px-2 pb-2">
            <button
              className="btn-themeBlue w-full py-1.5"
              onClick={calcNewMetrics}
            >
              Calculate
            </button>
            <button
              className="btn-themeOrange w-full py-1.5"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default CalcModal;
