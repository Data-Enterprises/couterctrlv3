import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { unassignUserFromStore } from "../../../api/team";
import type { JsonError, Store } from "../../../interfaces";
import { useEffect, useState } from "react";
import { setStoresUnassignedForUser } from "../../../features/usersSlice";
import { setRefreshStores } from "../../../features/userSlice";

const Assigned = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
  const userid = useAppSelector((state) => state.user.userid);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [storesToUnassign, setStoresToUnassign] = useState<number[]>([]);

  useEffect(() => {
    setStores(users.selectedUserStores.assigned);
  }, [users.selectedUserStores.assigned]);

  useEffect(() => {
    setStoresToUnassign([]);
    if (filterText.trim() === "") {
      setStores(users.selectedUserStores.assigned);
    } else {
      const filtered = users.selectedUserStores.assigned.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase()),
      );
      setStores(filtered);
    }
  }, [filterText, users.selectedUserStores.assigned]);

  const handleStoreCardClick = (storeId: number) => {
    setStoresToUnassign((prev) => {
      if (prev.includes(storeId)) {
        return prev.filter((s) => s !== storeId);
      }
      return [...prev, storeId];
    });
  };

  const handleStoreUnassignment = (type: "all" | "selected") => {
    const allToRemove = users.selectedUserStores.assigned.map((s) => s.storeid);
    const storeids = type === "all" ? allToRemove : storesToUnassign;
    dispatch(setStoresUnassignedForUser(storeids));
    unassignUserFromStore(
      context.url,
      context.token,
      users.selectedUserId,
      storeids,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0 && users.selectedUserId === userid) {
          dispatch(setRefreshStores(true));
        }
      })
      .catch((err: JsonError) => toast.error("Error: " + err.message));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  const hasLength = () => {
    return stores.length > 0;
  };

  return (
    <div className="p-2 bg-custom-white rounded-lg shadow-lg">
      <label htmlFor="assigned-user-stores" className="font-medium text-sm">
        <span>Assigned - {stores.length}</span>
      </label>
      <input
        data-testid="ctrl-assigned-filter"
        type="text"
        name="assigned-user-stores"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="h-[48vh] max-h-[48vh] overflow-y-auto no-scrollbar space-y-2 mt-4">
        {hasLength()
          ? stores.map((store) => (
              <div
                key={store.storeid}
                data-testid={`assigned-store-${store.storeid}`}
                className={`${storesToUnassign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex items-center justify-between rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                onClick={() => handleStoreCardClick(store.storeid)}
              >
                <div>
                  <div className="font-medium">Store:</div>
                  <div>{store.store_name}</div>
                </div>
                <div>
                  <div className="font-medium text-right">Company:</div>
                  <div>{store.company_name}</div>
                </div>
              </div>
            ))
          : null}
      </div>
      <div className="flex justify-between gap-2 mt-2">
        <button
          data-testid="ctrl-unassign-stores-btn"
          className="btn-themeGreen w-1/2 px-0"
          onClick={() => handleStoreUnassignment("selected")}
        >
          Unassign
        </button>
        <button
          data-testid="ctrl-unassign-all-stores-btn"
          className="btn-themeGreen w-1/2 px-0"
          onClick={() => handleStoreUnassignment("all")}
        >
          Unassign All
        </button>
      </div>
    </div>
  );
};

export default Assigned;
