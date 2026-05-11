import { useState } from "react";
import { useGroupCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import {
  setSelectedGroup,
  setStoresWithGroupStatus,
  updateStoresWithStatus,
  type StoreWithGroupStatus,
} from "../../../features/groupSlice";
import type { JsonError } from "../../../interfaces";
import {
  addStoreToGroup,
  getStoresAssignedToUserGroup,
  removeStoreFromGroup,
} from "../../../api/groups";

import SingleSelect from "../../../components/SingleSelect";
import Input from "../../../components/inputs/Input";

const AssignStoresToGroup = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, storesWithGroupStatus } =
    useGroupCtx();

  const [unassignedFilter, setUnassignedFilter] = useState<string>("");
  const [assignedFilter, setAssignedFilter] = useState<string>("");

  const getGroupStores = (id: number | string) => {
    const group = groups.filter((g) => g.id === Number(id))[0];
    dispatch(setStoresWithGroupStatus([]));
    dispatch(setSelectedGroup(group));
    getStoresAssignedToUserGroup(url, token, userid, Number(id))
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          const stores = [...j.stores].sort((a, b) => b.active - a.active);
          dispatch(setStoresWithGroupStatus(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  };

  const filtered = (
    stores: StoreWithGroupStatus[],
    filter: string,
    active: 0 | 1,
  ) => {
    return stores.filter(
      (s) =>
        s.active === active &&
        s.store_name.toLowerCase().includes(filter.toLowerCase()),
    );
  };

  const handleUnassignedFilterText = (x: string) => {
    setUnassignedFilter(x);
  };

  const handleAssignedFilterText = (x: string) => {
    setAssignedFilter(x);
  };

  const handleStoreClick = (
    storeid: number,
    type: "assigned" | "unassigned",
  ) => {
    if (type === "assigned") {
      removeStoreFromGroup(url, token, userid, selectedGroup.id, storeid).catch(
        (err: JsonError) => toast.error(err.message),
      );
      dispatch(updateStoresWithStatus(storeid));
    } else {
      addStoreToGroup(url, token, userid, selectedGroup.id, storeid).catch(
        (err: JsonError) => toast.error(err.message),
      );
      dispatch(updateStoresWithStatus(storeid));
    }
  };

  return (
    <div className="p-3 bg-custom-white rounded-xl shadow-lg">
      <div className="w-full space-y-3">
        <SingleSelect
          id={1}
          label="Select User Group"
          data={groups}
          displayKey="group_name"
          valueKey="id"
          onSelect={getGroupStores}
        />
        <div className="flex flex-col lg:flex-row gap-4 relative">
          <div className="w-full lg:w-1/2 bg-slate-100 p-3 rounded-lg shadow-md">
            <Input
              label={`Unassigned - ${filtered(storesWithGroupStatus, unassignedFilter, 0).length}`}
              value={unassignedFilter}
              setValue={handleUnassignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg max-h-[calc(100vh-17rem)] pb-3 overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(storesWithGroupStatus, unassignedFilter, 0).map(
                (store) => (
                  <div
                    key={store.storeid}
                    data-testid={`unassigned-store-${store.storeid}`}
                    className="bg-custom-white flex items-start justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200 md:flex-row"
                    onClick={() =>
                      handleStoreClick(store.storeid, "unassigned")
                    }
                  >
                    <div className="font-medium space-y-0.5 text-[12px] w-full md:w-auto">
                      <div>Store {store.store_number}</div>
                      <div>
                        {store.storeid} - {store.store_name}
                      </div>
                    </div>
                    <div className="bg-red-600 text-custom-white px-2 py-0.5 rounded-full text-[12px]">
                      Inactive
                    </div>
                  </div>
                ),
              )}
            </div>
            {/* <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-themeGreen w-full"
              onClick={handleAssignStore}
            >
              Assign
            </button>
            <button className="btn-themeGreen w-full" onClick={handleAssignAll}>
              Assign All
            </button>
          </div> */}
          </div>
          <div className="w-full lg:w-1/2 bg-slate-100 p-3 rounded-lg shadow-md">
            <Input
              label={`Assigned - ${filtered(storesWithGroupStatus, assignedFilter, 1).length}`}
              value={assignedFilter}
              setValue={handleAssignedFilterText}
            />
            <div className="space-y-2 my-2 rounded-lg max-h-[calc(100vh-17rem)] pb-3 overflow-hidden overflow-y-scroll no-scrollbar">
              {filtered(storesWithGroupStatus, assignedFilter, 1).map(
                (store) => (
                  <div
                    key={store.storeid}
                    data-testid={`assigned-store-${store.storeid}`}
                    className="bg-custom-white text-[13px] flex items-start justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200 flex-col md:flex-row gap-2 md:gap-0"
                    onClick={() => handleStoreClick(store.storeid, "assigned")}
                  >
                    <div className="font-medium space-y-0.5 text-[12px] w-full md:w-auto">
                      <div>Store {store.store_number}</div>
                      <div>
                        {store.storeid} - {store.store_name}
                      </div>
                    </div>
                    <div className="bg-[rgb(30,45,80)] text-custom-white px-2 py-0.5 rounded-full text-[12px]">
                      Active
                    </div>
                  </div>
                ),
              )}
            </div>
            {/* <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-themeGreen w-full"
              // onClick={handleUnassignStore}
            >
              Unassign
            </button>
            <button
              className="btn-themeGreen w-full px-0"
              // onClick={handleUnassignAll}
            >
              Unassign All
            </button>
          </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStoresToGroup;
