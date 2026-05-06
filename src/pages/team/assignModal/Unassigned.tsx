import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { assignUserToStore } from "../../../api/team";
import { type Store, type JsonError } from "../../../interfaces";
import { useEffect, useState } from "react";
import { setStoresAssignedForUser } from "../../../features/usersSlice";
import { setRefreshStores } from "../../../features/userSlice";

const Unassigned = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
  const userid = useAppSelector((state) => state.user.userid);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [storesToAssign, setStoresToAssign] = useState<number[]>([]);

  useEffect(() => {
    setStores(users.selectedUserStores.unassigned);
  }, [users.selectedUserStores.unassigned]);

  useEffect(() => {
    setStoresToAssign([]);
    if (filterText.trim() === "") {
      setStores(users.selectedUserStores.unassigned);
    } else {
      const filtered = users.selectedUserStores.unassigned.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase()),
      );
      setStores(filtered);
    }
  }, [filterText, users.selectedUserStores.unassigned]);

  const hasLength = () => {
    return stores.length > 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  const handleStoreCardClick = (
    // e: React.MouseEvent<HTMLDivElement>,
    storeId: number,
  ) => {
    // const isMultiSelect = e.shiftKey;

    setStoresToAssign((prev) => {
      if (prev.includes(storeId)) {
        return prev.filter((s) => s !== storeId);
      }
      return [...prev, storeId];
    });
  };

  const handleStoreAssignment = (type: "all" | "selected") => {
    const allToAdd = stores.map((s) => s.storeid);
    const storeids = type === "all" ? allToAdd : storesToAssign;
    dispatch(setStoresAssignedForUser(storeids));
    assignUserToStore(
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
      .catch((err: JsonError) => {
        toast.error("Error assigning store " + err.message);
      });
  };

  return (
    <div className="w-1/2 text-[13px]">
      <div className="bg-custom-white p-2 rounded-lg shadow-lg">
        <label htmlFor="unassigned-user-stores" className="font-medium">
          <span>Unassigned - {stores.length}</span>
        </label>
        <input
          data-testid="ctrl-unassigned-filter"
          name="unassigned-user-stores"
          type="text"
          className="basic-input focus:border bg-custom-white py-1.5"
          value={filterText}
          onChange={handleChange}
        />
        <div className="max-h-[calc(100vh-17.5rem)] overflow-y-auto no-scrollbar space-y-1 mt-2">
          {hasLength()
            ? stores.map((store, i) => (
                <div
                  key={i}
                  data-testid={`unassigned-store-${store.storeid}`}
                  className={`${storesToAssign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex justify-between rounded-lg shadow px-3 py-1.5 text-[12px] cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
                  onClick={() => handleStoreCardClick(store.storeid)}
                >
                  <div>
                    <div className="font-medium text-content/60">Store:</div>
                    <div>{store.store_name}</div>
                  </div>
                  <div>
                    <div className="underline text-[10px] font-medium text-content/60">{store.company_name}</div>
                  </div>
                </div>
              ))
            : null}
        </div>
        <div className="flex justify-between gap-2 mt-2">
          <button
            data-testid="ctrl-assign-stores-btn"
            className="btn-themeGreen w-1/2 px-0 py-1 text-[13px]"
            onClick={() => handleStoreAssignment("selected")}
          >
            Assign
          </button>
          <button
            data-testid="ctrl-assign-all-stores-btn"
            className="btn-themeGreen w-1/2 px-0 py-1 text-[13px]"
            onClick={() => handleStoreAssignment("all")}
          >
            Assign All
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unassigned;
