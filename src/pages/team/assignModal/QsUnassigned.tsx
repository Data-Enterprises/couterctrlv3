import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError, Store } from "../../../interfaces";
import {
  addQuicksightStoreForUser,
  assignAllPermissionsForUser,
} from "../../../api/quicksight";
import { setQsUserStores } from "../../../features/qsSlice";

const QsUnassigned = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const qs = useAppSelector((state) => state.quicksight);
  const [isAssigningAll, setIsAssigningAll] = useState<boolean>(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  // const [storesToAssign, setStoresToAssign] = useState<Store[]>([]);

  const hasLength = () => {
    return stores.length > 0;
  };

  useEffect(() => {
    if (filterText.trim() === "") {
      setStores(qs.qsUserUnassignedStores);
    } else {
      const filtered = qs.qsUserUnassignedStores.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase()),
      );
      setStores(filtered);
    }
  }, [filterText, qs.qsUserUnassignedStores]);

  const handleAssignStore = (storeId: number) => {
    const id = storeId.toString();
    const store = qs.qsUserUnassignedStores.find(
      (s: Store) => s.storeid === storeId,
    );

    const stores = [...qs.qsUserAssignedStores, store!].sort(
      (a, b) => a.storeid - b.storeid,
    );
    const unassignedStores = [...qs.qsUserUnassignedStores].filter(
      (s) => s.storeid !== storeId,
    );
    dispatch(
      setQsUserStores({
        assigned_stores: stores,
        unassigned_stores: unassignedStores,
      }),
    );

    addQuicksightStoreForUser(
      context.url,
      context.token,
      qs.selectedQsUserEmail,
      id,
    ).catch((err: JsonError) => {
      toast.error(err.message);
    });
  };

  const toggleDisplay = () => {
    setIsAssigningAll(!isAssigningAll);
  };

  const handleAssignAllStores = () => {
    assignAllPermissionsForUser(
      context.url,
      context.token,
      qs.selectedQsUserEmail,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("All stores assigned successfully");
          const allStores = [
            ...qs.qsUserAssignedStores,
            ...qs.qsUserUnassignedStores,
          ].sort((a, b) => a.storeid - b.storeid);
          dispatch(
            setQsUserStores({
              assigned_stores: allStores,
              unassigned_stores: [],
            }),
          );
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      })
      .finally(() => setIsAssigningAll(false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  return (
    <div>
      <div className="font-medium text-sm pl-0.5 flex justify-between">
        <div>Unassigned - {qs.qsUserUnassignedStores.length}</div>
        <div
          data-testid="assign-all-qs-btn"
          className="hover:underline hover:text-orange-500 cursor-pointer transition-color duration-200"
          onClick={toggleDisplay}
        >
          Assign All
        </div>
      </div>
      <input
        data-testid="qs-unassigned-filter"
        type="text"
        name="assigned-user-stores"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="min-h-[400px] max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-2">
        {hasLength() && !isAssigningAll ? (
          stores.map((store) => (
            <div
              key={store.storeid}
              data-testid={`unassigned-qs-store-${store.storeid}`}
              className="bg-custom-white rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200"
              onClick={() => handleAssignStore(store.storeid)}
            >
              {store.store_name} = ({store.storeid})
            </div>
          ))
        ) : isAssigningAll ? (
          <div className="min-h-[400px] max-h-[400px] flex flex-col justify-center gap-2">
            <div className="text-sm text-center font-medium">
              Are you sure you want to assign all?
            </div>
            <button
              data-testid="confirm-assign-all-qs-btn"
              className="btn-themeGreen"
              onClick={handleAssignAllStores}
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

export default QsUnassigned;
