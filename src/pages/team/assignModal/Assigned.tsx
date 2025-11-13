import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { unassignUserFromStore } from "../../../api/team";
import type { JsonError } from "../../../interfaces";

interface AssignedProps {
  getData: () => void;
}

const Assigned = ({ getData }: AssignedProps) => {
  const toast = useToast();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);

  const hasLength = (type: "assigned" | "unassigned") => {
    if (type === "assigned") {
      return users.selectedUserStores.assigned.length > 0;
    } else {
      return users.selectedUserStores.unassigned.length > 0;
    }
  };

  const handleUnassignStore = (storeId: number) => {
    unassignUserFromStore(
      context.url,
      context.token,
      users.selectedUserId,
      storeId
    )
      .then((resp) => {
        const j = resp.data;
        console.log("Unassigned!!!", j);
        getData();
      })
      .catch((err: JsonError) => {
        toast.error("Error unassigning store " + err.message);
      });
  };

  return (
    <div>
      <label htmlFor="assigned-user-stores" className="font-medium text-sm">
        Assigned
      </label>
      <input
        type="text"
        name="assigned-user-stores"
        className="basic-input focus:border bg-custom-white"
      />
      <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-4 shadow-lg">
        {hasLength("assigned")
          ? users.selectedUserStores.assigned.map((store) => (
              <div
                key={store.storeid}
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
