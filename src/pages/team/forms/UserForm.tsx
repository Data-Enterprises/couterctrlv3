import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import { resetUserInfo, setUserCompanyIds } from "../../../features/usersSlice";
import { resetSelectedBaseGroups } from "../../../features/baseGroupSlice";

import type { CompanyBaseGroup } from "../../../interfaces";

// Components/Icons
import { InfoIcon } from "../../../components/toasts/Icons";
// import UserFormButtons from "./UserFormButtons";
import DeleteUserForm from "./DeleteUserForm";
import UpdatePasswordForm from "./UpdatePasswordForm";
import UserInfo from "./UserInfo";
import ResetSecurityForm from "./ResetSecurity";
import UserInputs from "../users/UserInputs";
import UserCompanyBG from "../users/UserCompanyBG";

const UserForm = () => {
  const dispatch = useAppDispatch();
  const [createStep, setCreateStep] = useState<number>(1);
  const { selectedUserForm, selectedUserId, isDeletingUser } = useAppSelector(
    (state) => state.users,
  );
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);

  useEffect(() => {
    const selected = [...selectedBaseGroups];
    const newCompanyIds = selected.reduce(
      (acc: number[], curr: CompanyBaseGroup) => {
        if (!acc.includes(curr.company)) {
          acc.push(curr.company);
        }
        return acc;
      },
      [],
    );

    dispatch(setUserCompanyIds(newCompanyIds));
  }, [selectedBaseGroups]);

  useEffect(() => {
    if (selectedUserId === 0) {
      dispatch(resetSelectedBaseGroups());
    }
  }, [selectedUserId]);

  // if deleting a user or setting a temp password, check these components
  if (isDeletingUser) return <DeleteUserForm />;
  if (selectedUserForm === "update_password") return <UpdatePasswordForm />;
  if (selectedUserForm === "user_info") return <UserInfo />;
  if (selectedUserForm === "reset_security") return <ResetSecurityForm />;

  const handleClear = () => {
    dispatch(resetUserInfo());
  };

  // Otherwise, we're either creating a new user or updating an existing one
  return (
    <div className="bg-custom-white rounded-lg shadow-lg mt-4 p-2 space-y-2">
      <div className="flex items-center gap-1 select-none">
        <InfoIcon fill="#3b82f6" width={17} height={17} />
        <div className="text-[11px] font-medium text-content/70">
          Ensure all fields are valid before submitting
        </div>
      </div>
      {createStep === 1 && (
        <>
          <UserInputs />
          {/* <UserFormButtons formType={selectedUserForm} /> */}
          <div className="grid grid-cols-2 gap-4">
            <button
              className="btn-themeBlue px-0 py-1.5 text-sm"
              onClick={handleClear}
            >
              Clear Fields
            </button>
            <button
              className="btn-themeBlue px-0 py-1.5 text-sm"
              onClick={() => setCreateStep(2)}
            >
              Company/Base Groups
            </button>
          </div>
        </>
      )}
      {createStep === 2 && (
        <>
          <UserCompanyBG />
          <div className="grid grid-cols-2 gap-4">
            <button
              className="btn-themeBlue px-0 py-1.5 text-sm"
              onClick={() => setCreateStep(1)}
            >
              User Info
            </button>
            <button
              className="btn-themeBlue px-0 py-1.5 text-sm"
              onClick={() => setCreateStep(1)}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserForm;
