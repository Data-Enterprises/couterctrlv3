import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  setNewStoreNameText,
  setSelectedStoreInfo,
  allCompFilter,
} from "../../../features/adminSlice";
import type { JsonError, Store } from "../../../interfaces";

import { getUserStores } from "../../../api/user";
import { setNewStoreName } from "../../../api/admin";

import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";
import {
  setAssignedStores,
  setUnassignedStores,
} from "../../../features/userSlice";

type AssignedFilter = "all" | "assigned" | "unassigned";

type AssignedFilterOption = {
  label: string;
  value: AssignedFilter;
};

const options: AssignedFilterOption[] = [
  { label: "All", value: "all" },
  { label: "Assigned", value: "assigned" },
  { label: "Unassigned", value: "unassigned" },
];

const NewStoreNameForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { newStoreNameText, selectedStoreInfo } = useAppSelector(
    (state) => state.admin,
  );
  const { url, token } = useAppSelector((state) => state.app);
  const { companies, assignedStores, unassignedStores, userid } =
    useAppSelector((state) => state.user);

  // State for showing stores based on assigned/unassigned/all filter and company filter
  const [filteredStores, setFilteredStores] = useState<Store[]>([
    ...assignedStores,
    ...unassignedStores,
  ]);
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("all");
  const [companyId, setCompanyId] = useState<number>(0);

  useEffect(() => {
    let stores: Store[] = [];
    if (assignedFilter === "assigned") {
      stores = assignedStores;
    } else if (assignedFilter === "unassigned") {
      stores = unassignedStores;
    } else {
      stores = [...assignedStores, ...unassignedStores];
    }

    // Then filter by company => less items to iterate through if selecting assigned/unassigned first
    const filtered = stores.filter((s) => {
      return companyId > 0 ? s.company === companyId : true;
    });
    setFilteredStores(filtered);
  }, [assignedFilter, companyId, assignedStores, unassignedStores]);

  const handleCompanySelect = (company: string | number) => {
    setCompanyId(Number(company));
  };

  const handleNewNameTextChange = (x: string) => {
    dispatch(setNewStoreNameText(x));
  };

  const handleStoreSelect = (store: string | number) => {
    const storeInfo = filteredStores.find((s) => s.storeid === store);
    if (storeInfo) {
      dispatch(setSelectedStoreInfo(storeInfo));
    }
  };

  const handleAssignedFilterChange = (filter: string | number) => {
    setAssignedFilter(filter as AssignedFilter);
  };

  const canSubmit = () => {
    if (
      selectedStoreInfo &&
      newStoreNameText.length > 0 &&
      newStoreNameText.toLowerCase() !==
        selectedStoreInfo.store_name.toLowerCase()
    ) {
      return "";
    }

    return "opacity-50 pointer-events-none";
  };

  const handleSubmit = () => {
    setNewStoreName(url, token, selectedStoreInfo!.storeid, newStoreNameText)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Store name updated successfully. Refreshing...");
          dispatch(setSelectedStoreInfo(null));
          dispatch(setNewStoreNameText(""));
          getUserStores(url, token, userid)
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                const assigned = j.assigned_stores
                  .filter(
                    (s: Store) =>
                      s.store_number !== null && s.store_name !== null,
                  )
                  .sort(
                    (a: Store, b: Store) =>
                      parseInt(a.store_number) - parseInt(b.store_number),
                  );
                const unassigned = j.unassigned_stores
                  .filter(
                    (s: Store) =>
                      s.store_number !== null && s.store_name !== null,
                  )
                  .sort(
                    (a: Store, b: Store) =>
                      parseInt(a.store_number) - parseInt(b.store_number),
                  );

                dispatch(setAssignedStores(assigned));
                dispatch(setUnassignedStores(unassigned));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg p-2 w-[50%] space-y-1.5">
      {/* filters */}
      <div className="text-[12px] font-medium text-content/60 text-center">
        Ensure the new store name is unique from the current name
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SingleSelect
          id={1}
          label="Company"
          data={[allCompFilter, ...companies]}
          displayKey="name"
          valueKey="company"
          onSelect={handleCompanySelect}
          defaultQuery="All"
          innerClass="py-1 text-[13px]"
        />
        <SingleSelect
          id={2}
          label="Assignment"
          data={options}
          displayKey="label"
          valueKey="value"
          onSelect={handleAssignedFilterChange}
          defaultQuery="All"
          innerClass="py-1 text-[13px]"
        />
      </div>
      {/* store list */}
      <SingleSelect
        id={3}
        label={`Stores - ${filteredStores.length}`}
        data={filteredStores}
        displayKey="store_name"
        valueKey="storeid"
        innerClass="py-1 text-[13px]"
        onSelect={handleStoreSelect}
        resetQuery={true}
      />
      {/* input form */}
      <div className="space-y-2">
        <Input
          label="Selected Store Name"
          value={selectedStoreInfo ? selectedStoreInfo.store_name : ""}
          setValue={() => {}}
          className="opacity-50 pointer-events-none py-1 text-[13px]"
        />
        <Input
          label="New Store Name"
          value={newStoreNameText}
          setValue={handleNewNameTextChange}
          className="py-1 text-[13px]"
        />
        <button
          data-testid="submit-new-store-name-btn"
          className={`btn-themeBlue text-[13px] bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 w-full ${canSubmit()}`}
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default NewStoreNameForm;
