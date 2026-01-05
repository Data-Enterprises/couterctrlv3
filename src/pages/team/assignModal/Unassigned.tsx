import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { assignUserToStore } from "../../../api/team";
import { type Store, type JsonError } from "../../../interfaces";
import { useEffect, useState } from "react";

interface UnassignedProps {
  getData: () => void;
}

const Unassigned = ({ getData }: UnassignedProps) => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterText, setFilterText] = useState<string>("");

  useEffect(() => {
    setStores(users.selectedUserStores.unassigned);
  }, [users.selectedUserStores.unassigned]);

  useEffect(() => {
    if (filterText.trim() === "") {
      setStores(users.selectedUserStores.unassigned);
    } else {
      const filtered = users.selectedUserStores.unassigned.filter((store) =>
        store.store_name.toLowerCase().includes(filterText.toLowerCase())
      );
      setStores(filtered);
    }
  }, [filterText]);

  const hasLength = () => {
    return stores.length > 0;
  };

  const handleAssignStore = (storeId: number) => {
    // endpoint expects an array of store ids
    assignUserToStore(context.url, context.token, users.selectedUserId, [
      storeId,
    ])
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          getData();
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error assigning store " + err.message);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilterText(value);
  };

  return (
    <div>
      <label htmlFor="unassigned-user-stores" className="font-medium text-sm">
        Unassigned - {users.selectedUserStores.unassigned.length}
      </label>
      <input
        name="unassigned-user-stores"
        type="text"
        className="basic-input focus:border bg-custom-white"
        value={filterText}
        onChange={handleChange}
      />
      <div className="min-h-[400px] max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-4">
        {hasLength()
          ? stores.map((store) => (
              <div
                key={store.storeid}
                data-testid={`unassigned-store-${store.storeid}`}
                className="bg-custom-white rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200"
                onClick={() => handleAssignStore(store.storeid)}
              >
                {store.store_name} = ({store.storeid})
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default Unassigned;
