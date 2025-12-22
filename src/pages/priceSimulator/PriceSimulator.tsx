// Components
import PriceSimControls from "./controls/PriceSimControls";
import PriceSimStorePicker from "./controls/PriceSimStorePicker";
import FilesGrid from "./controls/FilesGrid";
import PriceSimGrid from "./grid/PriceSimGrid";
import PriceSimCarousel from "./grid/PriceSimCarousel";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useState } from "react";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  reQuery,
  setGlobalFcstPrice,
  setGlobalRows,
  setIsLoading,
  setItems,
  setPriceSimResults,
  setRowData,
} from "../../features/priceSimSlice";
import PriceSimExportModal from "./export/PriceSimExportModal";
import FileInput from "../forecast/controls/FileInput";
import type { JsonError, PriceHistoryFromListResp } from "../../interfaces";
import {
  removeSingleUpc,
  setUpcs,
  setUpcText,
} from "../../features/upcUploadSlice";
import { usePriceSimContext } from "./utils";
import { getHistoryFromList } from "../../api/priceSim";
import { calcFcstQty } from "./calc";
import LoadingIndicator from "../../components/loading/LoadingIndicator";

const PriceSimulator = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = usePriceSimContext();
  const state = useAppSelector((state) => state.priceSim);
  const [globalFcstText, setGlobalFcstText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const { upcs, upcText } = useAppSelector((state) => state.upcs);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isNaN(parseFloat(e.target.value)) || e.target.value === "") {
      setGlobalFcstText(e.target.value);
    }
  };
  const handleGlobalFcstPriceClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (e.currentTarget.innerText === "Clear") {
      setGlobalFcstText("");
      dispatch(setGlobalFcstPrice(""));
      dispatch(setGlobalRows([]));
      return;
    }
    dispatch(setGlobalFcstPrice(globalFcstText));
  };

  const handleEnterDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      dispatch(setGlobalFcstPrice(globalFcstText));
    }
  };
  const handleSearch = () => {
    if (context.storeids.length === 0) {
      toast.warn("Please select at least one store");
      return;
    }
    if (upcs.length === 0) {
      toast.warn("Please add at least one UPC");
      return;
    }

    dispatch(setIsLoading(true));
    dispatch(reQuery());

    getHistoryFromList(
      context.url,
      context.token,
      context.storeids,
      context.endDate,
      upcs.join(",")
    )
      .then((resp) => {
        const j: PriceHistoryFromListResp = resp.data;
        if (j.error === 0) {
          // Set the upc items for the controls
          const upcItems = j.results.map((item) => ({
            upc: item.upc,
            description: item.description,
          }));
          dispatch(setItems(upcItems));

          // set the raw data => needed to grab the prices and figure out the forecast values
          dispatch(setPriceSimResults(j.results));

          // set the row data
          const rowData = j.results.map((item) => {
            const prices = item.price_history.map((p) => [
              parseFloat(p.price),
              p.qty,
            ]);

            const fcstPrice = prices[0][0];
            const fcstQty = calcFcstQty(prices, fcstPrice);
            const fcstDollars = fcstPrice * fcstQty;

            const regQty =
              item.price_history.find(
                (p) => p.price === item.regular_retail_price.toString()
              )?.qty || 0;

            const regDollars = item.regular_retail_price * regQty;

            const markdownDollars =
              (item.regular_retail_price - fcstPrice) * fcstQty;

            const lift = regQty > 0 ? (fcstQty - regQty) / regQty : 0;

            return {
              upc: item.upc,
              description: item.description,
              fcstPrice: fcstPrice,
              calcNow: 0 as 0 | 1,
              fcstQty: fcstQty,
              fcstDollars: fcstDollars,
              regRetail: item.regular_retail_price,
              regQty: regQty,
              regDollars: regDollars,
              markdownDollars: markdownDollars,
              lift: lift,
              prices: prices,
            };
          });
          dispatch(setRowData(rowData));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsLoading(false)));
  };

  const handleAddUpc = (upc: string) => {
    if (upc === "") {
      dispatch(setUpcs([]));
      return;
    }
    const newUpcs = upc.split(",").map((u) => u.trim());
    dispatch(setUpcs(newUpcs));
  };

  const handleEnterDown2 = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddUpc(e.currentTarget.value);
    }
  };

  const handleTextChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUpcText(e.currentTarget.value));
  };

  const handleRemoveUpc = (upc: string) => {
    dispatch(removeSingleUpc(upc));
  };

  return (
    <div
      data-testid="price-simulator-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 gap-4 flex overflow-hidden"
    >
      <PriceSimExportModal />
      <div className="grid grid-rows-[37%_35%_24%] col-span-2 gap-4 w-1/6">
        <PriceSimStorePicker />
        <div className="bg-custom-white rounded-lg shadow-lg px-3">
          <div className="bg-blue-500 text-custom-white -mx-3 py-0.5 px-4 rounded-t-lg font-medium flex justify-between">
            <div>
              UPCs <span className="text-sm">(comma separated)</span>
            </div>
            <div className={`${upcs.length === 0 && "hidden"}`}>
              {upcs.length}
            </div>
          </div>
          <input
            type="text"
            className="basic-input focus:border bg-custom-white py-1 mt-2"
            value={upcText}
            onChange={handleTextChange2}
            onKeyDown={handleEnterDown2}
          />
          <div className="flex py-2 gap-2">
            <button
              className="btn-themeBlue py-1 border px-0 w-1/2"
              onClick={() => handleAddUpc(upcText)}
            >
              Add
            </button>
            <button
              className="btn-themeBlue py-1 border px-0 w-1/2"
              onClick={() => handleAddUpc("")}
            >
              Clear
            </button>
          </div>
          <div className="bg-bkg shadow rounded-lg grid grid-cols-3 text-xs min-h-28 max-h-28 overflow-y-scroll no-scrollbar mb-2">
            {upcs.map((u, i) => (
              <div
                key={i}
                className="px-2 py-0.5 font-medium hover:text-blue-500  transition-all duration-200 cursor-pointer"
                onClick={() => handleRemoveUpc(u)}
              >
                {u}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <FileInput
              file={file}
              fileExt={[".csv"]}
              setFile={setFile}
              className="w-1/2 py-0"
            />
            <button
              data-testid="forecast-search-btn"
              className="btn-themeBlue w-1/2 py-1"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        </div>
        <FilesGrid />
      </div>
      <div className="ml-10 relative">
        <PriceSimControls />
        {context.isLoading && <LoadingIndicator className="ml-20" />}
        {/* <LoadingIndicator className="ml-20" /> */}
      </div>

      <div className="grid grid-rows-[25%_75%] mb-4 gap-4 w-full relative">
        <PriceSimCarousel />
        <div
          className={`${
            state.rowData.length === 0 && "hidden"
          } absolute left-0 top-[165px] flex items-end gap-2`}
        >
          <div>
            <label className="text-xs font-medium pl-0.5">
              Global Fcst Price
            </label>
            <input
              type="text"
              className="basic-input border-2 py-1 bg-custom-white w-32"
              value={globalFcstText}
              onChange={handleTextChange}
              onKeyDown={handleEnterDown}
            />
          </div>
          <div>
            <button
              className="btn-themeBlue py-1 px-4"
              onClick={handleGlobalFcstPriceClick}
            >
              {state.globalRows.length ? "Clear" : "Set"}
            </button>
          </div>
        </div>
        <PriceSimGrid />
      </div>
    </div>
  );
};

export default PriceSimulator;
