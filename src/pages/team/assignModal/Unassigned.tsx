import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { assignUserToStore } from "../../../api/team";
import { type Store, type JsonError } from "../../../interfaces";
import { useEffect, useState } from "react";
import { setStoresAssignedForUser } from "../../../features/usersSlice";

const Unassigned = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
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

  const handleAssignStore = () => {
    dispatch(setStoresAssignedForUser(storesToAssign));
    assignUserToStore(
      context.url,
      context.token,
      users.selectedUserId,
      storesToAssign,
    ).catch((err: JsonError) => {
      toast.error("Error assigning store " + err.message);
    });
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

  const handleAssignAll = () => {
    const allToAdd = users.selectedUserStores.unassigned.map((s) => s.storeid);
    dispatch(setStoresAssignedForUser(allToAdd));
    assignUserToStore(
      context.url,
      context.token,
      users.selectedUserId,
      allToAdd,
    ).catch((err: JsonError) => {
      toast.error("Error assigning store " + err.message);
    });
  };

  return (
    <div className="p-2 bg-custom-white rounded-lg shadow-lg h-[65vh]">
      <label htmlFor="unassigned-user-stores" className="font-medium text-sm">
        <span>Unassigned - {stores.length}</span>
      </label>
      <input
        data-testid="ctrl-unassigned-filter"
        name="unassigned-user-stores"
        type="text"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="min-h-[385px] max-h-[385px] overflow-y-auto no-scrollbar space-y-2 mt-4">
        {hasLength()
          ? stores.map((store) => (
              <div
                key={store.storeid}
                data-testid={`unassigned-store-${store.storeid}`}
                className={`${storesToAssign.includes(store.storeid) ? "bg-emerald-200" : "bg-custom-white"} flex justify-between rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200`}
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
          className="btn-themeGreen w-1/2 px-0"
          onClick={handleAssignStore}
        >
          Assign
        </button>
        <button className="btn-themeGreen w-1/2 px-0" onClick={handleAssignAll}>
          Assign All
        </button>
      </div>
    </div>
  );
};

export default Unassigned;
