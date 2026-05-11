import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

import {
  setNewStoreNameText,
  setSelectedStoreInfo,
  allCompFilter,
} from "../../../../features/adminSlice";
import type { JsonError, Store } from "../../../../interfaces";

import { getUserStores } from "../../../../api/user";
import { setNewStoreName } from "../../../../api/admin";

import Input from "../../../../components/inputs/Input";
import {
  setAssignedStores,
  setUnassignedStores,
} from "../../../../features/userSlice";

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

const NewStoreName = () => {
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

  const handleCompanySelect = (company: number) => {
    setCompanyId(company);
  };

  const handleNewNameTextChange = (x: string) => {
    dispatch(setNewStoreNameText(x));
  };

  const handleStoreSelect = (store: number) => {
    const storeInfo = filteredStores.find((s) => s.storeid === store);
    if (storeInfo) {
      dispatch(setSelectedStoreInfo(storeInfo));
    }
  };

  const handleAssignedFilterChange = (filter: AssignedFilter) => {
    setAssignedFilter(filter);
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

  const companyOptions = [allCompFilter, ...companies];

  return (
    <div className="bg-custom-white rounded-2xl shadow-sm p-3 space-y-3">
      <div className="text-[12px] font-medium text-slate-500 text-center">
        Ensure the new store name is unique from the current name
      </div>

      {/* Filters */}
      <div className="grid gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            Companies
          </div>
          <div className="flex flex-wrap gap-1.5">
            {companyOptions.map((c, i) => (
              <button
                key={i}
                onClick={() => handleCompanySelect(c.company)}
                className={`px-2 py-1.5 rounded-full text-[11.5px] font-medium transition-all duration-200 ${
                  companyId === c.company
                    ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                    : "bg-bkg"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
            Assignment
          </div>
          <div className="flex flex-wrap gap-1.5">
            {options.map((o, i) => (
              <button
                key={i}
                onClick={() => handleAssignedFilterChange(o.value)}
                className={`px-2 py-1.5 rounded-full text-[11.5px] font-medium transition-all duration-200 ${
                  assignedFilter === o.value
                    ? "bg-[rgb(30,45,80)]/75 text-custom-white shadow-md"
                    : "bg-bkg"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store list */}
      <div className="max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredStores.map((s, i) => (
            <button
              key={i}
              onClick={() => handleStoreSelect(s.storeid)}
              className={`group rounded-xl border p-3 text-left transition-all duration-200 shadow-sm flex justify-between items-start ${
                selectedStoreInfo?.storeid === s.storeid
                  ? "bg-[rgb(30,45,80)]/75 border-[rgb(30,45,80)] text-custom-white shadow-md"
                  : "bg-bkg"
              }`}
            >
              <div>
                <div className="text-[11px] font-semibold opacity-90 flex gap-1">
                  <div>Store</div>
                  <div className="text-[11px] font-medium">
                    #{s.store_number}
                  </div>
                </div>
                <div className="text-[13px] font-semibold">
                  {s.store_name}
                </div>
              </div>
              <div className="text-[11.5px] font-medium text-content shadow-sm rounded-full px-2 bg-custom-white py-0.5">
                {s.company_name}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Selected Store Name"
            value={selectedStoreInfo ? selectedStoreInfo.store_name : ""}
            setValue={() => {}}
            className="opacity-50 pointer-events-none py-1.5 text-[13px]"
          />
          <Input
            label="New Store Name"
            value={newStoreNameText}
            setValue={handleNewNameTextChange}
            className="py-1.5 text-[13px]"
          />
        </div>
        <button
          data-testid="submit-new-store-name-btn"
          className={`btn-themeBlue w-full py-2 text-[13px] font-medium bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/85 hover:text-white transition-all duration-200 shadow-sm rounded-xl ${canSubmit()}`}
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default NewStoreName;
