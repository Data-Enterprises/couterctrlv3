import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  resetUserInfo,
  setSelectedUserForm,
  type UserFormType,
} from "../../../features/usersSlice";

import { WarningIcon } from "../../../components/toasts/Icons";
import UserForm from "./UserForm";
import ProfileCard from "./ProfileCard";
import SingleSelect from "../../../components/SingleSelect";

const UserControls = () => {
  const dispatch = useAppDispatch();
  const { users, selectedUserId, selectedUserForm } = useAppSelector(
    (state) => state.users,
  );
  const user = useAppSelector((state) => state.user);
  const isDesktop = useAppSelector((state) => state.app.isDesktop);

  const isOutranked = () => {
    const found = users.find((u) => u.id === selectedUserId);

    if (found) {
      return found.user_level > user.userLevel;
    }
    return false;
  };

  const handleReset = (x: UserFormType, isResettingForm = true) => {
    if (isResettingForm) {
      dispatch(setSelectedUserForm(x));
    }
    dispatch(resetUserInfo());
  };

  const options = [
    { label: "Create", value: "create" },
    { label: "Update", value: "update" },
    { label: "Delete", value: "delete" },
    { label: "Password", value: "update_password" },
    { label: "Security", value: "reset_security" },
    { label: "Info", value: "user_info" },
  ];

  const handleUserFormMobileSelect = (val: string | number) => {
    const form = String(val) as UserFormType;
    handleReset(form);
  };

  return (
    <div className="max-h-[65vh]">
      {isDesktop ? (
        <div className="grid grid-cols-6 text-[15px] gap-2 p-4 bg-custom-white rounded-lg shadow-lg mb-4">
          <button
            className={`${selectedUserForm === "create" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("create")}
          >
            Create
          </button>
          <button
            className={`${selectedUserForm === "update" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("update")}
          >
            Update
          </button>
          <button
            className={`${selectedUserForm === "delete" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("delete")}
          >
            Delete
          </button>
          <button
            className={`${selectedUserForm === "update_password" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("update_password")}
          >
            Password
          </button>
          <button
            className={`${selectedUserForm === "reset_security" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("reset_security")}
          >
            Security
          </button>
          <button
            className={`${selectedUserForm === "user_info" ? "btn-themeGreen" : "btn-themeBlue"} px-0`}
            onClick={() => handleReset("user_info")}
          >
            Info
          </button>
        </div>
      ) : (
        <SingleSelect
          label="Users"
          data={options}
          displayKey="label"
          valueKey="value"
          onSelect={handleUserFormMobileSelect}
        />
      )}
      {!selectedUserForm ? null : (
        <>
          <ProfileCard />
          {!isOutranked() ? (
            <UserForm />
          ) : (
            <div className="flex justify-center items-center bg-custom-white p-4 mt-4 rounded-lg shadow-lg">
              <div className="font-medium text-sm flex flex-col items-center">
                <WarningIcon fill="#f97316" height={56} width={56} />
                <div className="mb-2">We're sorry...</div>
                <div>You are not authorized to make changes to this user</div>
                <div>Please contact them if assistance is needed</div>
                <button
                  className="btn-themeBlue py-1.5 mt-2"
                  onClick={() => handleReset("", false)}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserControls;
