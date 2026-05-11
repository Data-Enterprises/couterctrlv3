import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { WarningIcon } from "../../../components/toasts/Icons";
import {
  resetUserInfo,
  setIsDeletingUser,
  setRefresh,
  setSelectedUserId,
} from "../../../features/usersSlice";
import { deleteUser } from "../../../api/team";
import type { JsonError } from "../../../interfaces";

const DeleteUserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserId, isDeletingUser, userInfo } = useAppSelector(
    (state) => state.users,
  );

  if (selectedUserId === 0 || !isDeletingUser) return null;

  const handleReset = () => {
    dispatch(setSelectedUserId(0));
    dispatch(resetUserInfo());
    dispatch(setIsDeletingUser(false));
  };

  const handleDelete = () => {
    deleteUser(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User Deleted Successfully");
          handleReset();
          dispatch(setRefresh(true));
        } else {
          toast.warn("Error Deleting User: " + j.message);
        }
      })
      .catch((err: JsonError) => toast.error("Error Deleting User: " + err.message));
  };

  return (
    <div className="rounded-lg bg-custom-white p-2 shadow-lg space-y-2 w-[80%]">
      <div className="flex items-start gap-2">
        <div className="flex h-[65px] w-[65px] shrink-0 items-center justify-center rounded-xl bg-orange-100 pb-0.5">
          <WarningIcon fill="#f97316" height={50} width={50} />
        </div>

        <div className="min-w-0 flex-1 rounded-lg bg-red-100/50 shadow py-2 text-center text-sm">
          <div className="text-center">
            Are you sure you want to delete user{" "}
            <span className="font-medium underline">{userInfo.username}</span>?
          </div>

          <div className="font-semibold text-red-600 mx-auto mt-2">
            Be advised, this action cannot be undone
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          className="rounded-lg border border-[rgb(30,45,80)] bg-[rgb(30,45,80)] py-1.5 text-[14px] font-medium text-custom-white shadow-md transition-all duration-200 hover:bg-[rgb(30,45,80)]/50"
          onClick={handleReset}
        >
          No
        </button>
        <button
          className="rounded-lg border border-red-600 bg-red-600 py-1.5 text-[14px] font-medium text-custom-white shadow-md transition-all duration-200 hover:bg-red-600/50"
          onClick={handleDelete}
        >
          Yes
        </button>
      </div>
    </div>
  );
};

export default DeleteUserForm;
