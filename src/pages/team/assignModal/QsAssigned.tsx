import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  removeQuicksightStoreForUser,
  removeAllPermissionsForUser,
} from "../../../api/quicksight";
import type { JsonError, Store } from "../../../interfaces";
import { setQsUserStores } from "../../../features/qsSlice";

const QsAssigned = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const qs = useAppSelector((state) => state.quicksight);
  const [isUnassigningAll, setIsUnassigningAll] = useState<boolean>(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");

  const hasLength = () => {
    return stores.length > 0;
  };

  useEffect(() => {
    if (filterText.trim() === "") {
      setStores(qs.qsUserAssignedStores);
    } else {
      const filtered = qs.qsUserAssignedStores.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase()),
      );
      setStores(filtered);
    }
  }, [filterText, qs.qsUserAssignedStores]);

  const handleUnassignStore = (storeId: number) => {
    const id = storeId.toString();
    const store = qs.qsUserAssignedStores.find((s) => s.storeid === storeId);
    const stores = [...qs.qsUserUnassignedStores, store!].sort(
      (a, b) => a.storeid - b.storeid,
    );
    const assignedStores = [...qs.qsUserAssignedStores].filter(
      (s) => s.storeid !== storeId,
    );
    dispatch(
      setQsUserStores({
        assigned_stores: assignedStores,
        unassigned_stores: stores,
      }),
    );

    removeQuicksightStoreForUser(
      context.url,
      context.token,
      qs.selectedQsUserEmail,
      id,
    ).catch((err: JsonError) => {
      toast.error(err.message);
    });
  };

  const toggleDisplay = () => {
    setIsUnassigningAll(!isUnassigningAll);
  };

  const handleUnassignAllStores = () => {
    removeAllPermissionsForUser(
      context.url,
      context.token,
      qs.selectedQsUserEmail,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("All stores removed successfully");
          const allStores = [
            ...qs.qsUserAssignedStores,
            ...qs.qsUserUnassignedStores,
          ].sort((a, b) => a.storeid - b.storeid);
          dispatch(
            setQsUserStores({
              assigned_stores: [],
              unassigned_stores: allStores,
            }),
          );
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      })
      .finally(() => setIsUnassigningAll(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  return (
    <div className="select-none">
      <div className="font-medium text-sm pl-0.5 flex justify-between">
        <div>Assigned - {qs.qsUserAssignedStores.length}</div>
        <div
          data-testid="unassign-all-qs-btn"
          className="hover:underline hover:text-emerald-500 cursor-pointer transition-color duration-200"
          onClick={toggleDisplay}
        >
          Unassign All
        </div>
      </div>
      <input
        data-testid="qs-assigned-filter"
        type="text"
        name="assigned-user-stores"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="min-h-[400px] max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-2">
        {hasLength() && !isUnassigningAll ? (
          stores.map((store) => (
            <div
              key={store.storeid}
              data-testid={`assigned-qs-store-${store.storeid}`}
              className="bg-custom-white rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200"
              onClick={() => handleUnassignStore(store.storeid)}
            >
              <div>{store.company_name}</div>
              <div>{store.store_name}</div>
            </div>
          ))
        ) : isUnassigningAll ? (
          <div className="min-h-[400px] max-h-[400px] flex flex-col justify-center gap-2">
            <div className="text-sm text-center font-medium">
              Are you sure you want to unassign all?
            </div>
            <button
              data-testid="confirm-unassign-all-qs-btn"
              className="btn-themeGreen"
              onClick={handleUnassignAllStores}
            >
              Confirm
            </button>
            <button className="btn-themeOrange" onClick={toggleDisplay}>
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default QsAssigned;
