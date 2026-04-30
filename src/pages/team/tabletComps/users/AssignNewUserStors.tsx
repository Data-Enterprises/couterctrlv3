import { useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../../../hooks";
import type { JsonError, Store } from "../../../../interfaces";
import {
  setStoresAssignedForUser,
  setStoresUnassignedForUser,
} from "../../../../features/usersSlice";
import { assignUserToStore, unassignUserFromStore } from "../../../../api/team";
import Input from "../../../../components/inputs/Input";
import { setRefreshStores } from "../../../../features/userSlice";

const AssignNewUserStores = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const { selectedUserStores, selectedUserId } = useAppSelector(
    (state) => state.users,
  );
  const [storesToAssign, setStoresToAssign] = useState<number[]>([]);
  const [storesToUnassign, setStoresToUnassign] = useState<number[]>([]);
  const [unassignedSearch, setUnassignedSearch] = useState<string>("");
  const [assignedSearch, setAssignedSearch] = useState<string>("");

  if (!selectedUserStores) {
    return null;
  }

  const assignedStores = selectedUserStores.assigned;
  const unassignedStores = selectedUserStores.unassigned;

  const filteredStores = (stores: Store[], search: string) => {
    if (search.trim() === "") {
      return stores;
    }
    return stores.filter((store) =>
      store.store_name.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const handleUnassignedClick = (storeid: number) => {
    if (storesToAssign.includes(storeid)) {
      setStoresToAssign(storesToAssign.filter((id) => id !== storeid));
    } else {
      setStoresToAssign([...storesToAssign, storeid]);
    }
  };

  const handleAssignedClick = (storeid: number) => {
    if (storesToUnassign.includes(storeid)) {
      setStoresToUnassign(storesToUnassign.filter((id) => id !== storeid));
    } else {
      setStoresToUnassign([...storesToUnassign, storeid]);
    }
  };

  const handleStoreAssignment = (type: "all" | "selected") => {
    const stores = filteredStores(unassignedStores, unassignedSearch);
    const storeids =
      type === "all" ? stores.map((s) => s.storeid) : storesToAssign;
    // dispatch(setStoresUnassignedForUser(storeids));
    dispatch(setStoresAssignedForUser(storeids));
    assignUserToStore(url, token, selectedUserId, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setStoresToAssign([]);
          // getStores(selectedUserId);
          if (selectedUserId === userid) {
            dispatch(setRefreshStores(true));
          }
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error assigning stores: " + err.message),
      );
  };

  const handleStoreUnassignment = (type: "all" | "selected") => {
    const stores = filteredStores(assignedStores, assignedSearch);
    const storeids =
      type === "all" ? stores.map((s) => s.storeid) : storesToUnassign;
    dispatch(setStoresUnassignedForUser(storeids));
    unassignUserFromStore(url, token, selectedUserId, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setStoresToUnassign([]);
          // getStores(selectedUserId);
          if (selectedUserId === userid) {
            dispatch(setRefreshStores(true));
          }
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error unassigning stores: " + err.message),
      );
  };

  const stores = filteredStores(unassignedStores, unassignedSearch);
  console.log(stores)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="min-w-0 border space-y-3 bg-custom-white p-3 rounded-xl shadow-lg">
        <Input
          label={"Search Unassigned Stores " + filteredStores(unassignedStores, unassignedSearch).length}
          value={unassignedSearch}
          setValue={setUnassignedSearch}
        />
        <div className="min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {filteredStores(unassignedStores, unassignedSearch).map((store, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 border rounded-lg border-slate-100 p-3 shadow-sm transition-all duration-200 ${storesToAssign.includes(store.storeid) ? "bg-[rgb(30,45,80)]/25" : "bg-custom-white"}`}
              onClick={() => handleUnassignedClick(store.storeid)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-content">
                  {store.store_name}
                </div>
                <div className="truncate text-sm text-content/60">
                  #{store.store_number} · {store.company_name}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <button
            className={`bg-[rgb(30,45,80)] ${storesToAssign.length === 0 ? "opacity-50 cursor-not-allowed" : ""} text-custom-white rounded-xl py-4`}
            onClick={() => handleStoreAssignment("selected")}
            disabled={storesToAssign.length === 0}
          >
            Assign Selected
          </button>
          <button
            className="bg-[rgb(30,45,80)] text-custom-white rounded-xl py-4"
            onClick={() => handleStoreAssignment("all")}
          >
            Assign All
          </button>
        </div>
      </div>
      <div className="min-w-0 border p-3 space-y-3 bg-custom-white shadow-lg rounded-xl">
        <Input
          label={"Search Assigned Stores " + filteredStores(assignedStores, assignedSearch).length}
          value={assignedSearch}
          setValue={setAssignedSearch}
        />
        <div className="min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {filteredStores(assignedStores, assignedSearch).map((store,i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 shadow-sm transition-all duration-200 ${storesToUnassign.includes(store.storeid) ? "bg-red-100" : "bg-custom-white"}`}
              onClick={() => handleAssignedClick(store.storeid)}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-content">
                  {store.store_name}
                </div>
                <div className="truncate text-sm text-content/60">
                  #{store.store_number} · {store.company_name}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <button
            className="bg-red-600 text-custom-white rounded-xl py-4"
            onClick={() => handleStoreUnassignment("selected")}
          >
            Unassign Selected
          </button>
          <button
            className="bg-red-600 text-custom-white rounded-xl py-4"
            onClick={() => handleStoreUnassignment("all")}
          >
            Unassign All
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignNewUserStores;
