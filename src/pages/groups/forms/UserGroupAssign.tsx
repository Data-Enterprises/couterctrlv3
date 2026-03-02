import { useState } from "react";
import { useGroupCtx } from "..";
import { useAppDispatch, useAppSelector } from "../../../hooks";
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

const UserGroupAssign = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, userid, groups, selectedGroup, storesWithGroupStatus } =
    useGroupCtx();
  const { isDesktop } = useAppSelector((state) => state.app);

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
      removeStoreFromGroup(url, token, userid, selectedGroup.id, storeid)
        // .then((resp) => {
        //   const j = resp.data;
        //   if (j.error == "0") {
        //     toast.success("Store removed from group successfully");
        //   }
        // })
        .catch((err: JsonError) => toast.error(err.message));
      dispatch(updateStoresWithStatus(storeid));
    } else {
      addStoreToGroup(url, token, userid, selectedGroup.id, storeid)
        // .then((resp) => {
        //   const j = resp.data;
        //   if (j.error == "0") {
        //     toast.success("Store added to group successfully");
        //   }
        // })
        .catch((err: JsonError) => toast.error(err.message));
      dispatch(updateStoresWithStatus(storeid));
    }
  };

  const assignContainerStyle = isDesktop
    ? "bg-custom-white p-2 w-[49%] rounded-lg shadow-lg h-[70vh] absolute"
    : "bg-custom-white p-2 w-[49%] rounded-lg shadow-lg h-[65vh] absolute text-xs";

  return (
    <div className={`${isDesktop ? "w-[55%]" : "w-full"} space-y-4`}>
      <SingleSelect
        label="Select User Group"
        data={groups}
        displayKey="group_name"
        valueKey="id"
        onSelect={getGroupStores}
      />
      <div className="flex gap-4 relative w-[99.5%]">
        <div className={assignContainerStyle}>
          <Input
            label={`Unassigned - ${filtered(storesWithGroupStatus, unassignedFilter, 0).length}`}
            value={unassignedFilter}
            setValue={handleUnassignedFilterText}
          />
          <div className="space-y-2 my-2 rounded-lg min-h-[85%] max-h-[85%] overflow-hidden overflow-y-scroll no-scrollbar">
            {filtered(storesWithGroupStatus, unassignedFilter, 0).map(
              (store) => (
                <div
                  key={store.storeid}
                  data-testid={`unassigned-store-${store.storeid}`}
                  className={`bg-custom-white flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                  onClick={() => handleStoreClick(store.storeid, "unassigned")}
                >
                  <div
                    className={`font-medium space-y-0.5 ${isDesktop ? "" : "text-[12px]"} `}
                  >
                    <div>Store {store.store_number}</div>
                    <div>
                      {store.storeid} - {store.store_name}
                    </div>
                  </div>
                  {isDesktop ? (
                    <div
                      className={`${
                        store.active ? "text-emerald-500" : "text-orange-500"
                      } font-medium`}
                    >
                      {store.active ? "Active" : "Inactive"}
                    </div>
                  ) : null}
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
        <div className={assignContainerStyle + " translate-x-[105%]"}>
          <Input
            label={`Assigned - ${filtered(storesWithGroupStatus, assignedFilter, 1).length}`}
            value={assignedFilter}
            setValue={handleAssignedFilterText}
          />
          <div className="space-y-2 my-2 rounded-lg min-h-[85%] max-h-[85%] overflow-hidden overflow-y-scroll no-scrollbar">
            {filtered(storesWithGroupStatus, assignedFilter, 1).map((store) => (
              <div
                key={store.storeid}
                data-testid={`assigned-store-${store.storeid}`}
                className={`bg-custom-white flex items-center justify-between rounded-lg shadow-md p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                onClick={() => handleStoreClick(store.storeid, "assigned")}
              >
                <div
                  className={`font-medium space-y-0.5 ${isDesktop ? "" : "text-[12px]"} `}
                >
                  <div>Store {store.store_number}</div>
                  <div>
                    {store.storeid} - {store.store_name}
                  </div>
                </div>
                {isDesktop ? (
                  <div
                    className={`${
                      store.active ? "text-emerald-500" : "text-orange-500"
                    } font-medium`}
                  >
                    {store.active ? "Active" : "Inactive"}
                  </div>
                ) : null}
              </div>
            ))}
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
  );
};

export default UserGroupAssign;
