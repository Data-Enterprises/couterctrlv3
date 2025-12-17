import { useEffect, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { getForecasting } from "../../api/forecast";

// Components
import Instructions from "./controls/Instructions";
import { useToast } from "../../components/toasts/hooks/useToast";
import FileInput from "./controls/FileInput";
import SingleSelect from "../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import type {
  ForecastQtyData,
  JsonError,
  Store,
  ForecastSalesData,
} from "../../interfaces";
import type { Group } from "../../features/groupSlice";
import {
  reQuery,
  setIsLoading,
  setItems,
  setQty,
  setRadioId,
  setSales,
  setSelectedStores,
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
import LinearDemand from "./profit/LinearDemand";
import ProfitOptimization from "./profit/ProfitOptimization";

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
    if (file) {
      dispatch(setIsLoading(true));
      dispatch(reQuery());
      getForecasting(
        context.url,
        context.token,
        context.storeids,
        context.startDate,
        context.endDate,
        file
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            // To set the list of items for the controls
            const qtyOutput: ForecastQtyData<any>[] = Object.entries(
              j.qty_output
            ).map(([k, v]) => {
              const upc = k as string;
              const data = v as any;
              return {
                upc,
                history: data.history,
                history_dimension: data.history_dimension,
                forecast: data.forecast,
                forecast_dimension: data.forecast_dimension,
                forecast_method: data.forecast_method,
                metrics: data.metrics,
              };
            });

            const salesOutput: ForecastSalesData<any>[] = Object.entries(
              j.sales_output
            ).map(([k, v]) => {
              const upc = k as string;
              const data = v as any;
              return {
                upc,
                history: data.history,
                history_dimension: data.history_dimension,
                forecast: data.forecast,
                forecast_dimension: data.forecast_dimension,
                forecast_method: data.forecast_method,
                metrics: data.metrics,
              };
            });

            const upcItems = qtyOutput.map((item) => ({
              upc: item.upc,
              description: item.metrics.description,
            }));

            dispatch(setQty(qtyOutput));
            dispatch(setSales(salesOutput));
            dispatch(setItems(upcItems));
          }
        })
        .catch((err: JsonError) => toast.error(err.message))
        .finally(() => dispatch(setIsLoading(false)));
    }
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

  return (
    <div
      data-testid="forecast-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)]"
    >
      <ForecastModal />
      <div className="grid grid-cols-[20%_12%_45%_23%] gap-4 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
        <div className="gap-4 flex flex-col justify-between">
          <Instructions />
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
                height="py-1 min-h-40 max-h-40"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <FileInput
                file={file}
                fileExt={[".csv"]}
                setFile={setFile}
                className="w-1/2"
              />
              <button
                data-testid="forecast-search-btn"
                className="btn-themeBlue w-1/2"
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
        <div className="grid grid-rows-3 gap-4 mr-12">
          <LinearDemand />
          <ProfitOptimization />
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
