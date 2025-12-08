import { useEffect, useState } from "react";
import { useAppDispatch } from "../../hooks";
import { getForecasting } from "../../api/forecast";

// Components
import DatePickers from "../../components/datePickers/DatePickers";
import Instructions from "./Instructions";
import { useToast } from "../../components/toasts/hooks/useToast";
import FileInput from "./FileInput";
import SingleSelect from "../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import type { JsonError, Store, UpcForecast } from "../../interfaces";
import type { Group } from "../../features/groupSlice";
import { setRadioId, setSelectedStores } from "../../features/forecastSlice";
import { useForecastContext } from "./hooks";
import SelectedStoreList from "../upc/wizard/SelectedStoreList";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

const Forecasting = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();

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
            const upcItems = Object.keys(j.qty_output).map((k) => ({
              product_code: k,
              description: j.qty_output[k as string].metrics.description,
            }));
            console.log("UPC Items:", upcItems);
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
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
      <div className="grid grid-cols-[20%_80%] gap-4 min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 overflow-hidden">
        <div className="space-y-4">
          <div className="bg-custom-white rounded-lg shadow-lg p-4">
            <div className="mb-2">
              <SingleSelect
                data={options}
                label="Store or Group"
                displayKey="label"
                valueKey="id"
                onSelect={handleSelectChange}
                defaultQuery="Stores"
                id={1}
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
                />
              )}
            </div>
            <DatePickers showBtn={false} />
            <div className="flex gap-2">
              <FileInput
                file={file}
                fileExt={[".csv"]}
                setFile={setFile}
                className="w-1/2"
              />
              <button className="btn-themeBlue w-1/2" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>
          <div className="bg-custom-white rounded-lg shadow-lg p-2">
            <Instructions />
            <SelectedStoreList
              selectedStores={context.selectedStores}
              radioId={context.radioId}
              className=""
              gridCols="grid-cols-2"
              height="py-1 min-h-40 max-h-40"
            />
          </div>
        </div>
        <div className="bg-custom-white rounded-lg shadow-lg mr-4">widgets</div>
      </div>
    </div>
  );
};

export default Forecasting;
