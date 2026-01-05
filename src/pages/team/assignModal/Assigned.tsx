import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { unassignUserFromStore } from "../../../api/team";
import type { JsonError, Store } from "../../../interfaces";
import { useEffect, useState } from "react";

interface AssignedProps {
  getData: () => void;
}

const Assigned = ({ getData }: AssignedProps) => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");

  const hasLength = () => {
    return stores.length > 0;
  };

  useEffect(() => {
    setStores(users.selectedUserStores.assigned);
  }, [users.selectedUserStores.assigned]);

  useEffect(() => {
    if (filterText.trim() === "") {
      setStores(users.selectedUserStores.assigned);
    } else {
      const filtered = users.selectedUserStores.assigned.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase())
      );
      setStores(filtered);
    }
  }, [filterText]);

  const handleUnassignStore = (storeId: number) => {
    unassignUserFromStore(
      context.url,
      context.token,
      users.selectedUserId,
      storeId
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getData();
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error unassigning store " + err.message);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  return (
    <div>
      <label htmlFor="assigned-user-stores" className="font-medium text-sm">
        Assigned - {users.selectedUserStores.assigned.length}
      </label>
      <input
        data-testid="ctrl-assigned-filter"
        type="text"
        name="assigned-user-stores"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="min-h-[400px] max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-4">
        {hasLength()
          ? stores.map((store) => (
              <div
                key={store.storeid}
                data-testid={`assigned-store-${store.storeid}`}
                className="bg-custom-white rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200"
                onClick={() => handleUnassignStore(store.storeid)}
              >
                {store.store_name} = ({store.storeid})
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default Assigned;
