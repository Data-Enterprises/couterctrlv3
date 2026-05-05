import { useEffect, useState } from "react";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import { setUserCompanyIds } from "../../../features/usersSlice";
import {
  resetSelectedBaseGroups,
  setBaseGroups,
  setCompany,
} from "../../../features/baseGroupSlice";

import type { CompanyBaseGroup, JsonError } from "../../../interfaces";

// Components/Icons
import DeleteUserForm from "./DeleteUserForm";
import UpdatePasswordForm from "./UpdatePasswordForm";
import UserInfo from "./UserInfo";
import ResetSecurityForm from "./ResetSecurity";
import UserInputs from "../users/UserInputs";
import UserCompanyBG from "../users/UserCompanyBG";
import { getBaseGroups } from "../../../api/baseGroups";

const UserForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [createStep, setCreateStep] = useState<number>(1);
  const { url, token } = useAppSelector((state) => state.app);
  const { selectedUserForm, selectedUserId, isDeletingUser } = useAppSelector(
    (state) => state.users,
  );
  const { selectedBaseGroups } = useAppSelector((state) => state.baseGroup);
  const user = useAppSelector((state) => state.user);

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
    if (createStep === 2) {
      getBaseGroups(url, token, user.companies[0].company)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setBaseGroups(j.groups));
            dispatch(setCompany(j.company[0]));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [createStep]);

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

  // Otherwise, we're either creating a new user or updating an existing one
  return (
    <div className="bg-custom-white rounded-lg shadow-lg mt-4 p-2 relative">
      <div className="flex gap-2 text-[12px] items-center select-none absolute top-2 right-2">
        <div
          className={`
            ${createStep === 1 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setCreateStep(1)}
        >
          User Info
        </div>
        <div
          className={`
            ${createStep === 2 ? "bg-[rgb(30,45,80)] text-custom-white" : "text-content bg-content/10"} 
            px-4 rounded-full py-0.5 cursor-pointer transition-all duration-200 hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white`}
          onClick={() => setCreateStep(2)}
        >
          Company/Base Groups
        </div>
      </div>

      {/* The inner forms */}
      {createStep === 1 && <UserInputs />}
      {createStep === 2 && <UserCompanyBG />}
    </div>
  );
};

export default UserForm;
