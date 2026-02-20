import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError } from "../../../interfaces";
import { deleteUser } from "../../../api/team";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { resetUserInfo, setIsDeletingUser, setRefresh, setSelectedUserForm } from "../../../features/usersSlice";

const DeleteUserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();

  const { url, token } = useAppSelector((state) => state.app);
  const { userInfo } = useAppSelector((state) => state.users);
  
  const handleDeleteUser = () => {
    deleteUser(url, token, userInfo.username)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("User Deleted, list of users has been refreshed");
          dispatch(resetUserInfo());
          dispatch(setRefresh(true));
          dispatch(setIsDeletingUser(false));
          dispatch(setSelectedUserForm(""));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 gap-4">
      <div>Are you sure you want to delete </div>
      <div>
        <div className="font-medium">Username = {userInfo.username}</div>
        <div className="font-medium">
          Name = {userInfo.first_name} {userInfo.last_name}
        </div>
        <div className="font-medium">Email = {userInfo.email}</div>
      </div>

      <div className="w-1/2 flex gap-2">
        <button className="btn-themeGreen w-1/2" onClick={handleDeleteUser}>
          Yes
        </button>
        <button
          className="btn-themeOrange w-1/2"
          onClick={() => dispatch(setIsDeletingUser(false))}
        >
          No
        </button>
      </div>
    </div>
  );
};

export default DeleteUserForm;
