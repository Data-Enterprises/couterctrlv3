import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setUpcText,
  removeSingleUpc,
  setUpcs,
} from "../../../features/upcUploadSlice";

import { useForecastContext } from "../../../pages/forecast/hooks";
import {
  reQuery,
  setForecastResults,
  setIsLoading,
  setItems,
  // setRowData,
} from "../../../features/forecastSlice";
import { getHistoryFromList } from "../../../api/priceSim";
import type { JsonError, PriceHistoryFromListResp } from "../../../interfaces";
// import { formatRowData } from ".";
import FileInput from "../controls/FileInput";

const UpcUploader = () => {
  const toast = useToast();
  const context = useForecastContext();
  const dispatch = useAppDispatch();
  const { upcs, upcText } = useAppSelector((state) => state.upcs);
  const [file, setFile] = useState<File | null>(null);

  // Data fetching and processing
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
    console.log(file);

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
          dispatch(setForecastResults(j.results));

          // set the row data
          // const rowData = formatRowData(j.results);
          // dispatch(setRowData(rowData));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsLoading(false)));
  };

  // Input interactions
  const handleAddUpc = (upc: string) => {
    if (upc === "") {
      dispatch(setUpcs([]));
      return;
    }
    const newUpcs = upc.split(",").map((u) => u.trim());
    dispatch(setUpcs(newUpcs));
  };

  const handleEnterDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddUpc(e.currentTarget.value);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUpcText(e.currentTarget.value));
  };

  const handleRemoveUpc = (upc: string) => {
    dispatch(removeSingleUpc(upc));
  };
  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-3">
      <div className="bg-blue-500 text-custom-white -mx-3 py-0.5 px-4 rounded-t-lg font-medium flex justify-between">
        <div>
          UPCs <span className="text-sm">(comma separated)</span>
        </div>
        <div className={`${upcs.length === 0 && "hidden"}`}>{upcs.length}</div>
      </div>
      <input
        type="text"
        className="basic-input focus:border bg-custom-white py-1 mt-2"
        value={upcText}
        onChange={handleTextChange}
        onKeyDown={handleEnterDown}
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
          // file={file}
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
  );
};

export default UpcUploader;
