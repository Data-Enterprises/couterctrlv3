import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { resetUserInfo } from "../../../features/usersSlice";

import { WarningIcon } from "../../../components/toasts/Icons";
import CreateUserForm from "./CreateUserForm";
import UpdateUserForm from "./UpdateUserForm";

const UserControls = () => {
  const dispatch = useAppDispatch();
  const { users, selectedUserId } = useAppSelector((state) => state.users);
  const user = useAppSelector((state) => state.user);
  const [mode, setMode] = useState<number>(0);

  const isOutranked = () => {
    const found = users.find((u) => u.id === selectedUserId);

    if (found) {
      return found.user_level > user.userLevel;
    }
    return false;
  };

  const handleReset = (x: number) => {
    setMode(x);
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
            onClick={() => handleReset(0)}
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-custom-white p-4 rounded-lg shadow-lg">
      <div className="grid grid-cols-3 gap-4">
        <button
          className={`${mode === 1 ? "btn-themeGreen" : mode === 0 ? "btn-themeBlue" : "btn-themeBlue opacity-70 pointer-events-none"}`}
          onClick={() => handleReset(1)}
        >
          Create User
        </button>
        <button
          className={`${mode === 2 ? "btn-themeGreen" : mode === 0 ? "btn-themeBlue" : "btn-themeBlue opacity-70 pointer-events-none"}`}
          onClick={() => handleReset(2)}
        >
          Update User
        </button>
        <button className="btn-themeBlue" onClick={() => handleReset(0)}>
          Reset
        </button>
      </div>
      {mode === 0 && (
        <div className="h-full flex justify-center items-start p-6">
          <div className="bg-custom-white p-4 text-[15px] rounded-lg shadow-lg text-center font-medium">
            <div>What would you like to do?</div>
            <div>Select one of the options above and follow the steps</div>
          </div>
        </div>
      )}
      {mode === 1 && <CreateUserForm />}
      {mode === 2 && <UpdateUserForm />}
    </div>
  );
};

export default UserControls;
