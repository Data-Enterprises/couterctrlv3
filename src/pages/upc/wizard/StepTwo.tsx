import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setIndex,
  setRadioId,
  setSelectedStores,
  setTrendPeriods,
} from "../../../features/upcSlice";
import type { JsonError, Store } from "../../../interfaces";
import type { Group } from "../../../features/groupSlice";
import { useUpcContext } from "./hooks";

import { getStoresAssignedToUserGroup } from "../../../api/groups";
import DatePickers from "../../../components/datePickers/DatePickers";
import TextInput from "../../../components/TextInput";
import SingleSelect from "../../../components/SingleSelect";
import SelectedStoreList from "./SelectedStoreList";
import Tooltips from "./components/Tooltips";
import Buttons from "./components/Buttons";

interface StepTwoProps {
  className?: string;
  getData: () => void;
}

const UpcStepTwo = ({ className = "", getData }: StepTwoProps) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const params = useUpcContext();
  const user = useAppSelector((state) => state.user);
  const group = useAppSelector((state) => state.group);
  const upc = useAppSelector((state) => state.upc);
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);

  useEffect(() => {
    // On mount, if radioId is 0, set to 1 (Stores)
    if (upc.radioId === 0) {
      dispatch(setRadioId(1));
      setFilteredData(user.assignedStores);
    }
  }, [upc.radioId]);

  const handleRadioChange = (id: string | number) => {
    dispatch(setRadioId(id as number));
    if (id === 1) {
      setFilteredData(user.assignedStores);
    } else if (id === 2) {
      setFilteredData(group.groups);
    }
  };

  const handleSelectClick = (id: string | number) => {
    // Store
    if (upc.radioId === 1) {
      // Find the store in the filtered data and add/remove from selectedStores
      const store = filteredData.find(
        (item): item is Store => "storeid" in item && item.storeid === id
      );
      const existingStore = upc.selectedStores.find((s) => s.storeid === id);
      if (existingStore) {
        const copy = [...upc.selectedStores].filter((s) => s.storeid !== id);
        dispatch(setSelectedStores(copy));
      } else if (store) {
        dispatch(setSelectedStores([...upc.selectedStores, store]));
      }
    } else if (upc.radioId === 2) {
      // Group
      getStoresAssignedToUserGroup(
        params.url,
        params.token,
        params.userid,
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

  const isReady = () => {
    return upc.selectedStores.length > 0;
  };

  const options = [
    { label: "Stores", id: 1 },
    { label: "Group", id: 2 },
  ];

  const handleNext = () => {
    dispatch(setIndex(2));
    getData();
  };

  return (
    <div className={`flex flex-col items-center p-4 gap-2 ${className}`}>
      <DatePickers showBtn={false} />
      <div className={`w-full grid grid-cols-3 gap-2 -mt-2 mb-1`}>
        <SingleSelect
          data={options}
          label="Store or Group"
          displayKey="label"
          valueKey="id"
          onSelect={handleRadioChange}
          defaultQuery="Stores"
        />
        {upc.radioId === 1 ? (
          <SingleSelect
            label="Stores"
            data={filteredData as Store[]}
            displayKey={"store_name" as keyof Store}
            valueKey={"storeid" as keyof Store}
            onSelect={handleSelectClick}
            keepOpen={true}
            resetQuery={true}
            innerClass="border-2 focus:border-blue-500 border-content/20"
          />
        ) : (
          <SingleSelect
            label="Groups"
            data={filteredData as Group[]}
            valueKey={"id" as keyof Group}
            displayKey={"group_name" as keyof Group}
            onSelect={handleSelectClick}
            resetQuery={true}
            innerClass="border-2 focus:border-blue-500 border-content/20"
          />
        )}
        <TextInput
          name="number"
          query={upc.trendPeriods.toString()}
          title="Trend Periods"
          isSimple={true}
          setText={(x) => dispatch(setTrendPeriods(x))}
        />
      </div>
      <SelectedStoreList />
      <div className="text-sm text-center text-content/70 mt-1">
        Please make sure your date range is valid before continuing.
      </div>
      <Tooltips />
      <Buttons
        slide={2}
        isReady={isReady}
        handleNext={handleNext}
        handleBack={() => dispatch(setIndex(0))}
      />
    </div>
  );
};

export default UpcStepTwo;
