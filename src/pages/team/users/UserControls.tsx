import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  resetUserInfo,
  setSelectedUserForm,
  type UserFormType,
} from "../../../features/usersSlice";

import { WarningIcon } from "../../../components/toasts/Icons";
import UserForm from "./UserForm";
import ProfileCard from "../forms/ProfileCard";

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

  const handleReset = (x: UserFormType, isResettingForm = true) => {
    if (isResettingForm) {
      dispatch(setSelectedUserForm(x));
    }
    dispatch(resetUserInfo());
  };

  return (
    <div className="max-h-[65vh]">
      {!selectedUserForm ? null : (
        <>
          <ProfileCard />
          {!isOutranked() ? (
            <UserForm />
          ) : (
            <div
              data-testid="outranked-container"
              className="flex justify-center items-center bg-custom-white p-4 mt-4 rounded-lg shadow-lg"
            >
              <div className="font-medium text-sm flex flex-col items-center">
                <WarningIcon fill="#f97316" height={56} width={56} />
                <div className="mb-2">We're sorry...</div>
                <div>You are not authorized to make changes to this user</div>
                <div>Please contact them if assistance is needed</div>
                <button
                  data-testid="reset-outranked-btn"
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
