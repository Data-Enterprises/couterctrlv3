import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setAssignModalOpen,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import { getUserStores } from "../../../api/user";
import type { JsonError } from "../../../interfaces";
import Modal from "../../../components/Modal";
import { roles } from "..";
import Assigned from "./Assigned";
import Unassigned from "./Unassigned";

const AssignStoresModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);

  const getData = () => {
    getUserStores(context.url, context.token, users.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: j.assigned_stores,
            unassigned: j.unassigned_stores,
          };
          dispatch(setSelectedUserStores(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
  };

  useEffect(() => {
    if (users.assignModalOpen) {
      getData();
    }
  }, [users.assignModalOpen]);

  const renderUserRole = () => {
    return roles.find((level) => level.value == users.userInfo.role)!.label;
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
        <Unassigned getData={getData} />
        <Assigned getData={getData} />
      </div>
    </Modal>
  );
};

export default AssignStoresModal;
