import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  setAssignModalOpen,
  setSelectedUserStores,
  type UserStores,
} from "../../features/usersSlice";
import { getUserStores } from "../../api/user";
import { assignUserToStore, unassignUserFromStore } from "../../api/team";
import type { JsonError, Store, UnassignedStore } from "../../interfaces";
import Modal from "../../components/Modal";
import { roles } from ".";

const AssignStoresModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);

  useEffect(() => {
    if (users.assignModalOpen) {
      // Fetch available stores for the selected user
      getUserStores(context.url, context.token, users.selectedUserId)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const stores: UserStores = {
              assigned: j.assigned_stores as Store[],
              unassigned: j.unassigned_stores as UnassignedStore[],
            };
            dispatch(setSelectedUserStores(stores));
          }
        })
        .catch((err: JsonError) => {
          toast.error("Error fetching available stores " + err.message);
        });
    }
  }, [users.assignModalOpen]);

  const hasLength = (type: "assigned" | "unassigned") => {
    if (type === "assigned") {
      return users.selectedUserStores.assigned.length > 0;
    } else {
      return users.selectedUserStores.unassigned.length > 0;
    }
  };

  const renderUserRole = () => {
    return roles.find((level) => level.value == users.userInfo.role)!.label;
  };

  const handleAssignStore = (storeId: number) => {
    // endpoint expects an array of store ids
    assignUserToStore(context.url, context.token, users.selectedUserId, [
      storeId,
    ])
      .then((resp) => {
        const j = resp.data;
        console.log("Assigned!!!", j);
      })
      .catch((err: JsonError) => {
        toast.error("Error assigning store " + err.message);
      });
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
      })
      .catch((err: JsonError) => {
        toast.error("Error unassigning store " + err.message);
      });
  };

  return (
    <Modal
      isOpen={users.assignModalOpen}
      onClose={() => dispatch(setAssignModalOpen(false))}
      modalClassName="bg-bkg w-[600px]"
    >
      <div className="font-medium grid grid-cols-3 mb-4">
        <div className="w-full ">
          {users.userInfo.first_name} {users.userInfo.last_name || ""}
        </div>
        <div className="w-full text-center">{users.userInfo.username}</div>
        <div className="w-full text-right">{renderUserRole()} User</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="unassigned-user-stores"
            className="font-medium text-sm"
          >
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
                    className="bg-custom-white rounded-lg shadow p-3 text-sm"
                    onClick={() => handleAssignStore(store.storeid)}
                  >
                    {store.store_name_x} = ({store.storeid})
                  </div>
                ))
              : null}
          </div>
        </div>
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
                    className="bg-custom-white rounded-lg shadow p-3 text-sm"
                    onClick={() => handleUnassignStore(store.storeid)}
                  >
                    {store.store_name} = ({store.storeid})
                  </div>
                ))
              : null}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignStoresModal;
