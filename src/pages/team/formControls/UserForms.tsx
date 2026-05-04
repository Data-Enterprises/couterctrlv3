import {
  resetUserInfo,
  setSelectedForm,
  setSelectedUserForm,
  type UserFormType,
} from "../../../features/usersSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";

const UserForms = () => {
  const dispatch = useAppDispatch();
  const { selectedUserForm } = useAppSelector((state) => state.users);

  const handleReset = (x: UserFormType) => {
    dispatch(setSelectedUserForm(x));
    dispatch(resetUserInfo());
  };

  const handleGoBack = () => {
    dispatch(setSelectedUserForm(""));
    dispatch(resetUserInfo());
    dispatch(setSelectedForm(0));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg min-w-36 text-sm select-none">
      <div className="font-medium px-2 rounded-t-lg py-0.5">Forms</div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div
        data-testid="user-form-goback"
        className={`hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={handleGoBack}
      >
        Go Back
      </div>
      <div
        data-testid="user-form-create"
        className={`${selectedUserForm === "create" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("create")}
      >
        Create
      </div>
      <div
        data-testid="user-form-update"
        className={`${selectedUserForm === "update" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("update")}
      >
        Update
      </div>
      <div
        data-testid="user-form-delete"
        className={`${selectedUserForm === "delete" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("delete")}
      >
        Delete
      </div>
      <div
        data-testid="user-form-update-pw"
        className={`${selectedUserForm === "update_password" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("update_password")}
      >
        Password
      </div>
      <div
        data-testid="user-form-update-sq"
        className={`${selectedUserForm === "reset_security" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("reset_security")}
      >
        Security
      </div>
      <div
        data-testid="user-form-info"
        className={`${selectedUserForm === "user_info" ? "bg-orange-200" : ""} hover:cursor-pointer hover: hover:bg-blue-200 transition-all duration-200 py-1 px-2`}
        onClick={() => handleReset("user_info")}
      >
        Info
      </div>
    </div>
  );
};

export default UserForms;
