import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  resetUserInfo,
  setSelectedUserForm,
  type UserFormType,
} from "../../../features/usersSlice";

import { WarningIcon } from "../../../components/toasts/Icons";
import UserForm from "./UserForm";
import DeleteUserForm from "./DeleteUserForm";

const UserControls = () => {
  const dispatch = useAppDispatch();
  const { users, selectedUserId, selectedUserForm } = useAppSelector(
    (state) => state.users,
  );
  const user = useAppSelector((state) => state.user);

  const isOutranked = () => {
    const found = users.find((u) => u.id === selectedUserId);

    if (found) {
      return found.user_level > user.userLevel;
    }
    return false;
  };

  const handleReset = (x: UserFormType) => {
    dispatch(setSelectedUserForm(x));
    dispatch(resetUserInfo());
  };

  // If user is selected from the grid but logged in user is not authorized to make changes
  if (isOutranked()) {
    return (
      <div className="flex justify-center items-center">
        <div className="bg-custom-white p-4 rounded-lg shadow-lg font-medium text-sm flex flex-col items-center">
          <WarningIcon fill="#f97316" height={56} width={56} />
          <div className="mb-2">We're sorry...</div>
          <div>You are not authorized to make changes to this user</div>
          <div>Please contact them if assistance is needed</div>
          <button
            className="btn-themeBlue py-1.5 mt-2"
            onClick={() => handleReset("")}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-custom-white p-4 rounded-lg shadow-lg">
      <div className="grid grid-cols-4 gap-4">
        <button
          className={`${selectedUserForm === "create" ? "btn-themeGreen" : !selectedUserForm ? "btn-themeBlue" : "btn-themeBlue opacity-70 pointer-events-none"}`}
          onClick={() => handleReset("create")}
        >
          Create
        </button>
        <button
          className={`${selectedUserForm === "update" ? "btn-themeGreen" : !selectedUserForm ? "btn-themeBlue" : "btn-themeBlue opacity-70 pointer-events-none"}`}
          onClick={() => handleReset("update")}
        >
          Update
        </button>
        <button
          className={`${selectedUserForm === "delete" ? "btn-themeGreen" : !selectedUserForm ? "btn-themeBlue" : "btn-themeBlue opacity-70 pointer-events-none"}`}
          onClick={() => handleReset("delete")}
        >
          Delete
        </button>
        <button className="btn-themeBlue" onClick={() => handleReset("")}>
          Reset
        </button>
      </div>
      {!selectedUserForm ? (
        <div className="h-full flex justify-center items-start">
          <div className="bg-custom-white p-4 text-[15px] text-center font-medium">
            <div>What would you like to do?</div>
            <div>Select one of the options above and follow the steps</div>
          </div>
        </div>
      ) : selectedUserForm === "delete" ? (
        <DeleteUserForm />
      ) : (
        <UserForm />
      )}
    </div>
  );
};

export default UserControls;
