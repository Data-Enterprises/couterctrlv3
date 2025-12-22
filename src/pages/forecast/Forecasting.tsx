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
  setRowData,
  setForecastResults,
} from "../../features/forecastSlice";
import { useForecastContext } from "./hooks";
import SelectedStoreList from "../upc/wizard/SelectedStoreList";
import ForecastControls from "./controls/ForecastControls";
import FileGrid from "./grids/FileGrid";
import OutlierGrid from "./grids/OutlierGrid";
import PriceHistoryGrid from "./grids/PriceHistoryGrid";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import ForecastModal from "./controls/ForecastModal";
import DatePickers from "../../components/datePickers/DatePickers";
import { fitLinearDemand, predictQty } from "./utils";
import { forecastUnits } from "../priceSimulator/calc";
import { getHistoryFromList } from "../../api/priceSim";
import {
  removeSingleUpc,
  setUpcs,
  setUpcText,
} from "../../features/upcUploadSlice";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

const Forecasting = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const [file, setFile] = useState<File | null>(null);
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);
  const { upcs, upcText } = useAppSelector((state) => state.upcs);

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
          const rowData = j.results.map((item) => {
            const prices = item.price_history.map((p) => [
              parseFloat(p.price),
              p.qty,
            ]);
            const linear = fitLinearDemand(prices);
            const predictedQty = predictQty(prices[0][0], linear, prices);

            const units = forecastUnits(
              prices[0][0], // 9.99
              predictedQty, // 120
              item.days_active, //50
              90,
              7,
              prices
            );

            return {
              upc: item.upc,
              description: item.description,
              qtySold: prices[0][1],
              daysActive: item.days_active,
              adFcst: units,
              fcstPrice: prices[0][0],
              fcstTotal: prices[0][0] * units,
            };
          });
          dispatch(setRowData(rowData));
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
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]"
    >
      <ForecastModal />
      <div className="grid grid-cols-[20%_12%_45%_23%] gap-4 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
        <div className="gap-4 grid grid-rows-[37%_35%_24%]">
          <div className="bg-custom-white rounded-lg shadow-lg p-4">
            <div className="">
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
                height="py-1 min-h-32 max-h-32"
              />
            </div>
          </div>
          <div className="bg-custom-white rounded-lg shadow-lg px-3">
            <div className="bg-blue-500 text-custom-white -mx-3 py-0.5 px-4 rounded-t-lg font-medium">
              UPCs <span className="text-sm">(comma separated)</span>
            </div>
            <div className="grid grid-cols-[75%_25%] py-2 gap-2 mr-2">
              <input
                type="text"
                className="basic-input focus:border bg-custom-white py-1"
                value={upcText}
                onChange={handleTextChange}
                onKeyDown={handleEnterDown}
              />
              <button
                className="btn-themeBlue py-1 border px-0"
                onClick={() => handleAddUpc(upcText)}
              >
                Add
              </button>
            </div>
            <div className="bg-bkg shadow rounded-lg grid grid-cols-3 text-xs min-h-40 max-h-40 overflow-y-scroll no-scrollbar mb-2">
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
          <FileGrid />
        </div>
        <div className="relative h-full">
          <ForecastControls />
          {context.isLoading && <LoadingIndicator />}
        </div>
        <div className="grid grid-rows-3 gap-4">
          <OutlierGrid />
          <PriceHistoryGrid />
        </div>
        {/* <div className="grid grid-rows-3 gap-4 mr-12">
          <LinearDemand />
          <ProfitOptimization />
        </div> */}
      </div>
    </div>
  );
};

export default Forecasting;
