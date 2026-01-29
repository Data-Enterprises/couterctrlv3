import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";

// Components
import { useToast } from "../../components/toasts/hooks/useToast";
import FileInput from "./controls/FileInput";
import SingleSelect from "../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import type {
  JsonError,
  Store,
  PriceHistoryFromListResp,
} from "../../interfaces";
import type { Group } from "../../features/groupSlice";
import {
  reQuery,
  setIsLoading,
  setItems,
  setRadioId,
  setSelectedStores,
  setInitialRowData,
  setForecastResults,
  setSingleForecastResults,
  setNoResults,
} from "../../features/forecastSlice";
import { useForecastContext, useResizeContext } from "./hooks";
import SelectedStoreList from "../upc/wizard/SelectedStoreList";
import ForecastControls from "./controls/ForecastControls";
import FileGrid from "./grids/FileGrid";
import OutlierGrid from "./grids/OutlierGrid";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import ForecastModal from "./controls/ForecastModal";
import DatePickers from "../../components/datePickers/DatePickers";
import { getHistoryFromList } from "../../api/priceSim";
import {
  removeSingleUpc,
  // setUpcFileName,
  setUpcs,
  setUpcText,
} from "../../features/upcUploadSlice";
import ForecastCarousel from "./carousel/ForecastCarousel";
import { formatRowData } from ".";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

const Forecasting = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const { height } = useResizeContext("");
  const [file, setFile] = useState<File | null>(null);
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);
  const { upcs, upcText } = useAppSelector((state) => state.upcs);

  useEffect(() => {
    return () => {
      // if (context.forecastResults.length === 0 || !file) {
      //   dispatch(setUpcFileName(""));
      // }
    }
  }, []);

  useEffect(() => {
    // On mount, if radioId is 0, set to 1 (Stores)
    if (context.radioId === 0) {
      dispatch(setRadioId(1));
      setFilteredData(context.assignedStores);
    } else if (context.radioId === 1) {
      setFilteredData(context.assignedStores);
    } else if (context.radioId === 2) {
      setFilteredData(context.groups);
    }
  }, [context.radioId]);

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
        if (j.error === 0 && j.results.length > 0) {
          // Set the upc items for the controls
          const upcItems = j.results.map((item) => ({
            upc: item.upc,
            description: item.description,
          }));
          dispatch(setItems(upcItems));

          // set the raw data => needed to grab the prices and figure out the forecast values
          dispatch(setForecastResults(j.results));

          const singlePrices = j.results.filter(
            (item) => item.price_history.length === 1
          );
          const multiPrices = j.results.filter(
            (item) => item.price_history.length > 1
          );

          // set the row data
          const rowData = formatRowData(multiPrices);
          dispatch(setInitialRowData(rowData));
          dispatch(setSingleForecastResults(singlePrices));
        } else {
          dispatch(setNoResults(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsLoading(false)));
  };

  const handleSelectChange = (id: string | number) => {
    dispatch(setSelectedStores([])); // Clear selected stores on new selection
    dispatch(setRadioId(id as number));
    if (id === 1) {
      setFilteredData(context.assignedStores);
    } else if (id === 2) {
      setFilteredData(context.groups);
    }
  };

  const handleSelectClick = (id: string | number) => {
    // Store
    if (context.radioId === 1) {
      const store = filteredData.find(
        (item): item is Store => "storeid" in item && item.storeid === id
      );
      const existingStore = context.selectedStores.find(
        (s) => s.storeid === id
      );
      if (existingStore) {
        const copy = [...context.selectedStores].filter(
          (s) => s.storeid !== id
        );
        dispatch(setSelectedStores(copy));
      } else if (store) {
        dispatch(setSelectedStores([...context.selectedStores, store]));
      }
    } else if (context.radioId === 2) {
      // Group
      getStoresAssignedToUserGroup(
        context.url,
        context.token,
        context.userid,
        Number(id)
      )
        .then((resp) => {
          const j = resp.data;
          const filtered = [...j.stores].filter((store) => store.active === 1);
          dispatch(setSelectedStores(filtered));
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

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
    <div
      data-testid="forecast-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] relative w-full"
    >
      <ForecastModal />
      <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 gap-2 grid grid-cols-[18%_11%_70%] overflow-hidden">
        <div className="grid grid-rows-[37%_35%_24%] gap-4">
          <div className="bg-custom-white rounded-lg shadow-lg p-2">
            <div className="flex gap-2">
              <SingleSelect
                data={options}
                label="Store or Group"
                displayKey="label"
                valueKey="id"
                onSelect={handleSelectChange}
                defaultQuery="Stores"
                id={1}
                className="w-1/2"
              />
              {context.radioId === 1 ? (
                <SingleSelect
                  label="Stores"
                  data={filteredData as Store[]}
                  displayKey={"store_name" as keyof Store}
                  valueKey={"storeid" as keyof Store}
                  onSelect={handleSelectClick}
                  keepOpen={true}
                  resetQuery={true}
                  id={2}
                  className="w-1/2"
                />
              ) : (
                <SingleSelect
                  label="Groups"
                  data={filteredData as Group[]}
                  valueKey={"id" as keyof Group}
                  displayKey={"group_name" as keyof Group}
                  onSelect={handleSelectClick}
                  resetQuery={true}
                  id={2}
                  className="w-1/2"
                />
              )}
            </div>
            <DatePickers showBtn={false} />
            <SelectedStoreList
              selectedStores={context.selectedStores}
              radioId={context.radioId}
              className=""
              context="large"
            />
          </div>
          <div className="bg-custom-white rounded-lg shadow-lg px-2">
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
              data-testid="forecast-upc-input"
              className="basic-input focus:border bg-custom-white py-1 mt-2"
              value={upcText}
              onChange={handleTextChange}
              onKeyDown={handleEnterDown}
            />
            <div className="flex py-2 gap-2">
              <button
                data-testid="forecast-add-upc-btn"
                className="btn-themeBlue py-1 border px-0 w-1/2"
                onClick={() => handleAddUpc(upcText)}
              >
                Add
              </button>
              <button
                data-testid="forecast-clear-upc-btn"
                className="btn-themeBlue py-1 border px-0 w-1/2"
                onClick={() => handleAddUpc("")}
              >
                Clear
              </button>
            </div>
            <div
              className={`bg-bkg shadow rounded-lg grid grid-cols-3 text-xs ${height} overflow-y-scroll no-scrollbar mb-2`}
            >
              {upcs.map((u, i) => (
                <div
                  key={i}
                  data-testid={`forecast-upc-item-${u}-${i}`}
                  className="px-2 py-0.5 font-medium hover:text-blue-500  transition-all duration-200 cursor-pointer"
                  onClick={() => handleRemoveUpc(u)}
                >
                  {u}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FileInput
                page="forecast"
                fileExt={[".csv"]}
                setFile={setFile}
                className="w-full"
              />
              <button
                data-testid="forecast-search-btn"
                className="btn-themeBlue"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
          <FileGrid />
        </div>
        <div className="relative">
          <ForecastControls />
          {context.isLoading && <LoadingIndicator className="ml-2" />}
        </div>

        <div className="grid grid-rows-[24%_76%] mb-2 gap-2 relative">
          <ForecastCarousel />
          <OutlierGrid />
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
