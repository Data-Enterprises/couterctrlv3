import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";

import { deleteUser } from "../../../api/team";

import { resetUserInfo, setRefresh } from "../../../features/usersSlice";
import type { JsonError } from "../../../interfaces";

import Modal from "../../../components/Modal";

interface DeleteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType: "user" | "company" | "store" | "base_group";
}

const DeleteFormModal = ({
  isOpen,
  onClose,
  formType,
}: DeleteFormModalProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useAppSelector((state) => state.users);
  const { url, token } = useAppSelector((state) => state.app);

  const handleDeleteEvent = () => {
    if (formType === "user") {
      deleteUser(url, token, ctx.userInfo.username)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            toast.success(
              `${ctx.userInfo.username} Deleted, list of users has been refreshed`,
            );
            dispatch(resetUserInfo());
            dispatch(setRefresh(true));
            onClose();
          }
        })
        .catch((err: JsonError) =>
          toast.error("Error deleting user: " + err.message),
        );
    }
  };

  const renderFormDetails = () => {
    switch (formType) {
      case "user":
        return (
          <div className="flex flex-col gap-2 text-sm md:text-base">
            <div className="font-medium break-words">
              Username = {ctx.userInfo.username}
            </div>
            <div className="font-medium break-words">
              Name = {ctx.userInfo.first_name} {ctx.userInfo.last_name}
            </div>
            <div className="font-medium break-words">
              Email = {ctx.userInfo.email}
            </div>
          </div>
        );
      case "company":
        return <div>Company Details</div>;
      case "store":
        return <div>Store Details</div>;
      case "base_group":
        return <div>Base Group Details</div>;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      modalClassName="bg-custom-white w-[92vw] max-w-md md:w-3/4 md:max-w-2xl"
    >
      <div className="flex flex-col items-center justify-center gap-4 p-4 md:p-6">
        <div className="text-center text-base md:text-lg">
          Are you sure you want to delete
        </div>

        {renderFormDetails()}

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:w-3/4 md:w-1/2">
          <button
            data-testid="delete-user-cancel-btn"
            className="bg-red-600 w-1/2 text-custom-white py-3 px-0 rounded-2xl shadow font-medium"
            onClick={onClose}
          >
            No
          </button>

          <button
            data-testid="delete-user-confirm-btn"
            className="bg-[rgb(30,45,80)]/95 w-1/2 text-custom-white py-3 px-0 rounded-2xl shadow font-medium"
            onClick={handleDeleteEvent}
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteFormModal;
