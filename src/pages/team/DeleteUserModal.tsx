import { useAppSelector, useAppDispatch } from "../../hooks";
import {
  setDeleteModalOpen,
  setRefresh,
  resetUserInfo,
} from "../../features/usersSlice";
import { deleteUser } from "../../api/team";
import { useToast } from "../../components/toasts/hooks/useToast";
import Modal from "../../components/Modal";

const DeleteUserModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { deleteModalOpen, userInfo } = useAppSelector((state) => state.users);

  const handleConfirmDelete = () => {
    deleteUser(context.url, context.token, userInfo.username)
      .then(() => {
        dispatch(resetUserInfo());
        handleClose();
        dispatch(setRefresh(true));
        toast.success("User deleted successfully");
      })
      .catch((err) => {
        toast.error("Error deleting user - " + err.message);
      });
  };

  const handleClose = () => {
    dispatch(setDeleteModalOpen(false));
  };

  return (
    <Modal isOpen={deleteModalOpen} onClose={handleClose}>
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">
          Deleting User - {userInfo.username}
        </h2>
        <p className="">Are you sure you want to remove</p>
        <div className="flex gap-1 justify-center">
          <div className="font-semibold">
            {userInfo.first_name} {userInfo.last_name}
          </div>
          <div>from the team?</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            data-testid="delete-user-modal-cancel"
            className="btn-themeOrange"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            data-testid="delete-user-modal-delete"
            className="btn-themeGreen"
            onClick={handleConfirmDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserModal;
