import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

// slice
import {
  reQuery,
  setQty,
  setSales,
  setItems,
  setSelectedStores,
  setRadioId,
  setIsLoading,
} from "../../../features/priceSimSlice";

// types and utils
import type { JsonError, Store } from "../../../interfaces";
import type { Group } from "../../../features/groupSlice";
import { formatQtyOutput, formatSalesOutput } from ".";

import FileInput from "../../forecast/controls/FileInput";
import SelectedStoreList from "../../upc/wizard/SelectedStoreList";
import DatePickers from "../../../components/datePickers/DatePickers";
import SingleSelect from "../../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { getForecasting } from "../../../api/forecast";
import { usePriceSimContext } from "../utils";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

const PriceSimStorePicker = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = usePriceSimContext();
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
            const qtyOutput = formatQtyOutput(j);
            const salesOutput = formatSalesOutput(j);

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

  return (
    <div className="bg-custom-white rounded-lg shadow-lg p-4">
      <div className="">
        <div className="flex gap-2 mb-1">
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
      <div className="flex gap-2 mt-4">
        <FileInput
          file={file}
          fileExt={[".csv"]}
          setFile={setFile}
          className="w-1/2"
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

export default PriceSimStorePicker;
