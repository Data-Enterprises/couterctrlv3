import { useUpcContext } from "../wizard/hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import {
  setRadioId,
  setSelectedStores,
  setTrendPeriods,
} from "../../../features/upcSlice";
import { useState } from "react";
import type { JsonError, Store } from "../../../interfaces";
import type { Group } from "../../../features/groupSlice";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { useToast } from "../../../components/toasts/hooks/useToast";

import SingleSelect from "../../../components/SingleSelect";
import TextInput from "../../../components/TextInput";
import DatePickers from "../../../components/datePickers/DatePickers";
import SelectedStoreList from "../wizard/SelectedStoreList";

const options = [
  { label: "Stores", id: 1 },
  { label: "Group", id: 2 },
];

const StoreDatePicker = () => {
  const toast = useToast();
  const context = useUpcContext();
  const dispatch = useAppDispatch();
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);
  const user = useAppSelector((state) => state.user);
  const group = useAppSelector((state) => state.group);

  const handleSelectChange = (id: string | number) => {
    dispatch(setRadioId(id as number));
    if (id === 1) {
      setFilteredData(user.assignedStores);
    } else if (id === 2) {
      setFilteredData(group.groups);
    }
  };

  const handleSelectClick = (id: string | number) => {
    // Store
    if (context.radioId === 1) {
      // Find the store in the filtered data and add/remove from selectedStores
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
    <div className="bg-custom-white px-4 py-2 rounded-lg shadow-lg">
      <div className={`w-full grid grid-cols-2 gap-2 -mt-2 mb-1`}>
        <SingleSelect
          data={options}
          label="Store or Group"
          displayKey="label"
          valueKey="id"
          onSelect={handleSelectChange}
          defaultQuery="Stores"
          id={1}
        />
        <TextInput
          name="trend"
          query={context.trendPeriods.toString()}
          title="Trend Periods"
          isSimple={true}
          setText={(x) => dispatch(setTrendPeriods(x))}
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
            innerClass="border-2 focus:border-blue-500 border-content/20"
            id={2}
            className="col-span-2"
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
            id={2}
            className="col-span-2"
          />
        )}
        <div className="col-span-2">
          <DatePickers showBtn={false} />
        </div>
      </div>
      <SelectedStoreList
        selectedStores={context.selectedStores}
        radioId={context.radioId}
      />
    </div>
  );
};

export default StoreDatePicker;
