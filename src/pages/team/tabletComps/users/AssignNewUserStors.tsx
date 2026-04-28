import { useState } from "react";
import { useAppSelector } from "../../../../hooks";
import Input from "../../../../components/inputs/Input";
import type { Store } from "../../../../interfaces";

/**
 *
 * properties of selectedUserStores:
 * assigned: Store[]
 * unassigned: Store[]
 *
 * Store properties:
 * storeid: number
 * store_name: string
 * store_number: string
 * company: number
 * company_name: string
 */

const AssignNewUserStores = () => {
  const { selectedUserStores } = useAppSelector((state) => state.users);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="min-w-0 border space-y-3 bg-custom-white p-3 rounded-xl shadow-lg">
        <Input
          label="Search Unassigned Stores"
          value={unassignedSearch}
          setValue={setUnassignedSearch}
        />
        <div className="min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {filteredStores(unassignedStores, unassignedSearch).map((store) => (
            <div
              key={store.storeid}
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
          <button className="bg-[rgb(30,45,80)] text-custom-white rounded-xl py-4">
            Assign Selected
          </button>
          <button className="bg-[rgb(30,45,80)] text-custom-white rounded-xl py-4">
            Assign All
          </button>
        </div>
      </div>
      <div className="min-w-0 border p-3 space-y-3 bg-custom-white shadow-lg rounded-xl">
        <Input
          label="Search Assigned Stores"
          value={assignedSearch}
          setValue={setAssignedSearch}
        />
        <div className="min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {filteredStores(assignedStores, assignedSearch).map((store) => (
            <div
              key={store.storeid}
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
          <button className="bg-red-600 text-custom-white rounded-xl py-4">
            Unassign Selected
          </button>
          <button className="bg-red-600 text-custom-white rounded-xl py-4">
            Unassign All
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignNewUserStores;
