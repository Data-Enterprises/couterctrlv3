import { useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { assignUserToStore } from "../../../api/team";
import type { JsonError } from "../../../interfaces";

interface UnassignedProps {
  getData: () => void;
}

const Unassigned = ({ getData }: UnassignedProps) => {
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

  const handleAssignStore = (storeId: number) => {
    // endpoint expects an array of store ids
    assignUserToStore(context.url, context.token, users.selectedUserId, [
      storeId,
    ])
      .then((resp) => {
        const j = resp.data;
        console.log("Assigned!!!", j);
        getData();
      })
      .catch((err: JsonError) => {
        toast.error("Error assigning store " + err.message);
      });
  };

  return (
    <div>
      <label htmlFor="unassigned-user-stores" className="font-medium text-sm">
        Unassigned
      </label>
      <input
        name="unassigned-user-stores"
        type="text"
        className="basic-input focus:border bg-custom-white"
      />
      <div className="max-h-[400px] overflow-y-auto no-scrollbar space-y-2 mt-4 shadow-lg">
        {hasLength("unassigned")
          ? users.selectedUserStores.unassigned.map((store) => (
              <div
                key={store.storeid}
                className="bg-custom-white rounded-lg shadow p-3 text-sm cursor-pointer hover:bg-blue-200/50 hover:shadow-inner transition-all duration-200"
                onClick={() => handleAssignStore(store.storeid)}
              >
                {store.store_name_x} = ({store.storeid})
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

export default Unassigned;
